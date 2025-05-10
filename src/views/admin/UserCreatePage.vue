<template>
  <div class="user-create-page">
    <div class="page-title-container">
      <i class="el-icon-plus page-title-icon"></i>
      <h2 class="page-title">添加新用户</h2>
    </div>

    <el-card shadow="hover" class="create-card">
      <el-form :model="userForm" :rules="rules" ref="userForm" label-width="100px" class="user-form">
        <el-row :gutter="30">
          <el-col :xs="24" :sm="10" :md="8" class="avatar-section">
            <el-form-item label="" label-width="0">
              <div class="avatar-display-area">
                <el-avatar :size="120" :src="defaultAvatar" class="form-avatar">
                  <i class="el-icon-user-solid"></i>
                </el-avatar>
              </div>
            </el-form-item>
            <el-form-item label="用户编号" class="readonly-item">
              <el-input value="系统自动分配" disabled>
                <i slot="prefix" class="el-input__icon el-icon-postcard"></i>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="14" :md="16">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userForm.username" placeholder="用于登录系统" clearable>
                <i slot="prefix" class="el-input__icon el-icon-user"></i>
              </el-input>
            </el-form-item>

            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="userForm.realName" placeholder="用户的真实姓名" clearable>
                <i slot="prefix" class="el-input__icon el-icon-s-custom"></i>
              </el-input>
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="用于接收通知、找回密码等" clearable>
                <i slot="prefix" class="el-input__icon el-icon-message"></i>
              </el-input>
            </el-form-item>

            <el-divider content-position="left">设置初始密码</el-divider>

            <el-form-item label="密码" prop="password">
              <el-input type="password" v-model="userForm.password" show-password placeholder="设置初始登录密码 (至少6位)" clearable>
                <i slot="prefix" class="el-input__icon el-icon-lock"></i>
              </el-input>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input type="password" v-model="userForm.confirmPassword" show-password placeholder="再次输入密码" clearable>
                <i slot="prefix" class="el-input__icon el-icon-check"></i>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item class="form-actions">
          <el-button type="primary" icon="el-icon-check" @click="submitForm('userForm')" :loading="submitting">
            立即创建
          </el-button>
          <el-button icon="el-icon-refresh-right" @click="resetForm('userForm')">
            重置表单
          </el-button>
          <el-button icon="el-icon-back" @click="goBack">
            取消返回
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// 导入默认头像路径
import defaultAvatarStaticPath from '@/assets/default-avatar.png';
// 导入 API 函数
import { adminCreateUser } from '@/api/admin/index.js'; // 请确认您的 API 文件路径

export default {
  name: 'UserCreatePage',
  data() {
    // --- 密码验证逻辑 (保持不变) ---
    const validatePass = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'));
      } else if (value.length < 6) {
        callback(new Error('密码长度不能少于 6 位'));
      } else {
        if (this.userForm.confirmPassword) {
          this.$refs.userForm.validateField('confirmPassword');
        }
        callback();
      }
    };
    const validatePass2 = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.userForm.password) {
        callback(new Error('两次输入的新密码不一致!'));
      } else {
        callback();
      }
    };

    return {
      submitting: false,
      defaultAvatar: defaultAvatarStaticPath, // 将导入的默认头像路径存入data
      userForm: { // 表单绑定对象
        username: '',
        realName: '',
        email: '',
        password: '',
        confirmPassword: '',
        avatar: defaultAvatarStaticPath, // 头像字段，固定为默认头像路径
        // status 字段将在提交时固定为0，不在表单中绑定
      },
      rules: { // 验证规则 (根据您的图片，除了验证码都是必填)
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
        ],
        password: [
          { required: true, validator: validatePass, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, validator: validatePass2, trigger: 'blur' }
        ]
      }
    };
  },
  // computed 中不再需要 displayAvatar，可以直接在 template 中使用 this.defaultAvatar
  // 或者将 el-avatar 的 :src 直接绑定到 this.userForm.avatar
  methods: {
    // handleUsernameInput 不再需要处理头像逻辑，可以移除 (如果仅用于头像)
    // 如果还有其他用途则保留

    submitForm(formName) {
      this.$refs[formName].validate(async (valid) => { // 将回调改为 async
        if (valid) {
          this.submitting = true;
          console.log('创建表单验证通过，准备提交:', this.userForm);

          // --- 准备提交给 API 的数据 ---
          const userData = {
            username: this.userForm.username,
            realName: this.userForm.realName,
            email: this.userForm.email,
            password: this.userForm.password,
            avatar: this.userForm.avatar, // 发送默认头像路径
            status: 0 // 状态固定为0
          };

          try {
            // 调用实际的 API 函数
            const createdUser = await adminCreateUser(userData); // 使用 await 等待结果
            console.log('API调用成功，返回的用户信息:', createdUser); // createdUser 应该是 UserProfileDTO
            this.$message.success('新用户创建成功！');
            // 创建成功后跳转回列表页
            this.$router.push('/admin/users'); // 假设列表页路由为 /admin/users
          } catch (error) {
            console.error('创建用户失败 (API 调用出错):', error);
            // API 函数中如果 reject 了 Error 对象，error.message 可以获取错误信息
            // 如果是 Axios 错误，可能在 error.response.data.message 中
            const errMsg = error?.response?.data?.message || error?.message || '创建用户失败，请稍后重试。';
            this.$message.error(errMsg);
          } finally {
            this.submitting = false;
          }

        } else {
          console.log('创建表单验证失败!');
          this.$message.error('请检查表单填写是否正确');
          return false;
        }
      });
    },

    resetForm(formName) {
      this.$refs[formName].resetFields();
      // userForm.avatar 会因为 resetFields() 被重置 (如果 avatar 是 form item)
      // 如果不是，需要确保它仍然是 defaultAvatarStaticPath，但由于它在 data 中初始化且不通过表单改变，所以通常没问题
      // 这里确保一下
      this.userForm.avatar = defaultAvatarStaticPath;

      this.$nextTick(() => {
        this.$refs.userForm.clearValidate();
      });
      this.$message.info('表单已重置');
    },

    goBack() {
      this.$router.push('/admin/users');
    },

    // --- 头像上传相关方法已移除 ---
    // handleFakeUpload, beforeAvatarUpload
  }
}
</script>

<style scoped>
.user-create-page {
  padding: 25px;
  background-color: #f8f9fa; /* 淡灰色背景 */
}

/* 页面标题样式 - 与编辑页一致 */
.page-title-container {
  display: flex;
  align-items: center;
  justify-content: center; /* <<< 新增：水平居中 */
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}
.page-title-icon {
  font-size: 24px;
  color: #67C23A; /* 使用绿色表示添加 */
  margin-right: 12px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 创建卡片 - 与编辑页一致 */
.create-card {
  border: none;
  border-radius: 8px;
  overflow: hidden;
}

/* 表单整体样式 - 与编辑页一致 */
.user-form {
  padding: 10px 20px 20px 20px;
}

/* 头像区域 - 与编辑页一致 */
.avatar-section {
  text-align: center;
  padding-bottom: 20px;
  border-right: 1px solid #f0f2f5;
}
@media (max-width: 767px) {
  .avatar-section {
    border-right: none;
    border-bottom: 1px solid #f0f2f5;
    margin-bottom: 20px;
  }
}

.avatar-display-area {
  position: relative;
  display: inline-block;
  margin-bottom: 10px;
}

.form-avatar {
  display: block;
  border: 2px solid #eee;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.form-avatar .el-icon-user-solid {
  font-size: 60px; /* 如果默认头像加载失败，显示icon */
}

/* 移除了 .avatar-uploader 相关的样式，因为上传组件已删除 */

.el-upload__tip { /* 这个也可以删掉，因为上传提示没了 */
  /* font-size: 12px;
  color: #999;
  line-height: 1.4;
  margin-top: 8px; */
}

/* 只读表单项 */
.readonly-item .el-input.is-disabled .el-input__inner {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
  cursor: default;
}
.readonly-item .el-input__icon {
  line-height: inherit;
}

/* 表单项图标 - 与编辑页一致 */
.el-input__icon {
  line-height: 40px; /* 或 inherit */
  color: #c0c4cc;
}
.el-input--prefix .el-input__inner {
  padding-left: 30px;
}

/* 分隔线 - 与编辑页一致 */
.el-divider--horizontal {
  margin: 25px 0;
}

/* 表单操作按钮区域 - 与编辑页一致 */
.form-actions {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}
.form-actions .el-button + .el-button {
  margin-left: 15px;
}
</style>