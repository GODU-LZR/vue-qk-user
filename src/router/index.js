// src/router/index.js (用户子应用 - User Micro App) - 方案一修改后

import Vue from 'vue';
import Router from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';

// 页面视图 (保持不变)
import DashboardPage from '@/views/DashboardPage.vue';
import ProfileInfoPage from '@/views/user/ProfileInfoPage.vue';
import ProfileEditPage from '@/views/user/ProfileEditPage.vue';
import ProfileDeletePage from '@/views/user/ProfileDeletePage.vue';
import UserManagementPage from '@/views/admin/UserManagementPage.vue';
import UserCreatePage from '@/views/admin/UserCreatePage.vue';
import UserEditPage from '@/views/admin/UserEditPage.vue';

// --- 导入认证检查函数 (如果需要在独立运行时检查 token 有效期) ---
// 假设子应用也能访问到类似的工具函数或直接检查 localStorage
// import { isTokenValid } from '@/api/modules/auth'; // 假设路径和方法名
// 或者直接检查 token 存在性
const hasValidTokenInStandalone = () => {
  // 简单检查：仅判断 localStorage 中是否存在 auth_token
  return !!localStorage.getItem('auth_token');
  // 或者更严格的检查 (需要引入 isTokenValid):
  // return isTokenValid();
};


Vue.use(Router);

// --- 读取基座 URL 配置 ---
const mainAppBaseUrl = process.env.VUE_APP_MAIN_APP_BASE_URL || 'http://localhost:3000';

const routes = [
  {
    path: '/',
    component: AuthLayout,
    meta: { requiresAuth: true }, // 标记需要认证
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: DashboardPage, meta: { title: '信息看板' } },
      { path: 'user/profile', name: 'ProfileInfo', component: ProfileInfoPage, meta: { title: '个人信息' } },
      { path: 'user/profile/edit', name: 'ProfileEdit', component: ProfileEditPage, meta: { title: '修改信息' } },
      { path: 'user/profile/delete', name: 'ProfileDelete', component: ProfileDeletePage, meta: { title: '注销账号' } },
      { path: 'admin/users', name: 'UserManagement', component: UserManagementPage, meta: { title: '用户管理' /* , requiresAdmin: true */ } },
      { path: 'admin/users/create', name: 'UserCreate', component: UserCreatePage, meta: { title: '添加用户' /* , requiresAdmin: true */ } },
      { path: 'admin/users/edit/:id', name: 'UserEdit', component: UserEditPage, meta: { title: '编辑用户' /* , requiresAdmin: true */ } },
      { path: '*', redirect: '/dashboard' }
    ]
  }
  // ... (其他可能的公共路由) ...
];

const router = new Router({
  mode: 'history',
  base: window.__POWERED_BY_QIANKUN__ ? '/user' : '/',
  routes
});

// --- !! 修改后的全局前置路由守卫 !! ---
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // 判断是否在 Qiankun 环境下运行
  if (window.__POWERED_BY_QIANKUN__) {
    // --- 运行在 Qiankun 环境下 ---
    // 此时，基座应用的路由守卫已经确保了用户是登录状态才能加载到这里。
    // 所以，对于标记了 requiresAuth: true 的路由，我们【信任】基座，直接放行。
    // 【不再检查】子应用自己的 localStorage 或调用 isTokenValid，避免时序问题。
    console.log(`[子应用路由守卫 - Qiankun] 导航到: ${to.path}, 信任基座认证.`);

    // 如果需要进行子应用内部的【角色或权限】检查，可以在这里添加逻辑
    // 例如：检查 state.userInfo.roles 是否包含 'ADMIN'
    // const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
    // if (requiresAdmin) {
    //    // 从全局状态或可靠来源获取用户信息并检查权限...
    //    // const userInfo = ...
    //    // if (userHasAdminRole(userInfo)) {
    //    //    next();
    //    // } else {
    //    //    next('/unauthorized'); // 跳转到子应用内无权限页
    //    // }
    // } else {
    // 不需要特定内部权限，直接放行
    next();
    // }
    // --- 如果没有内部权限检查，对于 requiresAuth 的路由直接 next() ---

  } else {
    // --- 独立运行模式 ---
    console.log('[子应用路由守卫 - 独立运行] 执行独立运行时的认证检查...');
    if (requiresAuth) {
      // 独立运行时，检查 localStorage 中是否存在有效 token
      // 注意：这里的检查逻辑取决于你希望独立运行时如何表现
      const loggedInStandalone = hasValidTokenInStandalone(); // 使用上面定义的检查函数

      console.log(`[子应用路由守卫 - 独立运行] 导航到: ${to.path}, 需要认证: ${requiresAuth}, Token 有效: ${loggedInStandalone}`);

      if (loggedInStandalone) {
        // 独立运行且检测到有效 Token (可能是开发调试环境)，允许访问
        console.log('[子应用路由守卫 - 独立运行] 允许访问');
        next();
      } else {
        // 独立运行、无有效 Token 且访问受保护页面 -> 重定向到基座登录页
        const loginUrl = `${mainAppBaseUrl}/login`;
        console.warn(`[子应用路由守卫 - 独立运行] 未登录尝试访问受保护路由 ${to.path}，重定向到主应用登录页: ${loginUrl}`);
        window.location.replace(loginUrl); // 使用 replace 跳转
        // next(false); // 可以选择阻止导航，但跳转更明确
      }
    } else {
      // 访问公共页面 (如果定义了的话)，直接放行
      console.log(`[子应用路由守卫 - 独立运行] 导航到: ${to.path}, 无需认证，允许访问`);
      next();
    }
  }
});
// --- 修改结束 ---

export default router;