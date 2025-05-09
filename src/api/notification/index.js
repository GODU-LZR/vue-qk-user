// src/api/notification/index.js

// --- 直接导入默认导出的 Axios 实例，并将其命名为 request ---
import request from '@/api/config/index.js';

/**
 * 请求后端发送邮箱验证码
 * @param {string} email - 目标邮箱地址
 * @returns {Promise<{success: boolean, message?: string}>} - 操作结果
 */
export const sendVerificationCode = async (email) => {
    console.log('[API] Attempting to send verification code to:', email);
    try {
        // --- 使用导入的 request 实例发送 POST 请求 ---
        // 后端接口 @RequestParam String email, 使用 POST 请求和 params
        await request.post('/user/sendVerificationCode', null, {
            params: { email }
        });
        // 假设拦截器处理了非成功业务码，能到这里说明成功触发
        // (或者说，网络请求成功，HTTP状态码 OK，业务码 OK - 具体取决于拦截器逻辑)
        console.log('[API] Send verification code request successful');
        return { success: true }; // 表示请求已成功发送且未被拦截器标记为失败
    } catch (error) {
        // 错误由 Axios 拦截器处理并包装后 reject 出来
        // error 对象应该包含拦截器返回的 message 属性
        console.error('[API] Failed to send verification code:', error);
        return {
            success: false,
            message: error?.message || '发送验证码失败，请稍后重试' // 优先使用拦截器提供的错误消息
        };
    }
};

