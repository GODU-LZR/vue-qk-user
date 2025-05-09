<template>
  <el-card class="profile-edit-form" shadow="never">
    <div class="card-header">
      <div class="header-title">
        <i class="el-icon-edit profile-icon"></i>
        <h2>修改信息</h2>
      </div>
    </div>

    <div v-if="isLoading" class="loading-section">
      <i class="el-icon-loading"></i> 页面加载中...
    </div>

    <el-alert
        v-else-if="error"
        title="页面加载失败"
        type="error"
        :description="error"
        show-icon
        :closable="false"
        class="error-section"
    />
    <div v-else>
      <div class="avatar-section">
        <div class="avatar-preview-container">
          <div class="avatar-preview">
            <el-avatar
                :key="currentAvatarUrl"
                :size="160"
                :src="currentAvatarUrl"
                shape="circle"
                fit="cover"
                class="preview-avatar"
            ></el-avatar>
            <div class="avatar-tip" v-if="isEditMode && newAvatarFileId">
              <i class="el-icon-success"></i> 新头像已上传，请保存
            </div>
          </div>
          <avatar-uploader
              v-if="form.id"
              :user-id="String(form.id)"
              :initial-image-url="form.avatar"
              :disabled="!isEditMode"
              :size-limit="2"
              upload-hint="点击上传新头像 (支持PNG/JPG，小于2MB)"
              @avatar-updated="handleAvatarUpdate"
              @upload-error="handleUploadError"
              class="avatar-uploader"
          />
          <div v-else class="avatar-uploader-placeholder">用户信息加载中...</div>
        </div>
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
              placeholder="请输入邮箱"
              prefix-icon="el-icon-message"
              style="width: 60%; margin-right: 10px"
          />
          <el-button
              v-if="emailNeedsVerification"
              @click="handleSendCode"
              type="primary" plain
              :loading="isSendingCode"
              :disabled="isSendCodeButtonDisabled"
          >
            {{ sendCodeButtonText }}
          </el-button>
        </el-form-item>
        <el-form-item label="验证码" prop="emailCode" v-if="emailNeedsVerification">
          <el-input v-model="form.emailCode" placeholder="请输入邮箱验证码" prefix-icon="el-icon-key" :disabled="!isEditMode"/>
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" :disabled="!isEditMode" prefix-icon="el-icon-s-custom" />
        </el-form-item>
        <el-form-item label="原密码" prop="oldPassword" v-if="isEditMode && form.password">
          <el-input v-model="form.oldPassword" type="password" placeholder="修改密码需填写原密码" show-password prefix-icon="el-icon-lock" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="form.password" :disabled="!isEditMode" type="password" placeholder="留空表示不修改密码" show-password prefix-icon="el-icon-lock" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" v-if="isEditMode" :loading="isSubmitting">
            {{ isSubmitting ? '保存中...' : '保存修改' }}
          </el-button>
          <el-button @click="handleReset" v-if="isEditMode">重置</el-button>
          <el-button type="text" icon="el-icon-edit" v-if="!isEditMode" @click="toggleEditMode(true)">修改信息</el-button>
          <el-button type="text" v-if="isEditMode" @click="toggleEditMode(false)">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script>
// --- API 函数导入 ---
import { getCurrentUserProfile, updateUserProfile } from '@/api/user/index.js';
import { sendVerificationCode } from '@/api/notification/index.js';
import { getFinalImageUrl } from '@/api/upload-file/index.js';

// --- 组件导入 ---
import AvatarUploader from '@/components/common/AvatarUploader.vue';

export default {
  name: 'ProfileEditForm',
  components: {
    AvatarUploader
  },
  data() {
    // data 部分保持不变
    return {
      isLoading: true,
      error: null,
      isEditMode: false,
      isSubmitting: false,
      isSendingCode: false,
      form: {
        id: null,
        userCode: '',
        username: '',
        email: '',
        realName: '',
        oldPassword: '',
        password: '',
        emailCode: '',
        avatar: '' // 保存当前头像 URL
      },
      originalEmail: '',
      newAvatarFileId: null, // 记录新上传头像的 ID，提交时使用
      defaultAvatar: 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png',
      // 表单验证规则
      rules: {
        username: [ { required: true, message: '请输入用户名', trigger: 'blur' } ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
        ],
        emailCode: [
          { validator: (rule, value, callback) => {
              if (this.emailNeedsVerification && !value) {
                callback(new Error('修改邮箱需要输入验证码'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        realName: [ { required: true, message: '请输入真实姓名', trigger: 'blur' } ],
        oldPassword: [
          { validator: (rule, value, callback) => {
              if (this.form.password && !value) {
                callback(new Error('修改密码需填写原密码'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ],
        password: [
          { validator: (rule, value, callback) => {
              // 允许密码为空（不修改）
              if (value && value.length < 5) {
                callback(new Error('新密码长度不能少于5位'));
              } else {
                callback();
              }
            }, trigger: 'blur' }
        ]
      },
      // 邮箱验证码倒计时
      codeCooldownSeconds: 0,
      codeTimer: null
    };
  },
  // --- 已包含缓存破坏逻辑的 currentAvatarUrl ---
  computed: {
    currentAvatarUrl() {
      const baseUrl = this.form.avatar || this.defaultAvatar;
      // 如果 baseUrl 是有效的（不是默认头像或空字符串，且不是 blob URL）
      if (baseUrl && baseUrl !== this.defaultAvatar && !baseUrl.startsWith('blob:')) {
        try {
          // 尝试为有效的 http/https URL 添加时间戳作为缓存破坏参数
          const url = new URL(baseUrl);
          url.searchParams.set('_t', Date.now()); // 添加时间戳参数 _t=当前毫秒数
          const finalUrl = url.toString();
          console.log("计算属性 currentAvatarUrl (带缓存破坏):", finalUrl);
          return finalUrl;
        } catch (e) {
          // 如果 baseUrl 不是有效的 URL (例如 'blob:' 或其他格式)，直接返回
          console.warn("无法为头像 URL 添加缓存破坏参数，URL 格式无效:", baseUrl, e);
          console.log("计算属性 currentAvatarUrl (原始):", baseUrl);
          return baseUrl;
        }
      } else {
        // 如果是默认头像、空字符串或 blob URL，直接返回
        console.log("计算属性 currentAvatarUrl (原始/默认/blob):", baseUrl);
        return baseUrl;
      }
    },
    emailNeedsVerification() {
      return this.isEditMode && this.form.email !== this.originalEmail;
    },
    emailDisabled() {
      return !this.isEditMode;
    },
    sendCodeButtonText() {
      if (this.isSendingCode) {
        return '发送中...';
      }
      if (this.codeCooldownSeconds > 0) {
        return `${this.codeCooldownSeconds}秒后重发`;
      }
      return '发送验证码';
    },
    isSendCodeButtonDisabled() {
      return this.isSendingCode || this.codeCooldownSeconds > 0 || !this.isEditMode;
    }
  },
  methods: {
    // fetchInitialData, toggleEditMode, handleAvatarUpdate, handleUploadError, handleSendCode 保持不变
    async fetchInitialData() {
      this.isLoading = true;
      this.error = null;
      this.newAvatarFileId = null; // 重置新头像 ID
      // 清理可能存在的定时器
      if (this.codeTimer) {
        clearInterval(this.codeTimer);
        this.codeTimer = null;
      }
      this.codeCooldownSeconds = 0;
      try {
        const response = await getCurrentUserProfile();
        if (response && response.code === 200 && response.data) {
          // 使用获取的数据更新表单，确保 avatar 字段也被初始化
          this.form = { ...this.form, ...response.data, avatar: response.data.avatar || '' };
          this.originalEmail = response.data.email || ''; // 保存原始邮箱用于比较
          console.log("ProfileEditForm: 初始用户数据已加载:", JSON.parse(JSON.stringify(this.form)));
        } else {
          throw new Error(response?.message || '获取用户数据格式不正确');
        }
      } catch (err) {
        console.error('获取用户信息失败:', err);
        this.error = err.message || '加载用户信息失败';
      } finally {
        this.isLoading = false;
      }
    },
    toggleEditMode(mode) {
      this.isEditMode = mode;
      if (!mode) {
        // 取消编辑时，重新加载初始数据以撤销更改
        this.fetchInitialData().then(() => {
          // 清除可能的表单验证错误提示
          if (this.$refs.formRef) this.$refs.formRef.clearValidate();
        });
      } else {
        // 进入编辑模式时，清空密码和验证码字段
        this.form.oldPassword = '';
        this.form.password = '';
        this.form.emailCode = '';
        this.newAvatarFileId = null; // 如果之前有上传但未保存，进入编辑模式时也应重置
      }
    },
    handleAvatarUpdate(payload) {
      console.log('头像上传组件 @avatar-updated 事件:', payload);
      if (payload && payload.imageId && payload.imageUrl) {
        this.newAvatarFileId = payload.imageId; // 记录新头像 ID
        // 重要：立即用上传组件返回的（可能是临时的）URL 更新表单中的 avatar，以提供预览
        this.form.avatar = payload.imageUrl;
        console.log("handleAvatarUpdate: 已使用预览 URL 更新 this.form.avatar:", this.form.avatar);
        this.$message.success('头像上传成功！请点击“保存修改”以应用。');
      } else {
        this.$message.error('头像上传数据无效，请重试');
        this.newAvatarFileId = null;
      }
    },
    handleUploadError(error) {
      console.error('头像上传组件 @upload-error 事件:', error);
      this.$message.error(`头像上传失败: ${error.message || '请重试'}`);
      this.newAvatarFileId = null; // 上传失败，清除待提交的新头像 ID
    },
    async handleSendCode() {
      // 防止重复点击
      if (this.isSendingCode || this.codeCooldownSeconds > 0) {
        return;
      }
      // 先校验邮箱格式是否正确
      this.$refs.formRef.validateField('email', async (errorMessage) => {
        if (!errorMessage) {
          console.log("邮箱校验通过，准备发送验证码...");
          this.isSendingCode = true;
          try {
            const result = await sendVerificationCode(this.form.email);
            if (result && result.success) {
              this.$message.success(result.message || `验证码已发送至 ${this.form.email}`);
              // 启动倒计时
              this.codeCooldownSeconds = 120;
              if (this.codeTimer) { clearInterval(this.codeTimer); } // 清理旧定时器
              this.codeTimer = setInterval(() => {
                if (this.codeCooldownSeconds > 0) {
                  this.codeCooldownSeconds--;
                } else {
                  clearInterval(this.codeTimer);
                  this.codeTimer = null;
                }
              }, 1000);
            } else {
              throw new Error(result?.message || '发送验证码请求失败');
            }
          } catch (error) {
            console.error("发送验证码操作失败:", error);
            this.$message.error(`发送失败: ${error.message || '请重试'}`);
          } finally {
            this.isSendingCode = false; // 无论成功失败，结束发送状态
          }
        } else {
          console.log("邮箱校验失败:", errorMessage);
          return false; // 阻止继续执行
        }
      });
    },

    // handleSubmit 逻辑根据日志确认是正确的，无需修改
    async handleSubmit() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) {
          console.log("表单校验未通过，无法提交");
          return false; // 校验失败，中断提交
        }

        this.isSubmitting = true; // 开始提交状态
        // 初始假设 finalAvatarUrl 为当前表单中的值（可能是旧的或预览 URL）
        let finalAvatarUrl = this.form.avatar;

        try {
          // 步骤 1: 如果记录了 newAvatarFileId，说明上传了新头像，需要获取其最终 URL
          if (this.newAvatarFileId) {
            try {
              console.log(`[handleSubmit] 存在新头像 ID (${this.newAvatarFileId})，正在获取最终 URL...`);
              const urlResponse = await getFinalImageUrl(this.newAvatarFileId);
              if (typeof urlResponse === 'string' && urlResponse.length > 0) {
                finalAvatarUrl = urlResponse; // 获取成功，更新 finalAvatarUrl
                console.log("[handleSubmit] 成功获取最终头像 URL:", finalAvatarUrl);
              } else {
                // API 返回格式不对或空字符串
                throw new Error(typeof urlResponse === 'object' && urlResponse !== null ? urlResponse.message : '获取头像最终链接失败，返回无效');
              }
            } catch (getUrlError) {
              console.error("获取最终头像 URL 时出错:", getUrlError);
              this.$message.error(`头像处理失败: ${getUrlError.message || '请重试'}`);
              this.isSubmitting = false; // 出错，停止提交
              return; // 中断执行
            }
          } else {
            // 没有上传新头像，沿用 form.avatar 中当前的 URL
            console.log("[handleSubmit] 未上传新头像 (newAvatarFileId 为 null)，将使用当前头像 URL:", finalAvatarUrl);
          }

          // 步骤 2: 准备要提交给后端的数据
          const profileData = {
            username: this.form.username,
            realName: this.form.realName,
            email: this.form.email,
            avatar: finalAvatarUrl, // 使用确定下来的 finalAvatarUrl
            // 仅在填写了新密码时才包含密码字段
            ...(this.form.password && { oldPassword: this.form.oldPassword, password: this.form.password }),
            // 仅在需要验证邮箱时才包含验证码字段
            ...(this.emailNeedsVerification && { emailCode: this.form.emailCode }),
          };

          // 清理不需要提交的空字段
          if (!profileData.password) {
            delete profileData.oldPassword;
            delete profileData.password;
          }
          if (!profileData.emailCode) {
            delete profileData.emailCode;
          }
          // 如果最终头像 URL 为空或 null，也不提交 avatar 字段（取决于后端要求）
          if (!profileData.avatar) {
            delete profileData.avatar;
          }

          console.log("[handleSubmit] 准备提交给后端的数据 profileData:", JSON.stringify(profileData));

          // 步骤 3: 调用后端 API 更新用户信息
          const updateResponse = await updateUserProfile(profileData);
          console.log("[handleSubmit] 收到后端 updateUserProfile 响应:", updateResponse);

          // 步骤 4: 处理后端响应
          if (updateResponse && updateResponse.code === 200 && updateResponse.data) {
            // 更新成功
            const updatedProfileDTO = updateResponse.data; // 后端返回的最新用户信息 DTO
            // --- 关键日志：检查后端返回的 DTO ---
            console.log("[handleSubmit] 后端成功响应，返回的 DTO (updatedProfileDTO):", JSON.stringify(updatedProfileDTO));
            console.log("[handleSubmit] DTO 中的 avatar 字段值:", updatedProfileDTO.avatar);

            // 合并最新信息：从 localStorage 获取当前信息作为基础，然后用 DTO 覆盖
            let currentUserInfo = null;
            try {
              const storedUserInfo = localStorage.getItem('userInfo');
              if (storedUserInfo) {
                currentUserInfo = JSON.parse(storedUserInfo);
              }
            } catch (e) {
              console.error("[handleSubmit] 解析 localStorage userInfo 出错:", e);
              // 出错也继续，但可能丢失部分本地信息
            }
            if (!currentUserInfo) {
              console.warn("[handleSubmit] 未能从 localStorage 读取当前用户信息，将仅使用 DTO 进行更新。");
              currentUserInfo = {}; // 使用空对象作为基础
            }

            // 执行合并，updatedProfileDTO 的字段会覆盖 currentUserInfo 中的同名字段
            const mergedUserInfo = {
              ...currentUserInfo,
              ...updatedProfileDTO
            };
            // --- 关键日志：检查合并后的结果 ---
            console.log("[handleSubmit] 合并后的 UserInfo (mergedUserInfo):", JSON.stringify(mergedUserInfo));
            console.log("[handleSubmit] 合并后的 avatar 字段值:", mergedUserInfo.avatar);


            // --- 核心步骤：用合并后的最新信息更新组件的 form 状态 ---
            console.log("[handleSubmit] 更新 this.form 之前, this.form.avatar =", this.form.avatar);
            this.form = { ...this.form, ...mergedUserInfo }; // 替换整个 form 对象以确保响应性

            // --- 使用 $nextTick 确认 DOM 更新后的状态 ---
            this.$nextTick(() => {
              console.log("[handleSubmit] 更新 this.form 之后 (nextTick), this.form.avatar =", this.form.avatar);
              console.log("[handleSubmit] 更新 this.form 之后 (nextTick), currentAvatarUrl =", this.currentAvatarUrl);
              // 此时可以通过 Vue DevTools 再次确认组件状态
            });


            // 更新辅助状态
            this.originalEmail = mergedUserInfo.email; // 更新原始邮箱记录
            this.form.oldPassword = ''; // 清空密码字段
            this.form.password = '';
            this.form.emailCode = '';
            this.newAvatarFileId = null; // 已成功提交，清除新头像 ID
            this.isEditMode = false; // 退出编辑模式
            if (this.codeTimer) { // 清除邮箱验证码定时器
              clearInterval(this.codeTimer);
              this.codeTimer = null;
              this.codeCooldownSeconds = 0;
            }

            // --- 同步更新 localStorage 和全局状态 (如果使用了 $setGlobalState) ---
            try {
              localStorage.setItem('userInfo', JSON.stringify(mergedUserInfo));
              console.log('[handleSubmit] 已更新 localStorage 中的 userInfo (使用合并后的信息)');

              // 假设 $setGlobalState 是用于全局状态管理的方法 (例如 Vuex action 或 Pinia action 的封装)
              if (typeof this.$setGlobalState === 'function') {
                this.$setGlobalState({ userInfo: mergedUserInfo }); // 传递合并后的完整对象
                console.log('[handleSubmit] 已调用 $setGlobalState 更新全局 userInfo (使用合并后的信息)');
              } else {
                // console.warn('[handleSubmit] $setGlobalState 函数不可用，跳过全局状态更新。');
              }
            } catch (e) {
              console.error('[handleSubmit] 更新 localStorage 或调用 $setGlobalState 时出错:', e);
              this.$message.error('同步本地或全局用户信息时出错');
            }

            this.$message.success('用户信息更新成功！'); // 提示用户操作成功

          } else {
            // 后端返回非成功状态码或 data 为空
            console.error("更新用户信息失败: 后端响应错误", updateResponse);
            this.$message.warning(updateResponse?.message || '信息保存失败，请检查输入或稍后重试。');
          }

        } catch (error) {
          // 请求过程中的网络错误或其他异常
          console.error('保存用户信息过程中发生异常:', error);
          this.$message.error(`保存操作异常: ${error.message || '请联系管理员或稍后重试'}`);
        } finally {
          this.isSubmitting = false; // 结束提交状态
        }
      });
    },

    // handleReset 和生命周期钩子 (created, beforeDestroy) 保持不变
    handleReset() {
      this.fetchInitialData().then(() => {
        this.$message.info('表单已重置为初始状态');
        if (this.$refs.formRef) {
          this.$refs.formRef.clearValidate(); // 清除校验状态
        }
        // 确保密码和验证码字段也被清空（虽然 fetchInitialData 理论上会覆盖，但显式清空更保险）
        this.form.oldPassword = '';
        this.form.password = '';
        this.form.emailCode = '';
        this.newAvatarFileId = null; // 重置时也清除未保存的新头像 ID
      });
    },
  },
  created() {
    this.fetchInitialData();
  },
  beforeDestroy() {
    if (this.codeTimer) {
      console.log("组件销毁，清除邮箱验证码定时器。");
      clearInterval(this.codeTimer);
      this.codeTimer = null;
    }
  }
};
</script>

<style scoped>
/* ... 样式保持不变 ... */
.profile-edit-form {
  max-width: 700px;
  margin: 30px auto;
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 20px; /* 调整间距 */
  border-bottom: 1px solid #ebeef5; /* 添加分隔线 */
  margin-bottom: 30px; /* 调整间距 */
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #303133; /* 调整颜色 */
}

.profile-icon {
  font-size: 24px; /* 调整大小 */
  margin-right: 10px;
  color: #409EFF;
}

.avatar-section {
  margin: 0 auto 40px auto; /* 居中并调整底部边距 */
  display: flex;
  justify-content: center;
}

.avatar-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px; /* 调整头像和上传控件的间距 */
  width: 100%;
  max-width: 300px; /* 调整最大宽度 */
}

.loading-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
  color: #606266;
  font-size: 16px;
  text-align: center;
}

.loading-section i {
  font-size: 32px;
  margin-bottom: 15px;
  color: #409EFF;
  animation: rotating 2s linear infinite; /* 添加旋转动画 */
}

/* 定义旋转动画 (如果需要) */
@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}


.avatar-preview {
  position: relative;
  width: 160px; /* 调整大小 */
  height: 160px; /* 调整大小 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 调整阴影 */
  border: 3px solid #fff; /* 添加白色边框 */
  background-color: #f5f7fa;
  object-fit: cover; /* 确保图片覆盖 */
}

.avatar-tip {
  position: absolute;
  bottom: 0px; /* 调整位置 */
  /* left: 50%; */
  /* transform: translateX(-50%); */
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: #fff; /* 白色文字 */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  padding: 4px 8px; /* 调整内边距 */
  border-radius: 0 0 80px 80px; /* 调整圆角以匹配头像底部 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.avatar-tip i {
  font-size: 14px;
  color: #67c23a; /* 绿色图标 */
}


.avatar-uploader {
  width: 100%;
}

/* 针对 Element UI 上传组件的样式微调 */
::v-deep .avatar-uploader .el-upload {
  width: 100%;
}

::v-deep .avatar-uploader .el-upload-dragger {
  width: 100%;
  /* height: 120px; */ /* 移除固定高度，让其自适应 */
  padding: 20px; /* 调整内边距 */
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9; /* 使用虚线边框 */
  border-radius: 6px; /* 调整圆角 */
  transition: border-color 0.3s;
}

::v-deep .avatar-uploader .el-upload-dragger .el-icon-upload {
  font-size: 36px; /* 调整图标大小 */
  margin-bottom: 8px; /* 调整间距 */
  color: #C0C4CC; /* 调整颜色 */
}

::v-deep .avatar-uploader .el-upload-dragger .el-upload__text {
  font-size: 14px; /* 调整文字大小 */
  color: #606266;
  line-height: 1.4; /* 调整行高 */
}
::v-deep .avatar-uploader .el-upload-dragger .el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}


::v-deep .avatar-uploader .el-upload-dragger:hover {
  border-color: #409EFF; /* Hover 时边框高亮 */
}
::v-deep .avatar-uploader .el-upload-dragger:hover .el-icon-upload,
::v-deep .avatar-uploader .el-upload-dragger:hover .el-upload__text {
  color: #409EFF; /* Hover 时图标和文字高亮 */
}


.error-section {
  margin-bottom: 20px;
}
.avatar-uploader-placeholder {
  color: #909399;
  font-size: 14px;
  text-align: center;
  padding: 40px 0;
}

/* 调整表单项间距 */
.el-form-item {
  margin-bottom: 22px;
}
/* 调整按钮组间距 */
.el-form-item:last-child {
  margin-top: 30px;
  margin-bottom: 0;
}

</style>