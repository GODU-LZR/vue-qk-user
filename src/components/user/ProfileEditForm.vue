<template>
  <el-card class="profile-edit-form" shadow="never">
    <!-- 头部部分，添加居中的图标和标题 -->
    <div class="card-header">
      <!-- 居中显示的图标和标题 -->
      <div class="header-title">
        <i class="el-icon-edit profile-icon"></i>
        <h2>修改信息</h2>
      </div>
    </div>

    <!-- 上传头像 -->
    <div class="avatar-section">
      <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
          :disabled="!isEditMode"
      >
        <img v-if="form.avatar" :src="form.avatar" class="avatar" />
        <i v-else class="el-icon-plus avatar-uploader-icon"></i>
      </el-upload>
    </div>

    <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="100px"
        label-position="left"
    >
      <el-form-item label="用户编号">
        <el-input v-model="form.userCode" disabled prefix-icon="el-icon-s-order" />
      </el-form-item>

      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" :disabled="!isEditMode" prefix-icon="el-icon-user" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input
            v-model="form.email"
            :disabled="!isEditMode"
            placeholder="请输入新邮箱"
            prefix-icon="el-icon-message"
            style="width: 60%; margin-right: 10px"
        />
        <el-button v-if="isEditMode && showEmailCode" @click="sendVerificationCode" type="primary" plain>发送验证码</el-button>
      </el-form-item>

      <el-form-item label="验证码" prop="emailCode" v-if="isEditMode && showEmailCode">
        <el-input v-model="form.emailCode" placeholder="请输入验证码" prefix-icon="el-icon-key" />
      </el-form-item>

      <el-form-item label="真实姓名" prop="realName">
        <el-input v-model="form.realName" :disabled="!isEditMode" prefix-icon="el-icon-s-custom" />
      </el-form-item>

      <el-form-item label="原密码" prop="oldPassword" v-if="isEditMode && form.password">
        <el-input v-model="form.oldPassword" type="password" placeholder="请输入原密码" show-password prefix-icon="el-icon-lock" />
      </el-form-item>

      <el-form-item label="新密码" prop="password">
        <el-input v-model="form.password" :disabled="!isEditMode" type="password" placeholder="不填表示不修改" show-password prefix-icon="el-icon-lock" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" v-if="isEditMode">保存修改</el-button>
        <el-button @click="handleReset" v-if="isEditMode">重置</el-button>
        <el-button type="text" icon="el-icon-edit" v-if="!isEditMode" @click="isEditMode = true">修改信息</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
export default {
  name: 'ProfileEditForm',
  data() {
    return {
      isEditMode: false, // 是否处于编辑状态
      form: {
        userCode: 'USR10001',
        username: 'admin',
        email: 'admin@example.com',
        realName: '张三',
        oldPassword: '',
        password: '',
        emailCode: '',
        avatar: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          {
            type: 'email',
            message: '请输入正确的邮箱格式',
            trigger: ['blur', 'change']
          }
        ],
        emailCode: [
          { required: true, message: '请输入邮箱验证码', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' }
        ],
        oldPassword: [
          {
            validator: (rule, value, callback) => {
              if (this.form.password && !value) {
                callback(new Error('请填写原密码以验证身份'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        password: [
          {
            validator: (rule, value, callback) => {
              if (value && value.length < 5) {
                callback(new Error('新密码长度不能少于5位'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ]
      }
    };
  },
  computed: {
    showEmailCode() {
      return this.form.email !== 'admin@example.com'; // 邮箱改了才弹出验证码输入框
    }
  },
  methods: {
    handleSubmit() {
      this.$refs.formRef.validate(valid => {
        if (!valid) return;
        this.$message.success('信息已保存（静态阶段）');
        this.isEditMode = false;
      });
    },
    handleReset() {
      this.$refs.formRef.resetFields();
    },
    sendVerificationCode() {
      this.$message.success(`验证码已发送至 ${this.form.email}`);
    },
    handleAvatarSuccess(response, file) {
      this.form.avatar = URL.createObjectURL(file.raw);
    },
    beforeAvatarUpload(file) {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isImage) this.$message.error('只能上传图片格式！');
      if (!isLt2M) this.$message.error('图片大小不能超过 2MB！');
      return isImage && isLt2M;
    }
  }
};
</script>

<style scoped>
.profile-edit-form {
  max-width: 700px;
  margin: 30px auto;
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 头部部分，添加居中的图标和标题 */
.card-header {
  display: flex;
  justify-content: center; /* 居中显示图标和标题 */
  align-items: center;
  padding: 20px 0;
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
  text-align: center;
  margin-bottom: 30px;
}

.avatar-uploader {
  display: inline-block;
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  background-color: #fff;
  text-align: center;
  line-height: 100px;
  position: relative;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
