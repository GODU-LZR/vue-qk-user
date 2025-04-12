<template>
  <el-card class="profile-card" shadow="hover">
    <!-- 头部部分，添加居中的图标和标题 -->
    <div class="card-header">
      <!-- 居中显示的图标和标题 -->
      <div class="header-title">
        <i class="el-icon-user profile-icon"></i>
        <h2>个人信息</h2>
      </div>
    </div>

    <!-- 头像 + 简要信息 -->
    <div class="avatar-section">
      <el-avatar
          :size="100"
          :src="user.avatar || defaultAvatar"
          class="avatar"
      />
      <div class="basic-info">
        <h1 class="username">{{ user.username }}</h1>
        <el-tag type="primary" size="medium">
          {{ formatRole(userRole) }}
        </el-tag>
      </div>
    </div>

    <el-divider></el-divider>

    <!-- 详细信息 -->
    <el-descriptions title="用户信息" :column="2" border>
      <el-descriptions-item>
        <template slot="label">
          <i class="el-icon-user"></i> 用户名
        </template>
        {{ user.username }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template slot="label">
          <i class="el-icon-s-order"></i> 用户编号
        </template>
        {{ user.userCode }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template slot="label">
          <i class="el-icon-s-custom"></i> 真实姓名
        </template>
        {{ user.realName }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template slot="label">
          <i class="el-icon-message"></i> 邮箱
        </template>
        {{ user.email }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template slot="label">
          <i class="el-icon-s-flag"></i> 用户身份
        </template>
        {{ formatRole(userRole) }}
      </el-descriptions-item>

      <el-descriptions-item>
        <template slot="label">
          <i class="el-icon-warning-outline"></i> 账号状态
        </template>
        <el-tag :type="statusTagType">{{ formatStatus(user.status, user.banEndTime) }}</el-tag>
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script>
export default {
  name: 'ProfileCard',
  data() {
    return {
      defaultAvatar: 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png',
      userRole: 'SuperAdmin', // 可替换为动态角色
      user: {
        id: 1,
        userCode: 'USR10001',
        username: 'admin',
        email: 'admin@example.com',
        avatar: '',
        realName: '张三',
        status: 0,
        banEndTime: null
      }
    };
  },
  computed: {
    statusTagType() {
      switch (this.user.status) {
        case 0: return 'success';
        case 1:
        case 2: return 'warning';
        case 3: return 'danger';
        default: return 'info';
      }
    }
  },
  methods: {
    formatRole(role) {
      const roleMap = {
        'NormalUser': '普通用户',
        'UserAdmin': '用户管理员',
        'SuperAdmin': '超级管理员'
      };
      return roleMap[role] || role;
    },
    formatStatus(status, banEndTime) {
      switch (status) {
        case 0:
          return '正常';
        case 1:
          return `封禁15天（至 ${banEndTime || '未知'}）`;
        case 2:
          return `封禁30天（至 ${banEndTime || '未知'}）`;
        case 3:
          return '永久封禁';
        default:
          return '未知状态';
      }
    }
  }
};
</script>

<style scoped>
.profile-card {
  max-width: 700px;
  margin: 40px auto; /* 垂直居中 */
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: center; /* 居中显示标题和图标 */
  align-items: center;
  padding: 10px 0;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-icon {
  font-size: 26px;
  margin-right: 10px;
  color: #409EFF; /* 图标的颜色 */
}

.avatar-section {
  display: flex;
}

.avatar {
  margin-right: 24px;
}

.basic-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.username {
  margin: 0 0 10px;
  font-size: 28px;
  color: #303133;
  font-weight: bold;
}
</style>
