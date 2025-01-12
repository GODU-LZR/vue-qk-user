<!-- vue-qk-user/src/views/Home.vue -->
<template>
  <div>
    <h2>用户信息模块首页</h2>
    <el-button type="primary" @click="showMessage">点击测试</el-button>
  </div>
</template>

<script>
export default {
  name: 'UserHome',
  methods: {
    showMessage() {
      this.$message('用户信息子应用的 ElementUI 按钮点击了！');
    }
  }
}
</script>