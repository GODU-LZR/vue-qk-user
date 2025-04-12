<template>
  <div class="user-create-page">
    <!-- 1. 美化后的标题 -->
    <div class="page-title-container">
      <i class="el-icon-plus page-title-icon"></i>
      <h2 class="page-title">添加新用户</h2>
    </div>

    <!-- 2. 使用 el-card 包装表单 -->
    <el-card shadow="hover" class="create-card">
      <el-form :model="userForm" :rules="rules" ref="userForm" label-width="100px" class="user-form">
        <el-row :gutter="30">
          <!-- 左侧：头像 -->
          <el-col :xs="24" :sm="10" :md="8" class="avatar-section">
            <el-form-item label="" prop="avatar" label-width="0">
              <div class="avatar-display-area">
                <!-- 使用 computed property 'displayAvatar' -->
                <el-avatar :size="120" :src="displayAvatar" class="form-avatar">
                  <!-- Fallback if displayAvatar is also empty/fails -->
                  <i class="el-icon-user-solid"></i>
                </el-avatar>
                <el-upload
                    class="avatar-uploader"
                    action="#"
                    :show-file-list="false"
                    :http-request="handleFakeUpload"
                    :before-upload="beforeAvatarUpload"
                    title="点击上传头像"
                >
                  <i class="el-icon-camera-solid uploader-icon"></i>
                </el-upload>
              </div>
              <div class="el-upload__tip">可选，不上传将根据用户名生成。支持 JPG/PNG, &lt; 2MB</div>
            </el-form-item>
            <el-form-item label="用户编号" class="readonly-item">
              <el-input value="系统自动分配" disabled>
                <i slot="prefix" class="el-input__icon el-icon-postcard"></i>
              </el-input>
            </el-form-item>
          </el-col>

          <!-- 右侧：用户信息 -->
          <el-col :xs="24" :sm="14" :md="16">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userForm.username" placeholder="用于登录系统，将影响默认头像" clearable @input="handleUsernameInput">
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

        <!-- 表单操作按钮 -->
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
// 辅助函数：生成基于用户名的头像 URL (使用 DiceBear initials)
function generateAvatar(seed) {
  // 提供一个默认种子，以防输入为空时也能生成一个头像
  const safeSeed = seed || 'NewUser';
  const size = 120; // 头像尺寸
  const encodedSeed = encodeURIComponent(safeSeed);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedSeed}&size=${size}&backgroundColor=409eff,67c23a,e6a23c,f56c6c&backgroundType=gradientLinear&radius=50`;
}

export default {
  name: 'UserCreatePage',
  data() {
    // --- 密码验证逻辑 (保持不变) ---
    const validatePass = (rule, value, callback) => {
      if (!value) { // 必填
        callback(new Error('请输入密码'));
      } else if (value.length < 6) {
        callback(new Error('密码长度不能少于 6 位'));
      } else {
        // 如果确认密码有值，触发确认密码的校验
        if (this.userForm.confirmPassword) {
          this.$refs.userForm.validateField('confirmPassword');
        }
        callback();
      }
    };
    const validatePass2 = (rule, value, callback) => {
      if (!value) { // 必填
        callback(new Error('请再次输入密码'));
      } else if (value !== this.userForm.password) {
        callback(new Error('两次输入的新密码不一致!'));
      } else {
        callback();
      }
    };

    return {
      submitting: false,
      userForm: { // 表单绑定对象
        username: '',
        realName: '',
        email: '',
        password: '',
        confirmPassword: '',
        avatarPreview: null, // 存储上传头像的预览 DataURL
        avatarFile: null, // 存储待上传的文件对象
      },
      // 标志位，表示用户是否已选择上传头像
      // 用于决定 displayAvatar 是显示上传预览还是生成的头像
      avatarUploadedByUser: false,
      rules: { // 验证规则
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
          // 长度校验已包含在 validatePass 中
        ],
        confirmPassword: [
          { required: true, validator: validatePass2, trigger: 'blur' }
        ]
        // avatar 字段不需要表单验证规则，由 beforeUpload 控制
      }
    };
  },
  computed: {
    // --- 计算属性：用于显示头像 ---
    displayAvatar() {
      // 如果用户已经上传了头像，优先显示预览图
      if (this.avatarUploadedByUser && this.userForm.avatarPreview) {
        return this.userForm.avatarPreview;
      }
      // 否则，根据用户名生成头像 (即使为空也会生成默认的)
      return generateAvatar(this.userForm.username);
    }
  },
  methods: {
    handleUsernameInput() {
      // 当用户名输入变化时，如果用户没有主动上传头像，
      // displayAvatar 会自动重新计算并更新（因为依赖于 userForm.username）
      // 这里不需要额外做什么，除非你想在输入时强制清除已上传的头像预览
      // if (this.avatarUploadedByUser) {
      //   // 可选：如果希望用户名改变时重置上传的头像
      //   this.userForm.avatarPreview = null;
      //   this.userForm.avatarFile = null;
      //   this.avatarUploadedByUser = false;
      // }
    },

    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.submitting = true;
          console.log('创建表单验证通过，准备提交:', this.userForm);

          // --- 准备提交的数据 ---
          const formDataToSubmit = new FormData();
          formDataToSubmit.append('username', this.userForm.username);
          formDataToSubmit.append('realName', this.userForm.realName);
          formDataToSubmit.append('email', this.userForm.email);
          formDataToSubmit.append('password', this.userForm.password); // 密码是必填的

          // 如果用户上传了头像文件，则添加
          if (this.userForm.avatarFile) {
            formDataToSubmit.append('avatarFile', this.userForm.avatarFile, this.userForm.avatarFile.name);
          }
          // 注意：如果用户没上传，后端可以根据情况决定是否需要根据用户名生成并保存头像

          console.log('模拟提交的数据 (FormData):');
          for (let pair of formDataToSubmit.entries()) {
            console.log(pair[0]+ ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
          }

          // --- 模拟 API 请求 ---
          setTimeout(() => {
            this.$message.success('新用户创建成功！');
            this.submitting = false;
            // 创建成功后跳转回列表页
            this.$router.push('/admin/users');
          }, 1000);

        } else {
          console.log('创建表单验证失败!');
          this.$message.error('请检查表单填写是否正确');
          return false;
        }
      });
    },

    resetForm(formName) {
      // 重置 Element UI 表单项到初始值
      this.$refs[formName].resetFields();
      // 手动清除头像预览和文件对象，并重置上传标志
      this.userForm.avatarPreview = null;
      this.userForm.avatarFile = null;
      this.avatarUploadedByUser = false;

      // 清除可能残留的验证错误提示
      this.$nextTick(() => {
        this.$refs.userForm.clearValidate();
      });
      this.$message.info('表单已重置');
    },

    goBack() {
      // 可以考虑添加一个确认对话框，如果表单已填写
      // if (this.userForm.username || ...) { ... }
      this.$router.push('/admin/users'); // 明确返回列表页
    },

    // --- 头像上传处理 ---
    handleFakeUpload(options) {
      const file = options.file;
      // 使用 FileReader 在前端预览
      const reader = new FileReader();
      reader.onload = (e) => {
        // 更新 avatarPreview 以立即显示预览
        this.userForm.avatarPreview = e.target.result; // 这是 DataURL
        this.avatarUploadedByUser = true; // 标记用户已上传
      };
      reader.readAsDataURL(file);
      // 保存文件对象，用于提交
      this.userForm.avatarFile = file;
      console.log('New avatar selected:', file.name);
      // 不需要提示，预览会自动更新
    },

    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isPNG = file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG && !isPNG) {
        this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      // 只有在验证通过时才允许 handleFakeUpload 执行
      if ((isJPG || isPNG) && isLt2M) {
        return true;
      } else {
        // 验证失败时，清除可能已设置的文件和预览，防止显示错误预览
        this.userForm.avatarPreview = null;
        this.userForm.avatarFile = null;
        this.avatarUploadedByUser = false;
        return false;
      }
    }
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
  font-size: 60px;
}

.avatar-uploader {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 32px;
  height: 32px;
  line-height: 32px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}
.avatar-uploader:hover {
  background-color: rgba(0, 0, 0, 0.7);
}
.uploader-icon {
  color: #fff;
  font-size: 18px;
}

.avatar-uploader .el-upload {
  display: none; /* 隐藏默认触发器 */
}

.el-upload__tip {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  margin-top: 8px;
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
