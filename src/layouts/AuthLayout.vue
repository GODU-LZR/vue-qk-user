<template>
  <el-container class="auth-layout">
    <el-header height="60px" class="header">
      <el-menu
          mode="horizontal"
          :default-active="$route.path"
          background-color="#ffffff"
          text-color="#333"
          active-text-color="#409EFF"
          router
          class="top-menu"
      >
        <el-menu-item index="/user/dashboard"> <i class="el-icon-s-home"></i> 信息看板
        </el-menu-item>
        <el-submenu index="profile-sub">
          <template slot="title">
            <i class="el-icon-user"></i> 个人中心
          </template>
          <el-menu-item index="/user/profile">个人信息</el-menu-item>
          <el-menu-item index="/user/profile/edit">修改信息</el-menu-item>
          <el-menu-item index="/user/profile/delete">注销账号</el-menu-item>
        </el-submenu>
        <el-submenu index="admin-sub" v-if="isAdmin">
          <template slot="title">
            <i class="el-icon-s-custom"></i> 用户管理
          </template>
          <el-menu-item index="/admin/users">用户列表</el-menu-item>
          <el-menu-item index="/admin/users/create">添加用户</el-menu-item>
        </el-submenu>
      </el-menu>
    </el-header>
    <el-main class="main-content">
      <router-view :key="$route.fullPath" />
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'AuthLayout',
  data() {
    return {
      // 添加一个本地 data 属性来存储管理员状态，使其可被修改触发更新
      isAdmin: false,
    };
  },
  computed: {
    // showUserManagement 计算属性现在直接返回本地的 isAdmin 状态
    // 但为了保留之前的命名，我们可以在模板中继续使用 showUserManagement，
    // 或者直接在模板中使用 v-if="isAdmin"
    showUserManagement() {
      return this.isAdmin;
    }
  },
  methods: {
    // 抽离出检查管理员权限的逻辑为一个方法
    checkAdminPermission() {
      console.log('[AuthLayout] checkAdminPermission executing...');
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        console.log('[AuthLayout] checkAdminPermission - localStorage userInfo:', userInfoStr);
        if (!userInfoStr) {
          return false;
        }
        const userInfo = JSON.parse(userInfoStr);
        console.log('[AuthLayout] checkAdminPermission - Parsed userInfo:', userInfo);

        if (userInfo && Array.isArray(userInfo.roles) && userInfo.roles.length > 0) {
          const userRoles = userInfo.roles;
          // !!! 确保这里的角色名与 localStorage 中的实际名称一致 !!!
          const allowedRoles = ['SUPER_ADMIN', 'USER_ADMIN'];
          console.log('[AuthLayout] checkAdminPermission - User roles:', userRoles);

          const hasPermission = userRoles.some(role => allowedRoles.includes(role));
          console.log('[AuthLayout] checkAdminPermission - Calculated permission:', hasPermission);
          return hasPermission;
        } else {
          console.warn('[AuthLayout] checkAdminPermission - Invalid userInfo or roles:', userInfo);
          return false;
        }
      } catch (error) {
        console.error('[AuthLayout] checkAdminPermission - Error parsing userInfo:', error);
        localStorage.removeItem('userInfo');
        return false;
      }
    },
    // storage 事件的处理函数
    handleStorageChange(event) {
      console.log('[AuthLayout] Storage event detected:', event.key);
      // 当 localStorage 中的 'userInfo' 发生变化时，重新检查权限
      if (event.key === 'userInfo') {
        console.log('[AuthLayout] userInfo in localStorage changed, re-checking permission...');
        this.isAdmin = this.checkAdminPermission();
        console.log('[AuthLayout] isAdmin state updated after storage change:', this.isAdmin);
      }
      // 可选：如果主应用也通过 localStorage 同步 isLoggedIn，也可以监听它
      // if (event.key === 'isLoggedIn') {
      //    // 可能需要根据 isLoggedIn 状态做其他处理
      // }
    }
  },
  mounted() {
    console.log('AuthLayout mounted successfully.');
    // 1. 组件挂载时，立即检查一次权限并设置初始状态
    this.isAdmin = this.checkAdminPermission();
    console.log('[AuthLayout] Initial isAdmin state on mount:', this.isAdmin);

    // 2. 添加 storage 事件监听器
    window.addEventListener('storage', this.handleStorageChange);
    console.log('[AuthLayout] Storage event listener added.');

    // 3. (可选但推荐) 为了应对 onGlobalStateChange 可能比 mounted 晚一点点的情况，
    //    可以在下一个 tick 或者稍作延迟后再次检查一次权限。
    this.$nextTick(() => {
      const isAdminAfterTick = this.checkAdminPermission();
      if (this.isAdmin !== isAdminAfterTick) {
        console.log('[AuthLayout] Re-checking permission in nextTick, updating isAdmin.');
        this.isAdmin = isAdminAfterTick;
      }
    });
    // 或者使用 setTimeout
    // setTimeout(() => {
    //     const isAdminAfterTimeout = this.checkAdminPermission();
    //     if (this.isAdmin !== isAdminAfterTimeout) {
    //         console.log('[AuthLayout] Re-checking permission after timeout, updating isAdmin.');
    //         this.isAdmin = isAdminAfterTimeout;
    //     }
    // }, 100); // 延迟 100ms 检查
  },
  beforeDestroy() {
    // 组件销毁前，移除 storage 事件监听器，防止内存泄漏
    window.removeEventListener('storage', this.handleStorageChange);
    console.log('[AuthLayout] Storage event listener removed.');
  }
}
</script>

<style scoped>
/* 你的样式保持不变 */
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}
.top-menu {
  border-bottom: none !important;
  height: 100%;
  display: flex;
  align-items: center;
}
.el-menu--horizontal > .el-menu-item,
.el-menu--horizontal > .el-submenu .el-submenu__title {
  height: 60px;
  line-height: 60px;
}
.main-content {
  padding: 20px;
  background-color: #f5f7fa;
  flex-grow: 1;
  overflow-y: auto;
}
</style>
