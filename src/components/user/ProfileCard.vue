<template>
  <el-card class="profile-card" shadow="hover">
    <div class="card-header">
      <div class="header-title">
        <i class="el-icon-user profile-icon"></i>
        <h2>个人信息</h2>
      </div>
    </div>

    <div v-if="isLoading" class="loading-section">
      <i class="el-icon-loading"></i> 加载中...
    </div>

    <el-alert
        v-else-if="error"
        :title="'加载失败'"
        type="error"
        :description="error"
        show-icon
        :closable="false"
        class="error-section"
    />

    <div v-else>
      <div class="avatar-section">
        <el-avatar
            :size="100"
            :src="user.avatar || defaultAvatar"
            class="avatar"
            @error="handleAvatarError"
        />
        <div class="basic-info">
          <h1 class="username">{{ user.username || 'N/A' }}</h1>
          <el-tag v-if="displayRoleCode" type="primary" size="medium">
            {{ formatRole(displayRoleCode) }}
          </el-tag>
          <el-tag v-else type="info" size="medium">
            无角色信息
          </el-tag>
        </div>
      </div>

      <el-divider></el-divider>

      <el-descriptions title="用户信息" :column="columnCount" border>
        <el-descriptions-item>
          <template slot="label">
            <i class="el-icon-user"></i> 用户名
          </template>
          {{ user.username || '-' }}
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            <i class="el-icon-s-order"></i> 用户编号
          </template>
          {{ user.userCode || '-' }}
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            <i class="el-icon-s-custom"></i> 真实姓名
          </template>
          {{ user.realName || '-' }}
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            <i class="el-icon-message"></i> 邮箱
          </template>
          {{ user.email || '-' }}
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            <i class="el-icon-s-flag"></i> 用户身份
          </template>
          <span v-if="user.roleCodes && user.roleCodes.length > 0">
            {{ user.roleCodes.map(code => formatRole(code)).join(', ') }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>

        <el-descriptions-item>
          <template slot="label">
            <i class="el-icon-warning-outline"></i> 账号状态
          </template>
          <el-tag :type="statusTagType">{{ formatStatus(user.status) }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item v-if="user.status === 1 || user.status === 2" :span="columnCount > 1 ? 2 : 1">
          <template slot="label">
            <i class="el-icon-time"></i> 封禁至
          </template>
          {{ formatBanEndTime(user.banEndTime) }}
        </el-descriptions-item>

      </el-descriptions>
    </div>

  </el-card>
</template>

<script>
// --- 导入您定义好的 API 调用函数 ---
import { getCurrentUserProfile } from '@/api/user/index'; // <-- 确认路径正确

export default {
  name: 'ProfileCard',
  data() {
    return {
      isLoading: true, // 添加加载状态
      error: null, // 添加错误信息状态
      defaultAvatar: 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png',
      // --- 初始化 user 对象结构，以匹配 UserProfileDTO ---
      user: {
        id: null,
        userCode: '',
        username: '',
        email: '',
        avatar: '',
        realName: '',
        status: null,
        banEndTime: null,
        roleCodes: [] // <--- 包含角色代码列表
      },
      // userRole 不再需要，角色信息在 user.roleCodes 中
      // 响应式列数
      columnCount: window.innerWidth < 768 ? 1 : 2
    };
  },
  computed: {
    // 计算属性：决定状态标签的类型
    statusTagType() {
      if (this.user.status === null) return 'info'; // 处理加载中的情况
      switch (this.user.status) {
        case 0: return 'success';
        case 1:
        case 2: return 'warning';
        case 3: return 'danger';
        default: return 'info';
      }
    },
    // 计算属性：用于在头像旁边显示一个主要角色
    displayRoleCode() {
      // 确保 user 和 roleCodes 已加载
      if (this.user && this.user.roleCodes && this.user.roleCodes.length > 0) {
        // 角色显示优先级 (按需调整)
        if (this.user.roleCodes.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
        if (this.user.roleCodes.includes('USER_ADMIN')) return 'USER_ADMIN';
        // ... 其他管理员角色优先级 ...
        if (this.user.roleCodes.includes('USER')) return 'USER'; // 普通用户优先级较低
        return this.user.roleCodes[0]; // 否则显示第一个
      }
      return null; // 没有角色信息则不显示
    }
  },
  methods: {
    fetchData() {
      this.isLoading = true;
      this.error = null;
      getCurrentUserProfile()
          .then(response => {
            // --- 修改这里 ---
            // 检查 response 是否符合预期结构 (包含 code 和 data)
            // 并且 code 是否是成功码 (虽然拦截器已经处理过，但多一层保险更好)
            if (response && typeof response.code !== 'undefined' /* && response.code === 200 */ && response.data) {
              // 将 response 对象中的 data 字段 (即 UserProfileDTO) 赋值给 this.user
              this.user = response.data; // <--- 只取 data 部分
              // 确保 roleCodes 是一个数组
              this.user.roleCodes = Array.isArray(this.user.roleCodes) ? this.user.roleCodes : [];
              console.log("ProfileCard: UserProfileDTO data assigned:", this.user);
            } else {
              // 如果返回的数据结构不符合预期 (例如没有 data 字段)
              console.error("ProfileCard: API response data format error", response);
              // 将 this.user 设置为空对象或保留初始值，防止模板出错
              this.user = { roleCodes: [] }; // 重置为包含 roleCodes 的空结构
              this.error = '获取到的用户数据格式不正确。';
            }
          })
          .catch(err => {
            console.error('ProfileCard: Failed to fetch user profile:', err);
            this.error = err.message || '加载用户信息失败，请稍后重试。';
          })
          .finally(() => {
            this.isLoading = false;
          });
    },

    // 格式化角色代码为中文名 (使用您系统中的角色代码)
    formatRole(roleCode) {
      if (!roleCode) return '';
      const roleMap = {
        'SUPER_ADMIN': '超级管理员',
        'USER_ADMIN': '用户管理员',
        'HR_ADMIN': '人事管理员',
        'VENUE_ADMIN': '场地管理员',
        'EQUIPMENT_ADMIN': '器材管理员',
        'EVENT_ADMIN': '赛事管理员',
        'FINANCE_ADMIN': '财务管理员',
        'FORUM_ADMIN': '论坛新闻管理员',
        'USER': '普通用户'
        // 根据您的实际情况添加或修改
      };
      return roleMap[roleCode] || roleCode; // 未知角色显示代码
    },

    // 格式化状态 (不再需要 banEndTime 参数)
    formatStatus(status) {
      if (status === null || status === undefined) return '加载中...';
      switch (status) {
        case 0: return '正常';
        case 1: case 2: return '临时封禁'; // 结束时间单独显示
        case 3: return '永久封禁';
        default: return '未知状态';
      }
    },

    // 格式化封禁结束时间
    formatBanEndTime(banEndTime) {
      if (!banEndTime) return '未知';
      try {
        // 尝试更健壮的日期解析和格式化
        const date = new Date(banEndTime.replace(' ', 'T')); // 兼容 ISO 8601 或类似格式
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        return new Intl.DateTimeFormat('zh-CN', options).format(date); // 使用中文格式
      } catch (e) {
        console.error("Error formatting banEndTime:", banEndTime, e);
        return banEndTime; // 解析失败返回原始字符串
      }
    },

    // 处理头像加载失败
    handleAvatarError(event) {
      console.warn('Avatar failed to load, using default:', event.target.src);
      // 可以选择强制设置为默认头像，但 el-avatar 通常有自己的 fallback
      // event.target.src = this.defaultAvatar;
    },

    // 处理窗口大小变化，调整列数
    handleResize() {
      this.columnCount = window.innerWidth < 768 ? 1 : 2;
    }
  },
  // --- 在组件创建时调用 fetchData ---
  created() {
    this.fetchData();
    // 添加窗口大小监听
    window.addEventListener('resize', this.handleResize);
  },
  // --- 在组件销毁前移除监听 ---
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
/* --- 样式与之前版本相同 --- */
.profile-card {
  max-width: 700px;
  margin: 40px auto;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20px 30px;
}
.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 25px;
}
.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-icon {
  font-size: 26px;
  margin-right: 12px;
  color: #409EFF;
}
.header-title h2 {
  font-size: 22px;
  color: #303133;
  font-weight: 600;
  margin: 0;
}
.loading-section, .error-section {
  text-align: center;
  padding: 40px 20px;
  color: #606266;
  font-size: 16px;
}
.error-section { margin: 20px 0; }
.loading-section i { margin-right: 8px; font-size: 20px; }
.avatar-section { display: flex; align-items: center; margin-bottom: 25px; }
.avatar {
  margin-right: 30px;
  border: 2px solid #eee;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.basic-info { display: flex; flex-direction: column; justify-content: center; }
.username { margin: 0 0 12px; font-size: 26px; color: #303133; font-weight: 600; }
.el-descriptions { margin-top: 20px; }
::v-deep .el-descriptions-item__label { font-weight: 500; color: #606266; }
::v-deep .el-descriptions-item__content { color: #303133; }
::v-deep .el-descriptions-item__label.is-bordered-label { background-color: #fafafa; }
::v-deep .el-descriptions-item__cell { padding-top: 10px; padding-bottom: 10px; }
@media (max-width: 768px) {
  .profile-card { margin: 20px 15px; padding: 15px 20px; }
  .avatar-section { flex-direction: column; align-items: center; text-align: center; }
  .avatar { margin-right: 0; margin-bottom: 15px; }
  .username { font-size: 22px; }
  .el-descriptions { margin-top: 15px; }
}
</style>