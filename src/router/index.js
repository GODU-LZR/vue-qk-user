import Vue from 'vue';
import Router from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';

// 页面视图
import DashboardPage from '@/views/DashboardPage.vue';
import ProfileInfoPage from '@/views/user/ProfileInfoPage.vue';
import ProfileEditPage from '@/views/user/ProfileEditPage.vue';
import ProfileDeletePage from '@/views/user/ProfileDeletePage.vue';
import UserManagementPage from '@/views/admin/UserManagementPage.vue';
import UserCreatePage from '@/views/admin/UserCreatePage.vue';
import UserEditPage from '@/views/admin/UserEditPage.vue';

Vue.use(Router);

const routes = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      // 仪表盘
      { path: 'dashboard', name: 'Dashboard', component: DashboardPage, meta: { title: '仪表盘' } },

      // 个人中心（下拉项）
      { path: 'profile', name: 'ProfileInfo', component: ProfileInfoPage, meta: { title: '个人信息' } },
      { path: 'profile/edit', name: 'ProfileEdit', component: ProfileEditPage, meta: { title: '修改信息' } },
      { path: 'profile/delete', name: 'ProfileDelete', component: ProfileDeletePage, meta: { title: '注销账号' } },

      // 用户管理（下拉项）
      { path: 'admin/users', name: 'UserManagement', component: UserManagementPage, meta: { title: '用户管理' } },
      { path: 'admin/users/create', name: 'UserCreate', component: UserCreatePage, meta: { title: '添加用户' } },
      { path: 'admin/users/edit/:id', name: 'UserEdit', component: UserEditPage, meta: { title: '编辑用户' } },

      // fallback
      { path: '*', redirect: '/dashboard' }
    ]
  }
];

const router = new Router({
  mode: 'history',
  base: window.__POWERED_BY_QIANKUN__ ? '/user' : '/',
  routes
});

export default router;
