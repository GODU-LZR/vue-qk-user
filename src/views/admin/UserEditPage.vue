<template>
  <div class="user-edit-page">
    <!-- 1. 美化后的标题 -->
    <div class="page-title-container">
      <i class="el-icon-edit page-title-icon"></i>
      <h2 class="page-title">编辑用户信息</h2>
    </div>

    <!-- 2. 使用 el-card 包装表单 -->
    <el-card shadow="hover" class="edit-card" v-loading="loading">
      <!-- 加载失败或用户不存在提示 -->
      <div v-if="!userFound && !loading" class="not-found-tip">
        <i class="el-icon-warning-outline"></i>
        <p>用户不存在或加载失败。</p>
        <el-button type="text" @click="goBack">返回用户列表</el-button>
      </div>

      <!-- 用户编辑表单 -->
      <el-form v-else :model="userForm" :rules="rules" ref="userForm" label-width="100px" class="user-form">
        <el-row :gutter="20">
          <!-- 左侧：头像和基础信息 -->
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
                    title="点击上传新头像"
                >
                  <i class="el-icon-camera-solid uploader-icon"></i>
                </el-upload>
              </div>
              <div class="el-upload__tip">点击图标上传新头像 (JPG/PNG, &lt; 2MB)</div>
            </el-form-item>
            <el-form-item label="用户编号" class="readonly-item">
              <el-input :value="userForm.userCode" disabled>
                <i slot="prefix" class="el-input__icon el-icon-postcard"></i>
              </el-input>
            </el-form-item>
            <el-form-item label="当前状态" class="readonly-item">
              <el-tag :type="getStatusTagType(userForm.status)" size="medium" effect="light">
                <i :class="statusIconClass(userForm.status)" style="margin-right: 4px;"></i>
                {{ formatStatus(userForm.status) }}
              </el-tag>
              <div v-if="userForm.banEndTime" class="ban-time-tip">
                (至 {{ formatDateTime(userForm.banEndTime) }})
              </div>
            </el-form-item>
          </el-col>

          <!-- 右侧：其他可编辑信息 -->
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

            <el-divider content-position="left">修改密码 (可选)</el-divider>

            <el-form-item label="新密码" prop="password">
              <el-input type="password" v-model="userForm.password" show-password placeholder="留空则不修改密码" clearable>
                <i slot="prefix" class="el-input__icon el-icon-lock"></i>
              </el-input>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword" v-if="userForm.password">
              <el-input type="password" v-model="userForm.confirmPassword" show-password placeholder="再次输入新密码" clearable>
                <i slot="prefix" class="el-input__icon el-icon-check"></i>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 表单操作按钮 -->
        <el-form-item class="form-actions">
          <el-button type="primary" icon="el-icon-check" @click="submitForm('userForm')" :loading="submitting">
            保存修改
          </el-button>
          <el-button icon="el-icon-refresh-left" @click="resetForm()">
            重置表单
          </el-button>
          <el-button icon="el-icon-back" @click="goBack">
            返回列表
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// 辅助函数：生成基于用户名的头像 URL (使用 DiceBear initials)
function generateAvatar(seed) {
  if (!seed) {
    // 如果种子无效，返回一个默认或null
    return 'https://api.dicebear.com/7.x/initials/svg?seed=Default&size=120'; // 或返回 null
  }
  const size = 120; // 头像尺寸
  // 对 seed 进行编码，以防包含特殊字符
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedSeed}&size=${size}&backgroundColor=409eff,67c23a,e6a23c,f56c6c&backgroundType=gradientLinear&radius=50`;
}

export default {
  name: 'UserEditPage',
  data() {
    // --- 密码验证逻辑 (保持不变) ---
    const validatePass = (rule, value, callback) => {
      if (value && value.length < 6) {
        callback(new Error('新密码长度不能少于 6 位'));
      } else {
        if (this.userForm.confirmPassword || (this.userForm.password && this.$refs.userForm)) {
          // 如果确认密码有值，或者新密码有值且表单已渲染，触发确认密码的校验
          this.$nextTick(() => { // 确保DOM更新后再校验
            if (this.$refs.userForm && this.userForm.password) {
              this.$refs.userForm.validateField('confirmPassword');
            }
          });
        }
        callback();
      }
    };
    const validatePass2 = (rule, value, callback) => {
      if (this.userForm.password && !value) {
        callback(new Error('请再次输入新密码'));
      } else if (value !== this.userForm.password) {
        callback(new Error('两次输入的新密码不一致!'));
      } else {
        callback();
      }
    };

    return {
      loading: false,
      submitting: false,
      userFound: false,
      userId: null,
      originalUserForm: {}, // 保存初始加载的数据
      userForm: { // 表单绑定对象
        id: null,
        userCode: '',
        username: '',
        realName: '',
        email: '',
        password: '',
        confirmPassword: '',
        avatar: null, // 存储实际的头像URL（上传的或后端返回的）
        avatarFile: null, // 存储待上传的文件对象
        status: 0,
        banEndTime: null,
      },
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
          { validator: validatePass, trigger: 'blur' }
        ],
        confirmPassword: [
          // 确认密码的验证依赖于新密码，使用 validator
          { validator: validatePass2, trigger: 'blur' }
        ]
        // avatar 字段通常不需要表单验证规则，由 beforeUpload 控制
      }
    };
  },
  computed: {
    // --- 计算属性：用于显示头像 ---
    displayAvatar() {
      // 如果 userForm.avatar 有值 (表示已上传或从后端获取)，则使用它
      if (this.userForm.avatar) {
        return this.userForm.avatar;
      }
      // 否则，根据用户名生成头像
      // 确保在 userForm.username 加载后再生成
      if (this.userForm.username) {
        return generateAvatar(this.userForm.username);
      }
      // 如果连用户名都没有，返回 null 或默认占位符
      return null; // 或者返回一个通用的占位符 URL
    }
  },
  created() {
    this.userId = this.$route.params.id;
    if (this.userId) {
      this.fetchUserData(this.userId);
    } else {
      this.$message.error('无效的用户ID');
      this.goBack();
    }
  },
  methods: {
    fetchUserData(id) {
      this.loading = true;
      console.log(`模拟根据 ID: ${id} 获取用户数据`);
      // --- 模拟 API 请求 ---
      setTimeout(() => {
        // 模拟从后端获取的数据
        const fetchedData = {
          id: parseInt(id),
          userCode: `USR${String(id).padStart(4, '0')}`,
          username: `user_${id}`,
          realName: `用户 ${id}`,
          email: `user${id}@example.com`,
          // 模拟后端可能返回 null 或有效的 avatar URL
          avatar: id % 3 === 0 ? `https://cube.elemecdn.com/${id % 9}/7c/3ea6beec64369c2642b92c6726f1epng.png` : null,
          status: id % 4,
          banEndTime: id % 4 === 1 ? '2024-06-15T12:00:00Z' : (id % 4 === 2 ? '2024-06-30T18:00:00Z' : null),
        };

        if (fetchedData) {
          // 填充表单，注意 avatar 可能为 null
          this.userForm = {
            ...this.userForm, // 保留 password, confirmPassword, avatarFile
            id: fetchedData.id,
            userCode: fetchedData.userCode,
            username: fetchedData.username,
            realName: fetchedData.realName,
            email: fetchedData.email,
            avatar: fetchedData.avatar, // 直接使用后端返回的 avatar 值
            status: fetchedData.status,
            banEndTime: fetchedData.banEndTime,
          };
          // 保存原始数据用于重置
          this.originalUserForm = JSON.parse(JSON.stringify(this.userForm));
          this.userFound = true;
        } else {
          this.userFound = false;
          this.$message.error('未能加载用户信息');
        }
        this.loading = false;
      }, 500);
    },

    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.submitting = true;
          console.log('编辑表单验证通过，准备提交:', this.userForm);

          // --- 准备提交的数据 ---
          // 实际项目中，你可能需要创建一个新的对象，只包含需要提交的字段
          // 特别是密码，只有在 this.userForm.password 非空时才提交
          const formDataToSubmit = new FormData(); // 使用 FormData 处理文件上传
          formDataToSubmit.append('id', this.userForm.id);
          formDataToSubmit.append('username', this.userForm.username);
          formDataToSubmit.append('realName', this.userForm.realName);
          formDataToSubmit.append('email', this.userForm.email);

          // 只有在新密码输入时才提交
          if (this.userForm.password) {
            formDataToSubmit.append('password', this.userForm.password);
          }

          // 如果有新上传的头像文件，则添加
          if (this.userForm.avatarFile) {
            formDataToSubmit.append('avatarFile', this.userForm.avatarFile, this.userForm.avatarFile.name);
          } else {
            // 如果没有新文件，但用户可能清除了头像，需要告知后端
            // (这里简单处理，如果 avatar 为 null 且没有新文件，后端可能需要特殊处理)
            // 或者，你可以在表单中添加一个隐藏字段或按钮来明确表示“移除头像”
            // 如果 this.userForm.avatar 本身就是 null，并且没有新文件，可以不传 avatar 相关字段
            // 如果 this.userForm.avatar 有值但没有新文件，说明保持不变，也不用传文件
          }
          // 注意：如果后端API期望JSON，则需要调整数据格式，文件上传通常用 FormData

          console.log('模拟提交的数据 (FormData):', formDataToSubmit); // 无法直接看内容
          for (let pair of formDataToSubmit.entries()) {
            console.log(pair[0]+ ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
          }


          // --- 模拟 API 请求 ---
          setTimeout(() => {
            this.$message.success('用户信息更新成功！');
            this.submitting = false;
            // 更新成功后，重置 avatarFile 并更新原始数据备份
            this.userForm.avatarFile = null;
            // 假设后端返回了更新后的用户信息（包括可能的新头像URL），需要重新设置 userForm 和 originalUserForm
            // 这里简单地将当前表单状态设为新的原始状态
            this.originalUserForm = JSON.parse(JSON.stringify(this.userForm));
            // 密码字段应清空
            this.userForm.password = '';
            this.userForm.confirmPassword = '';
            // 重新获取一次数据可能是更好的做法，以同步最新状态
            // this.fetchUserData(this.userId);
          }, 1000);

        } else {
          console.log('编辑表单验证失败!');
          this.$message.error('请检查表单填写是否正确');
          return false;
        }
      });
    },

    resetForm() {
      // 重置为初始加载的数据
      // 特别注意：需要保留 id 和 userCode 等不可变字段
      const id = this.userForm.id;
      const userCode = this.userForm.userCode;
      this.userForm = JSON.parse(JSON.stringify(this.originalUserForm));
      this.userForm.id = id; // 确保 ID 不丢失
      this.userForm.userCode = userCode; // 确保 Code 不丢失
      this.userForm.avatarFile = null; // 清除待上传文件
      // 清除密码字段
      this.userForm.password = '';
      this.userForm.confirmPassword = '';

      // 清除验证状态
      this.$nextTick(() => {
        this.$refs.userForm.clearValidate();
      });
      this.$message.info('表单已重置为上次保存的状态');
    },

    goBack() {
      // 可以考虑检查是否有未保存的更改
      // if (JSON.stringify(this.userForm) !== JSON.stringify(this.originalUserForm)) { ... }
      this.$router.push('/admin/users'); // 返回列表页
    },

    // --- 头像上传处理 ---
    handleFakeUpload(options) {
      const file = options.file;
      // 使用 FileReader 在前端预览
      const reader = new FileReader();
      reader.onload = (e) => {
        // 更新 avatar 以立即显示预览
        this.userForm.avatar = e.target.result; // 这是 DataURL
      };
      reader.readAsDataURL(file);
      // 保存文件对象，用于提交
      this.userForm.avatarFile = file;
      console.log('New avatar selected:', file.name);
      this.$message.success('头像已选择，保存后生效');
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
      return (isJPG || isPNG) && isLt2M;
    },

    // --- 辅助方法 ---
    formatStatus(status) {
      const statusMap = { 0: '正常', 1: '临时封禁', 2: '长期封禁', 3: '永久封禁' };
      return statusMap[status] || '未知状态';
    },
    getStatusTagType(status) {
      const typeMap = { 0: 'success', 1: 'warning', 2: 'danger', 3: 'info' };
      return typeMap[status] || 'info';
    },
    statusIconClass(status) {
      const iconMap = { 0: 'el-icon-circle-check', 1: 'el-icon-remove', 2: 'el-icon-warning', 3: 'el-icon-lock' };
      return iconMap[status] || 'el-icon-question';
    },
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '-';
      try {
        // 尝试更健壮的日期解析
        let date = new Date(dateTimeString);
        // 检查是否包含'T'和'Z'，如果是UTC，直接用 toLocaleString 可能更准确反映本地时间
        if (dateTimeString.includes('T') && dateTimeString.includes('Z')) {
          // 如果是标准的 ISO 8601 UTC 格式
          // return date.toLocaleString(); // 显示本地时间
          // 或者保持统一格式
        } else {
          // 尝试兼容 'YYYY-MM-DD HH:MM:SS' (可能需要替换空格为T)
          const fallbackDate = new Date(dateTimeString.replace(' ', 'T'));
          if (!isNaN(fallbackDate.getTime())) {
            date = fallbackDate;
          }
        }

        if (isNaN(date.getTime())) { // 检查日期是否有效
          console.warn("Could not parse date:", dateTimeString);
          return dateTimeString; // 无法解析，返回原始字符串
        }

        // 格式化输出 'YYYY-MM-DD HH:MM'
        return date.getFullYear() + '-' +
            ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
            ('0' + date.getDate()).slice(-2) + ' ' +
            ('0' + date.getHours()).slice(-2) + ':' +
            ('0' + date.getMinutes()).slice(-2);
      } catch (e) {
        console.error("Error formatting date:", dateTimeString, e);
        return dateTimeString; // 出错时返回原始字符串
      }
    }
  }
}
</script>

<style scoped>
.user-edit-page {
  padding: 25px;
  background-color: #f8f9fa; /* 淡灰色背景 */
}

/* 页面标题样式 */
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
  color: #409EFF;
  margin-right: 12px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 编辑卡片 */
.edit-card {
  border: none; /* 移除卡片默认边框 */
  border-radius: 8px; /* 更圆润的边角 */
  overflow: hidden; /* 确保内容不溢出圆角 */
}

/* 用户未找到提示 */
.not-found-tip {
  text-align: center;
  padding: 50px 20px;
  color: #888;
}
.not-found-tip i {
  font-size: 48px;
  color: #E6A23C;
  margin-bottom: 15px;
  display: block;
}
.not-found-tip p {
  font-size: 16px;
  margin-bottom: 20px;
}

/* 表单整体样式 */
.user-form {
  padding: 10px 20px 20px 20px; /* 调整内边距 */
}

/* 头像区域 */
.avatar-section {
  text-align: center; /* 头像居中 */
  padding-bottom: 20px;
  border-right: 1px solid #f0f2f5; /* 右侧加分隔线 (可选) */
}
@media (max-width: 767px) {
  .avatar-section {
    border-right: none; /* 小屏幕移除分隔线 */
    border-bottom: 1px solid #f0f2f5; /* 小屏幕底部加分隔线 */
    margin-bottom: 20px;
  }
}

.avatar-display-area {
  position: relative;
  display: inline-block; /* 让区域包裹内容 */
  margin-bottom: 10px;
}

.form-avatar {
  display: block;
  border: 2px solid #eee; /* 头像加个边框 */
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.form-avatar .el-icon-user-solid {
  font-size: 60px; /* 调整图标大小 */
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

/* 隐藏原始的上传触发器 */
.avatar-uploader .el-upload {
  display: none; /* 我们用自己的图标触发 */
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
  color: #606266; /* 让禁用状态的文字更清晰一点 */
  cursor: default;
}
.readonly-item .el-input__icon {
  line-height: inherit; /* 确保图标垂直居中 */
}

/* 状态标签和提示 */
.ban-time-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 表单项图标 */
.el-input__icon {
  line-height: 40px; /* 确保图标垂直居中 (可能需要根据 input 高度调整) */
  color: #c0c4cc;
}
.el-input--prefix .el-input__inner {
  padding-left: 30px;
}

/* 分隔线 */
.el-divider--horizontal {
  margin: 25px 0;
}

/* 表单操作按钮区域 */
.form-actions {
  margin-top: 30px;
  text-align: center; /* 按钮居中 */
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}
.form-actions .el-button + .el-button {
  margin-left: 15px; /* 按钮间距 */
}

</style>
