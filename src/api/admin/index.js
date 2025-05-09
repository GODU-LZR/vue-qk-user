// src/api/admin/index.js

import request from '@/api/config/index'; // <-- 导入您配置好的 Axios 实例

/**
 * 获取普通用户列表（分页、条件查询）
 * 调用后端的 GET /user/admin/user/list/normal 接口
 *
 * @param {object} params - 查询参数对象
 * @param {number} params.currentPage - 当前页码 (从 1 开始)
 * @param {number} params.pageSize - 每页数量
 * @param {string} [params.searchQuery] - 搜索关键字 (可选)
 * @param {number|null} [params.filterStatus] - 状态筛选 (0, 1, 2, 3, null 或 '' 表示全部) (可选)
 * @param {string} [params.sortBy] - 排序字段 ('name', 'code', 'username', 'default') (可选, 默认 'default')
 * @param {string} [params.sortOrder] - 排序顺序 ('asc', 'desc') (可选, 默认 'desc')
 * @returns {Promise<IPage<UserProfileDTO>>} - 返回包含分页信息和用户列表的 Promise (假设拦截器处理了 Result 包装)
 */
export function getNormalUserList(params) {
    // 打印请求参数，方便调试
    console.log('[API] getNormalUserList: 发送 GET 请求到 /user/admin/list/normal，参数:', params);

    const requestParams = {
        currentPage: params.currentPage || 1,
        pageSize: params.pageSize || 12,
        searchQuery: params.searchQuery,
        filterStatus: params.filterStatus,
        sortBy: params.sortBy === 'default' ? null : params.sortBy, // 'default' 时不传或传 null
        sortOrder: params.sortBy === 'default' ? null : (params.sortOrder || 'desc') // 'default' 时不传或传 null
    };

    // 过滤掉值为 null 或 undefined 的参数
    Object.keys(requestParams).forEach(key => {
        if (requestParams[key] === null || requestParams[key] === undefined || requestParams[key] === '') {
            // 修正：也过滤掉空字符串，除非后端明确需要空字符串
            delete requestParams[key];
        }
    });
    console.log('[API] getNormalUserList: 最终请求参数:', requestParams);


    return request({
        url: '/user/admin/user/list/normal', // 确认基础路径是 /user
        method: 'get',
        params: requestParams
    });
    // 成功时，拦截器应返回后端 Result.data 中的 IPage<UserProfileDTO>
}


/**
 * 【新增】管理员部分更新指定用户信息
 * 调用后端的 PATCH /user/admin/user/{userId} 接口
 *
 * @param {string|number} userId - 要更新的用户 ID
 * @param {object} updateData - 包含要更新字段和值的对象 (例如 { realName: '新名字', status: 1 })
 * @returns {Promise<UserProfileDTO>} - 返回更新后的用户信息 DTO 的 Promise (假设拦截器处理了 Result 包装)
 */
export function updateAdminUserProfile(userId, updateData) {
    // 输入校验 (可选)
    if (!userId) {
        return Promise.reject(new Error('更新用户信息失败：缺少用户 ID。'));
    }
    if (!updateData || Object.keys(updateData).length === 0) {
        console.warn('[API] updateAdminUserProfile: 更新数据为空，可能不会执行任何操作。');
        // 可以选择返回一个 resolved Promise 或拒绝
        // return Promise.resolve(null); // 或者根据业务逻辑决定
        return Promise.reject(new Error('更新用户信息失败：未提供任何更新字段。'));
    }

    // 构造请求 URL，确保基础路径正确
    const url = `/user/admin/user/${userId}`; // 基础路径是 /user

    console.log(`[API] updateAdminUserProfile: 发送 PATCH 请求到 ${url}，用户 ID: ${userId}，更新数据:`, updateData);

    return request({
        url: url,
        method: 'patch', // 使用 PATCH 方法
        data: updateData // 将更新数据对象作为请求体发送
    });
    // 成功时，拦截器应返回后端 Result.data 中的 UserProfileDTO
}

