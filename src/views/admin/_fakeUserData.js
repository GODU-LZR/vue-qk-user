// src/views/admin/_fakeUserData.js

export const TOTAL_USERS_COUNT = 150; // 定义要生成的总用户数

// 辅助函数：生成随机字符串
function randomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

// 辅助函数：生成随机日期 (过去一年内)
function randomDatePastYear() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0]; // YYYY-MM-DD HH:MM:SS
}

// 辅助函数：生成随机头像 URL (使用 placeholder 服务)
function randomAvatar(id) {
    // 使用不同种子或服务避免所有头像一样
    const seed = id + Math.random().toString(16).substring(2, 8); // 增加随机性
    const size = 100; // 头像尺寸
    // 可以换成其他头像服务，如Adorable Avatars, DiceBear等
    // return `https://i.pravatar.cc/${size}?u=${seed}`; // Pravatar 可能不稳定或有速率限制
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&size=${size}`; // DiceBear 更可靠
    // return null; // 或者随机返回 null
}

// 辅助函数：生成随机中文名
function randomChineseName() {
    const surnames = ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈", "褚", "卫", "蒋", "沈", "韩", "杨", "张", "欧阳", "司马"];
    const givenNames = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞", "平", "刚", "桂英"];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)] + (Math.random() > 0.5 ? givenNames[Math.floor(Math.random() * givenNames.length)] : '');
    return surname + givenName;
}


// 主要的生成函数
export function generateFakeUsers(count) {
    const users = [];
    const usedUsernames = new Set();
    const usedEmails = new Set();

    for (let i = 1; i <= count; i++) {
        let username = '';
        do {
            username = `user_${randomString(5)}`.toLowerCase();
        } while (usedUsernames.has(username)); // 确保用户名唯一
        usedUsernames.add(username);

        let email = '';
        do {
            email = `${username}@${['test.com', 'example.org', 'mail.net'][Math.floor(Math.random() * 3)]}`;
        } while (usedEmails.has(email)); // 确保邮箱唯一
        usedEmails.add(email);

        const realName = randomChineseName();
        const status = Math.floor(Math.random() * 4); // 0, 1, 2, 3
        let banEndTime = null;
        if (status === 1) { // 封禁15天
            const banDate = new Date();
            banDate.setDate(banDate.getDate() + 15);
            banEndTime = banDate.toISOString().split('T')[0] + ' ' + banDate.toTimeString().split(' ')[0];
        } else if (status === 2) { // 封禁30天
            const banDate = new Date();
            banDate.setDate(banDate.getDate() + 30);
            banEndTime = banDate.toISOString().split('T')[0] + ' ' + banDate.toTimeString().split(' ')[0];
        }
        // status 3 (永久封禁) banEndTime 为 null

        const createTime = randomDatePastYear();
        const updateTime = Math.random() > 0.3 ? createTime : randomDatePastYear(); // 更新时间可能与创建时间相同或更晚

        users.push({
            id: i,
            userCode: `USR${String(i).padStart(6, '0')}`, // 编号更长一点
            username: username,
            password: 'hashed_password_placeholder', // 不重要
            email: email,
            avatar: Math.random() > 0.2 ? randomAvatar(i) : null, // 80% 概率有头像
            realName: realName,
            status: status,
            banEndTime: banEndTime,
            createTime: createTime,
            updateTime: updateTime,
            isDeleted: 0,
        });
    }
    // 打乱数组顺序，使其看起来更随机
    users.sort(() => Math.random() - 0.5);
    return users;
}
