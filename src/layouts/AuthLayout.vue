<template>  <!-- <--- 添加这个开始标签 -->
  <el-container class="auth-layout">
    <!-- 顶部栏 -->
    <el-header height="60px" class="header">
      <!-- 顶部菜单 -->
      <el-menu
          mode="horizontal"
          :default-active="$route.path"
          background-color="#ffffff"
          text-color="#333"
          active-text-color="#409EFF"
          router
          class="top-menu"
      >
        <!-- 仪表盘 -->
        <el-menu-item index="/dashboard">
          <i class="el-icon-s-home"></i> 仪表盘
        </el-menu-item>

        <!-- 个人中心（下拉项） -->
        <el-submenu index="profile-sub">
          <template slot="title">
            <i class="el-icon-user"></i> 个人中心
          </template>
          <el-menu-item index="/profile">个人信息</el-menu-item>
          <el-menu-item index="/profile/edit">修改信息</el-menu-item>
          <el-menu-item index="/profile/delete">注销账号</el-menu-item>
        </el-submenu>

        <!-- 用户管理（下拉项） -->
        <el-submenu index="admin-sub">
          <template slot="title">
            <i class="el-icon-s-custom"></i> 用户管理
          </template>
          <el-menu-item index="/admin/users">用户列表</el-menu-item>
          <el-menu-item index="/admin/users/create">添加用户</el-menu-item>
          <!-- 注意：这里的编辑用户 index 最好不要写死 ID '1'，除非是示例 -->
          <!-- 实际应用中，导航到编辑页通常由列表中的按钮触发，动态传入 ID -->
          <!-- <el-menu-item index="/admin/users/edit/1">编辑用户 (示例)</el-menu-item> -->
        </el-submenu>
      </el-menu>
    </el-header>

    <!-- 主内容区域 -->
    <el-main class="main-content">
      <router-view :key="$route.fullPath" />
    </el-main>
  </el-container>
</template> <!-- <--- 添加这个结束标签 -->

<script>
export default {
  name: 'AuthLayout',
  // 可能还有其他的 script 内容，比如 data, methods, computed 等
  mounted() {
    console.log('AuthLayout mounted successfully.'); // 可以加个日志确认挂载
  }
}
</script>

<style scoped>
/* 这里是你 AuthLayout 的样式 */
.auth-layout {
  height: 100vh; /* 或者其他你需要的高度 */
}
.header {
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center; /* 垂直居中菜单 */
  padding: 0 20px; /* 给 Header 一些内边距 */
}
.top-menu {
  border-bottom: none; /* 移除 Menu 组件自带的下边框，因为 Header 已经有了 */
  flex-grow: 1; /* 让菜单占据剩余空间 */
}
.main-content {
  padding: 20px;
  background-color: #f0f2f5; /* 给主内容区一个背景色 */
}
</style>
