// src/router/index.js
import Vue from 'vue'
import Router from 'vue-router'
import Home from '../views/Home.vue' // 示例

Vue.use(Router)

const routes = [
  {
    path: '/',
    name: 'UserHome',
    component: Home
  }
]

const router = new Router({
  mode: 'history',
  // 若在 qiankun 环境下，设置 base 为 /user
  base: window.__POWERED_BY_QIANKUN__ ? '/user' : '/',
  routes
})

export default router
