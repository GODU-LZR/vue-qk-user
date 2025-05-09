// src/api/index.js (子应用)

import request from '@/api/config/index'; // <-- 导入您配置好的 Axios 实例

/**
 * 获取当前登录用户的详细信息 (包含角色)
 */
export function getCurrentUserProfile() {
    console.log('getCurrentUserProfile: 请求 /user/me');
    // 现在这里使用的 'request' 就是您在 src/api/config/index.js 中配置好的实例
    return request({
        url: '/user/me', // 请确认此路径与后端 API 完全匹配
        method: 'get'
    });
}

/**
 * 获取当前用户头像 URL (如果需要)
 */
export function getCurrentUserAvatarUrl() {
    console.log('getCurrentUserAvatarUrl: 请求 /user/me/avatar');
    // 同样使用配置好的 request 实例
    return request({
        url: '/user/me/avatar', // 请确认此路径与后端 API 完全匹配
        method: 'get'
    });
}

/**
 * 更新当前用户的个人信息 (部分更新)
 * 调用后端的 PATCH /users/me 接口
 * @param {object} profileData - 包含要更新字段的对象.
 * 例如: { username: 'new name', realName: '新实名', avatar: 'new_url', password: '...', oldPassword: '...', email: '...', emailCode: '...' }
 * 只需要包含实际更改的字段以及必要的验证字段（如 oldPassword, emailCode）。
 * @returns {Promise<UserProfileDTO>} - 返回更新后的 UserProfileDTO (假设拦截器处理了 Result 包装)
 */
export function updateUserProfile(profileData) {
    console.log('updateUserProfile: 发送 PATCH 请求到 /users/me，数据:', profileData);
    return request({
        url: '/user/me', // 对应后端的 @PatchMapping("/me")
        method: 'patch',  // 使用 PATCH 方法，表示部分更新
        data: profileData // 将包含更新数据的对象作为请求体发送
    });
    // 成功时，拦截器应返回后端 Result.data 中的 UserProfileDTO
}

/**
 * 请求注销（软删除）当前登录用户的账户
 * POST /api/user/me/deactivate
 * @param {object} payload - 包含验证所需信息
 * @param {string} payload.emailCode - 用户输入的邮箱验证码
 * @param {string} payload.password - 用户输入的当前密码
 * @returns {Promise<boolean>} - 操作是否成功 (假设响应拦截器处理了 Result<Boolean>)
 */
export function deactivateCurrentUserAccount({ emailCode, password }) {
    // 不要在日志中打印密码
    console.log('[API] deactivateCurrentUserAccount: 发送 POST 请求到 /user/me/deactivate');
    console.log('[API] deactivateCurrentUserAccount: 提交的 emailCode:', emailCode); // 可以打印验证码用于调试

    // 准备请求体数据
    const requestData = {
        emailCode,
        password
    };

    return request({
        url: '/user/me/deactivate', // 对应后端的 @PostMapping("/me/deactivate")
        method: 'post',
        data: requestData // 将包含 emailCode 和 password 的对象作为请求体
    });
}

