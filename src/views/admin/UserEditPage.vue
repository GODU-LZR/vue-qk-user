<template>
  <div class="user-edit-page">
    <div class="page-title-container">
      <i class="el-icon-edit page-title-icon"></i>
      <h2 class="page-title">编辑用户信息</h2>
    </div>

    <el-card shadow="hover" class="edit-card" v-loading="loading">

      <div v-if="!loading && !userFound" class="not-found-tip">
        <i class="el-icon-warning-outline"></i>
        <p v-if="userId">在缓存中未找到 ID 为 {{ userId }} 的用户数据。</p>
        <p v-else>无效的用户 ID。</p>
        <el-button type="text" @click="goBack">返回用户列表</el-button>
      </div>

      <el-form v-if="!loading && userFound" :model="userForm" :rules="rules" ref="userForm" label-width="100px" class="user-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="10" :md="8" class="avatar-section">
            <el-form-item label="" prop="avatar" label-width="0">
              <div class="avatar-display-area">
                <el-avatar :size="120" :key="avatarKey" :src="displayAvatarWithCacheBust" class="form-avatar">
                  <i class="el-icon-user-solid"></i>
                </el-avatar>
                <el-upload
                    class="avatar-uploader"
                    action="#"
                    :show-file-list="false"
                    :http-request="handleHttpRequest"
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
              <el-select v-model="userForm.status" placeholder="请选择状态" style="width: 100%;">
                <el-option
                    v-for="item in statusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  <el-tag :type="getStatusTagType(item.value)" size="small" effect="light" style="margin-right: 5px;">
                    <i :class="statusIconClass(item.value)"></i>
                  </el-tag>
                  <span>{{ item.label }}</span>
                </el-option>
              </el-select>
              <div v-if="userForm.banEndTime && userForm.status !== 0" class="ban-time-tip"> (至 {{ formatDateTime(userForm.banEndTime) }})
              </div>
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
// --- 导入 Vuex 辅助函数 ---
import { mapGetters, mapMutations } from 'vuex';
// --- 导入默认头像占位符 ---
import defaultAvatarPlaceholder from '@/assets/default-avatar.png';
// --- 导入 API 函数 ---
import { getUserAvatarUploadUrl, getFinalImageUrl } from '@/api/upload-file/index.js';
import { updateAdminUserProfile } from '@/api/admin/index.js';
// --- 导入 axios ---
import axios from 'axios';

export default {
  name: 'UserEditPage',
  data() {
    // --- 密码验证逻辑 ---
    const validatePass = (rule, value, callback) => {
      if (value && value.length < 6) { callback(new Error('新密码长度不能少于 6 位')); } else { if (this.userForm.password && this.$refs.userForm) { this.$nextTick(() => { this.$refs.userForm.validateField('confirmPassword'); }); } callback(); }
    };
    const validatePass2 = (rule, value, callback) => {
      if (this.userForm.password) { if (!value) { callback(new Error('请再次输入新密码')); } else if (value !== this.userForm.password) { callback(new Error('两次输入的新密码不一致!')); } else { callback(); } } else { callback(); }
    };

    return {
      loading: true,
      submitting: false,
      userFound: false,
      userId: null,
      originalUserForm: {},
      userForm: {
        id: null,
        userCode: '',
        username: '',
        realName: '',
        email: '',
        password: '',
        confirmPassword: '',
        avatar: null,
        status: 0,
        banEndTime: null,
      },
      statusOptions: [
        { value: 0, label: '正常' },
        { value: 1, label: '封禁15天' },
        { value: 2, label: '封禁30天' },
        { value: 3, label: '永久封禁' },
      ],
      rules: {
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
        status: [
          { required: true, message: '请选择用户状态', trigger: 'change' }
        ],
        password: [
          { validator: validatePass, trigger: 'blur' }
        ],
        confirmPassword: [
          { validator: validatePass2, trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    ...mapGetters(['getUserById']),
    avatarKey() {
      return `${this.userId}-${this.userForm.avatar || 'default'}`;
    },
    displayAvatarWithCacheBust() {
      const baseUrl = this.userForm.avatar;
      if (baseUrl && typeof baseUrl === 'string' && baseUrl.startsWith('http')) {
        try {
          const url = new URL(baseUrl);
          url.searchParams.set('_t', Date.now());
          return url.toString();
        } catch (e) {
          console.warn("[displayAvatar computed] Could not parse URL for cache busting, returning original:", baseUrl, e);
          return baseUrl;
        }
      } else if (baseUrl && typeof baseUrl === 'string' && baseUrl.startsWith('data:')) {
        return baseUrl;
      }
      return defaultAvatarPlaceholder;
    }
  },
  created() {
    this.userId = this.$route.params.id;
    console.log(`[UserEditPage created] Route parameter id: ${this.userId}`);
    if (this.userId) {
      this.loadUserFromVuex(this.userId);
    } else {
      console.error('[UserEditPage created] Invalid User ID from route.');
      this.$message.error('无效的用户 ID');
      this.loading = false;
      this.userFound = false;
    }
  },
  methods: {
    ...mapMutations(['SET_USERS']),
    loadUserFromVuex(id) {
      this.loading = true;
      this.userFound = false;
      console.log(`[UserEditPage loadUserFromVuex] Attempting to load user ${id} from Vuex store...`);
      const cachedUser = this.getUserById(id);
      setTimeout(() => {
        if (cachedUser) {
          console.log(`[UserEditPage loadUserFromVuex] User ${id} found in Vuex store.`, cachedUser);
          this.populateForm(cachedUser);
          this.userFound = true;
        } else {
          console.warn(`[UserEditPage loadUserFromVuex] User ${id} not found in Vuex store.`);
          this.$message.warning(`在缓存中未找到用户 ${id} 的数据，请确保已从列表页进入。`);
        }
        this.loading = false;
        console.log(`[UserEditPage loadUserFromVuex] Loading finished. User found: ${this.userFound}`);
      }, 100);
    },
    populateForm(userData) {
      // 增加对 userData 结构的检查
      if (!userData || typeof userData !== 'object' || userData.id === undefined) {
        console.error('[UserEditPage populateForm] Invalid userData received:', userData);
        this.$message.error('加载用户信息失败，数据格式错误。');
        this.userFound = false;
        return;
      }
      console.log('[UserEditPage populateForm] Populating form with valid data:', userData);
      this.userForm = {
        id: userData.id,
        userCode: userData.userCode || '',
        username: userData.username || '',
        realName: userData.realName || '',
        email: userData.email || '',
        avatar: userData.avatar || null,
        status: userData.status !== undefined ? userData.status : 0,
        banEndTime: userData.banEndTime || null,
        password: '',
        confirmPassword: '',
      };
      try {
        this.originalUserForm = structuredClone(this.userForm);
      } catch (e) {
        console.warn("structuredClone not supported, falling back to JSON methods for deep copy.");
        this.originalUserForm = JSON.parse(JSON.stringify(this.userForm));
      }
      console.log('[UserEditPage populateForm] Form populated:', this.userForm);
      console.log('[UserEditPage populateForm] Original form data backed up:', this.originalUserForm);
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate();
        }
      });
    },

    // --- 头像上传处理 ---
    async handleHttpRequest(options) {
      const file = options.file;
      console.log('[UserEditPage handleHttpRequest] Starting upload process for file:', file.name);
      this.$message.info('正在处理头像...');
      let uploadUrl = '';
      let fileRecordID = '';
      let finalImageUrl = '';
      try {
        console.log(`[UserEditPage handleHttpRequest] Step 1: Getting pre-signed URL for user ID: ${this.userId}...`);
        const uploadInfoResponse = await getUserAvatarUploadUrl(this.userId);

        // 假设拦截器返回的是 { url, fileRecordID } 或 包含 code 的 Result 对象
        let uploadData = null;
        // *** 修改：优先检查拦截器是否直接返回了 data ***
        if (uploadInfoResponse && uploadInfoResponse.url && uploadInfoResponse.fileRecordID) {
          uploadData = uploadInfoResponse;
        } else if (uploadInfoResponse && uploadInfoResponse.code === 200 && uploadInfoResponse.data) {
          uploadData = uploadInfoResponse.data;
        }

        if (uploadData && uploadData.url && uploadData.fileRecordID) {
          uploadUrl = uploadData.url;
          fileRecordID = uploadData.fileRecordID;
          console.log(`[UserEditPage handleHttpRequest] Got pre-signed URL and fileRecordID: ${fileRecordID}`);
        } else {
          const errorMsg = uploadInfoResponse?.message || '获取上传地址失败，返回数据格式不正确。';
          console.error("获取上传地址失败:", uploadInfoResponse);
          throw new Error(errorMsg);
        }

        console.log(`[UserEditPage handleHttpRequest] Step 2: Uploading file to pre-signed URL...`);
        await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
        console.log('[UserEditPage handleHttpRequest] File uploaded successfully via PUT.');

        console.log(`[UserEditPage handleHttpRequest] Step 3: Getting final image URL with fileRecordID: ${fileRecordID}...`);
        // *** 修改：假设 getFinalImageUrl 返回的是字符串 URL (拦截器处理后) ***
        finalImageUrl = await getFinalImageUrl(fileRecordID);
        console.log('[UserEditPage handleHttpRequest] Got final image URL:', finalImageUrl);

        this.userForm.avatar = finalImageUrl;
        this.$message.success('头像上传成功！请记得点击“保存修改”。');

        this.$nextTick(() => {
          this.$forceUpdate();
          console.log('[UserEditPage handleHttpRequest] $forceUpdate called after avatar update.');
        });

      } catch (error) {
        console.error('[UserEditPage handleHttpRequest] Upload process failed:', error);
        const errorMsg = error?.response?.data?.message || error?.message || '头像处理失败，请重试';
        this.$message.error(errorMsg);
      }
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isPNG = file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG && !isPNG) { this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!'); }
      if (!isLt2M) { this.$message.error('上传头像图片大小不能超过 2MB!'); }
      return (isJPG || isPNG) && isLt2M;
    },

    // --- 表单提交逻辑 (对接后端 PATCH 接口) ---
    submitForm(formName) {
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          this.submitting = true;
          console.log('[UserEditPage submitForm] 表单验证通过，准备提交...');
          const updateDataMap = {};
          const fieldsToCompare = ['username', 'realName', 'email', 'avatar', 'status'];
          fieldsToCompare.forEach(field => {
            const currentValue = this.userForm[field];
            const originalValue = this.originalUserForm[field];
            const currentAvatarIsEmpty = currentValue === null || currentValue === '';
            const originalAvatarIsEmpty = originalValue === null || originalValue === '';
            if (field === 'avatar') {
              if (currentAvatarIsEmpty !== originalAvatarIsEmpty || (!currentAvatarIsEmpty && currentValue !== originalValue)) {
                updateDataMap[field] = currentValue;
              }
            } else if (currentValue !== originalValue) {
              updateDataMap[field] = currentValue;
            }
          });
          if (this.userForm.password) {
            updateDataMap.password = this.userForm.password;
          }
          if (Object.keys(updateDataMap).length === 0) {
            this.$message.info('用户信息未作任何修改。');
            this.submitting = false;
            return;
          }
          console.log('[UserEditPage submitForm] 检测到变化的字段:', updateDataMap);
          try {
            // *** 修改：直接使用 API 函数的返回值 (假设拦截器处理了 Result) ***
            const apiResponse = await updateAdminUserProfile(this.userId, updateDataMap);

            console.log('[UserEditPage submitForm] API success response:', apiResponse);

            // *** 修改：从 apiResponse 中提取实际的用户数据 ***
            // 检查 apiResponse 是否是有效的用户对象 (包含 id)
            // 假设拦截器已经处理了 Result, 直接返回了 data 部分 (UserProfileDTO)
            let updatedUserData = null;
            if (apiResponse && apiResponse.id) {
              updatedUserData = apiResponse; // 直接使用
            }
            // 如果拦截器没有处理 Result, 需要从 data 字段取
            else if (apiResponse && apiResponse.code === 200 && apiResponse.data && apiResponse.data.id) {
              updatedUserData = apiResponse.data;
              console.log('[UserEditPage submitForm] Extracted user data from response.data');
            }


            if (updatedUserData && updatedUserData.id) {
              this.$message.success('用户信息更新成功！');
              // 使用有效的用户对象更新表单和 Vuex
              this.populateForm(updatedUserData);
              this.SET_USERS([updatedUserData]); // 更新 Vuex store
              console.log('[UserEditPage submitForm] Form and Vuex updated successfully.');
            } else {
              // 如果无法从响应中解析出有效的用户数据
              console.error('[UserEditPage submitForm] Update successful, but could not parse valid user profile DTO from API response:', apiResponse);
              this.$message.error('更新成功，但解析最新数据失败，请稍后手动刷新。');
              // 可以选择尝试重新从 Vuex 加载，或者不更新本地状态
              // this.loadUserFromVuex(this.userId);
            }

          } catch (error) {
            console.error('[UserEditPage submitForm] Update request failed:', error);
            const errorMsg = error?.response?.data?.message || error?.message || '更新用户信息失败，请重试。';
            this.$message.error(errorMsg);
          } finally {
            this.submitting = false;
          }
        } else {
          console.log('[UserEditPage submitForm] 表单验证失败!');
          this.$message.error('请检查表单填写是否正确');
          return false;
        }
      });
    },

    // --- 表单重置逻辑 ---
    resetForm() {
      if (this.originalUserForm && this.originalUserForm.id) {
        console.log('[UserEditPage resetForm] Resetting form to:', this.originalUserForm);
        this.populateForm(this.originalUserForm); // 调用 populateForm 来重置
        this.$nextTick(() => { if (this.$refs.userForm) { this.$refs.userForm.clearValidate(); } });
        this.$message.info('表单已重置为加载时的状态');
      } else {
        console.warn('[UserEditPage resetForm] Cannot reset, originalUserForm is invalid.');
        this.$message.warning('无法重置表单，缺少原始数据。');
      }
    },

    // --- 返回列表页 ---
    goBack() {
      this.$router.push('/admin/users');
    },

    // --- 辅助格式化方法 ---
    formatStatus(status) {
      const statusOption = this.statusOptions.find(opt => opt.value === status);
      return statusOption ? statusOption.label : '未知状态';
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
        let date = new Date(dateTimeString);
        if (dateTimeString.includes('T') && dateTimeString.includes('Z')) { /* ... */ }
        else { const fallbackDate = new Date(dateTimeString.replace(' ', 'T')); if (!isNaN(fallbackDate.getTime())) { date = fallbackDate; } }
        if (isNaN(date.getTime())) { console.warn("无法解析日期:", dateTimeString); return dateTimeString; }
        return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
      } catch (e) { console.error("格式化日期时出错:", dateTimeString, e); return dateTimeString; }
    }
  }
}
</script>

<style scoped>
/* 样式部分保持不变 */
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
