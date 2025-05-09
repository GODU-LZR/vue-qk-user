// src/api/config/index.js

import axios from 'axios';

// 创建 Axios 实例 (与主应用保持一致或按需调整)
const instance = axios.create({
    // --- 使用与主应用相同的 baseURL ---
    baseURL: 'http://124.71.58.72:8081/api', // API 网关地址
    timeout: 15000,
    // withCredentials: true, // 根据需要决定是否携带跨域 cookie
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- 请求拦截器 (适配子应用逻辑) ---
instance.interceptors.request.use(
    config => {
        // 1. 从 localStorage 获取 Token (使用子应用存储的键名 'auth_token')
        const token = localStorage.getItem('auth_token');

        if (token) {
            // 2. 如果有 Token，添加到 Authorization 头
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('[子应用拦截器] 添加 Authorization Header');

            // 3. 如果有 Token，尝试从 localStorage 获取并添加指纹头
            try {
                const userInfoStr = localStorage.getItem('userInfo');
                if (userInfoStr) {
                    const userInfo = JSON.parse(userInfoStr);
                    // --- 从 userInfo 对象中获取 clientFingerprint ---
                    const fingerprint = userInfo?.clientFingerprint;

                    if (fingerprint) {
                        config.headers['X-Client-Fingerprint'] = fingerprint;
                        console.log('[子应用拦截器] 添加 X-Client-Fingerprint Header:', fingerprint);
                    } else {
                        console.warn('[子应用拦截器] userInfo 中未找到 clientFingerprint 字段');
                        // 根据策略决定：可以允许请求继续（不带指纹），或阻止请求
                        // 如果指纹是强制的，则取消下面的注释
                        return Promise.reject(new Error("无法从本地存储中获取客户端指纹"));
                    }
                } else {
                    console.warn('[子应用拦截器] localStorage 中未找到 userInfo，无法添加指纹');
                    // 根据策略决定是否阻止
                    return Promise.reject(new Error("无法从本地存储中获取用户信息以提取指纹"));
                }
            } catch (error) {
                console.error('[子应用拦截器] 解析 userInfo 或设置指纹头时出错:', error);
                // 根据策略决定是否阻止
                return Promise.reject(new Error("处理客户端指纹时出错"));
            }
        } else {
            console.log('[子应用拦截器] 未找到 Token，不添加 Authorization 或指纹头');
        }

        // 4. 排除登录请求携带指纹头 (虽然不太可能同时有 token 又访问登录接口)
        //    注意：这里的 URL 判断需要根据实际 API 路径调整
        if (config.url && (config.url.endsWith('/user/login') || config.url.endsWith('/auth/login'))) {
            // 确保登录请求的路径与您的 API 匹配
            delete config.headers['X-Client-Fingerprint'];
            console.log('[子应用拦截器] 检测到登录请求，移除指纹头 (如果存在)');
        }

        return config;
    },
    error => {
        console.error('[子应用拦截器] 请求错误:', error);
        return Promise.reject(error);
    }
);

// --- 响应拦截器 (基本与主应用保持一致，但 401 处理稍有不同) ---
instance.interceptors.response.use(
    response => {
        // 直接返回 data 部分 (如果后端总是包裹一层如 { code, message, data })
        // 或者根据你的 API 响应结构调整
        const res = response.data;

        // 检查业务状态码 (code)，假设 200 是成功
        if (res && typeof res.code !== 'undefined' && res.code !== 200) {
            console.warn('[子应用拦截器] API 返回业务错误:', res);
            // 将后端业务错误包装成 Promise reject
            return Promise.reject({
                success: false,
                status: response.status, // HTTP 状态码
                message: res.message || '操作失败', // 后端业务消息
                code: res.code,          // 后端业务码
                data: res.data           // 可能的错误详情
            });
        }

        // 如果没有 code 字段，或者 code 是 200，则认为成功
        // 直接返回 data，或者根据需要返回整个 response 对象 response
        return res; // 或者 return response;
    },
    error => {
        console.error('[子应用拦截器] 响应错误:', error);

        if (error.response) {
            // 处理 HTTP 状态码错误
            const { status, data } = error.response;

            if (status === 401) {
                console.warn('[子应用拦截器] 收到 401 未授权响应。可能是 Token 失效或指纹不匹配。');
                // --- 子应用处理 401 ---
                // 1. 清除子应用本地存储的认证信息
                localStorage.removeItem('auth_token');
                localStorage.removeItem('userInfo');
                localStorage.removeItem('isLoggedIn'); // 如果也存了这个
                console.log('[子应用拦截器] 已清除本地认证信息。');

                // 2. **重要**: 子应用通常无法直接控制整个应用的登出和跳转。
                //    理想情况下，应该通知主应用执行登出。
                //    简单的做法可以是强制刷新页面，让主应用重新接管路由和状态检查。
                //    或者如果主应用监听了 localStorage 变化，清除操作可能被主应用捕获。
                // window.location.reload(); // 强制刷新，可能不是最佳体验

                // 或者仅返回错误，让调用方处理（例如显示登录提示）
                return Promise.reject({
                    success: false,
                    status: status,
                    message: data?.message || '登录状态已失效或无权限访问，请重新登录。', // 提供更友好的消息
                    code: data?.code || 401
                });

            } else {
                // 处理其他 HTTP 错误 (403, 404, 500等)
                return Promise.reject({
                    success: false,
                    status: status,
                    message: data?.message || error.message || `请求失败，状态码：${status}`,
                    code: data?.code
                });
            }

        } else if (error.request) {
            // 请求已发出，但没有收到响应 (网络问题、超时等)
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                return Promise.reject({ success: false, message: '请求超时，请检查网络或稍后重试' });
            }
            if (!window.navigator.onLine) {
                return Promise.reject({ success: false, message: '网络连接已断开，请检查您的网络设置' });
            }
            return Promise.reject({ success: false, message: '无法连接到服务器，请稍后重试' });
        } else {
            // 设置请求时触发了一个错误
            return Promise.reject({ success: false, message: error.message || '请求发送失败' });
        }
    }
);

// 导出 Axios 实例，供子应用内部 API 调用使用
export default instance;

// 如果 API 文件 (如 src/api/user.js) 需要 baseURL，可以单独导出
export const apiBaseUrl = 'http://124.71.58.72:8081/api';