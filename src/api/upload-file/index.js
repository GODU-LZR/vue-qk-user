// src/api/upload-file/index.js
import request from '@/api/config/index'; // 确保导入配置好的 Axios 实例

/**
 * 获取当前用户头像的预签名上传URL和文件记录ID
 * 调用 GET middleWare/pic/upload/avatar
 */
export function getUploadUrl() {
    // 路径相对于 baseURL ('http://.../api')
    const url = 'middleware/pic/upload/avatar';
    console.log(`getUploadUrl: 请求 ${url}`);
    return request({
        url: url,
        method: 'get'
    });
    // 拦截器应返回 { url, fileRecordID }
}

/**
 * 【新增】根据指定用户ID获取头像的预签名上传URL和文件记录ID
 * 调用 GET /pic/upload/avatar/{userId}
 * @param {string|number} userId - 需要上传头像的用户 ID
 * @returns {Promise<{url: string, fileRecordID: string}>} - 返回包含上传 URL 和文件记录 ID 的 Promise
 */
export function getUserAvatarUploadUrl(userId) {
    if (!userId) {
        return Promise.reject(new Error('获取头像上传URL失败：缺少用户 ID (userId)。'));
    }

    const url = `middleware/pic/upload/avatar/${userId}`; // 使用后端定义的路径
    console.log(`[API] getUserAvatarUploadUrl: 请求 ${url}`);
    return request({
        url: url,
        method: 'get'
    });
    // 拦截器应返回 { url, fileRecordID }
}

/**
 * 根据文件记录ID获取最终的图片公网查看URL
 * 调用 GET middleware/pic/view/{fileId} (路径由您确认是正确的)
 * @param {string} fileId - 文件记录 ID
 * @returns {Promise<string>} - 返回最终的图片 URL
 */
export async function getFinalImageUrl(fileId) {
    if (!fileId) {
        return Promise.reject(new Error('缺少文件ID (fileId)'));
    }
    const url = `middleware/pic/view/${fileId}`; // 使用您确认的路径
    console.log(`getFinalImageUrl: 请求 ${url}`);
    try {
        // 调用 axios 发起请求, response 是后端返回的 Result<String> 对象
        // 即 { code: 200, message: '...', data: 'http://...' }
        const response = await request({
            url: url,
            method: 'get'
        });

        // --- 正确处理响应 ---
        // 检查响应结构，并从 data 字段提取 URL 字符串
        if (response && typeof response.data === 'string' && response.data) {
            console.log(`getFinalImageUrl: 获取到最终 URL: ${response.data}`);
            return response.data; // <-- 返回 data 字段中的 URL 字符串
        } else {
            // 如果返回的数据结构不符合预期
            console.error("获取最终图片 URL 失败，响应数据格式不正确:", response);
            throw new Error('获取到的图片地址无效');
        }
    } catch (error) {
        console.error(`获取最终图片 URL 失败 (fileId: ${fileId}):`, error);
        // 抛出错误，错误消息可能来自拦截器或上面的 throw
        throw new Error(`获取最终图片 URL 失败: ${error.message || '未知错误'}`);
    }
}
