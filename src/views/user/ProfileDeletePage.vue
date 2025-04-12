<template>
  <el-card class="delete-page" shadow="never">
    <div class="header">
      <i class="el-icon-warning-outline warning-icon" />
      <h2>注销账号</h2>
    </div>
    <p class="tip-text">
      注销账号将 <strong style="color:#f56c6c">永久删除</strong> 您的账户，数据不可恢复，请谨慎操作。
    </p>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" label-position="left">
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入注册邮箱" prefix-icon="el-icon-message" style="width: 60%; margin-right: 10px;" />
        <el-button @click="sendVerificationCode" type="primary" plain :disabled="!form.email">发送验证码</el-button>
      </el-form-item>

      <el-form-item label="验证码" prop="emailCode">
        <el-input v-model="form.emailCode" placeholder="请输入验证码" prefix-icon="el-icon-key" />
      </el-form-item>

      <el-form-item label="当前密码" prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码以验证身份" show-password prefix-icon="el-icon-lock" />
      </el-form-item>

      <el-form-item>
        <el-button type="danger" icon="el-icon-delete" @click="handleDelete">确认注销</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
export default {
  name: 'ProfileDeletePage',
  data() {
    return {
      form: {
        email: 'admin@example.com', // 可预填当前用户邮箱
        emailCode: '',
        password: ''
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ],
        emailCode: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    handleDelete() {
      this.$refs.formRef.validate(valid => {
        if (!valid) return;
        this.$confirm('确定要注销账号？此操作不可恢复！', '警告', {
          confirmButtonText: '注销',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$message.success('已提交注销（请接入后端接口）');
          // TODO: API 请求注销并调用主应用退出
        }).catch(() => {
          this.$message.info('已取消注销');
        });
      });
    },
    sendVerificationCode() {
      if (!this.form.email) return;
      // TODO: 调用发送验证码接口
      this.$message.success(`验证码已发送至 ${this.form.email}`);
    }
  }
};
</script>

<style scoped>
.delete-page {
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.header {
  display: flex;
  justify-content: center; /* 居中对齐 */
  align-items: center;     /* 垂直居中 */
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 26px;
  color: #f56c6c;
  margin-right: 10px;
}

.tip-text {
  margin-bottom: 30px;
  color: #606266;
  font-size: 14px;
}
</style>
