<template>
  <el-card class="delete-page" shadow="never">
    <div class="header">
      <i class="el-icon-warning-outline warning-icon" />
      <h2>注销账号</h2>
    </div>
    <p class="tip-text">
      您正在申请注销账号 <strong v-if="form.email" style="color: #e6a23c;">{{ form.email }}</strong>。
      注销后，您的账户信息、角色权限及相关数据将被<strong style="color:#f56c6c">永久标记为删除</strong>，且可能无法恢复。请您务必谨慎操作！
    </p>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" label-position="left">
      <el-form-item label="注册邮箱" prop="email">
        <el-input v-model="form.email" placeholder="用户邮箱" prefix-icon="el-icon-message" style="width: 60%; margin-right: 10px;" readonly />
        <el-button
            @click="handleSendCode"
            type="primary"
            plain
            :disabled="isSendingCode || codeCooldownSeconds > 0 || !form.email"
            :loading="isSendingCode"
        >
          {{ sendCodeButtonText }}
        </el-button>
      </el-form-item>

      <el-form-item label="验证码" prop="emailCode">
        <el-input v-model.trim="form.emailCode" type="text" placeholder="请输入邮箱验证码" prefix-icon="el-icon-key" />
      </el-form-item>

      <el-form-item label="当前密码" prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码以验证身份" show-password prefix-icon="el-icon-lock" />
      </el-form-item>

      <el-form-item>
        <el-button
            type="danger"
            icon="el-icon-delete"
            @click="handleDelete"
            :loading="isDeactivating"
            :disabled="isDeactivating || isSendingCode"
        >
          确认注销
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
// 1. 导入所需的 API 函数 (确保路径相对于当前文件是正确的)
import '@/api/notification/index.js';
import '@/api/user/index.js';
import {deactivateCurrentUserAccount, getCurrentUserProfile} from "@/api/user";
import {sendVerificationCode} from "@/api/notification";

// 注意：我们不再需要直接导入 qiankun actions，将使用 this.$setGlobalState

export default {
  name: 'ProfileDeletePage',
  data() {
    return {
      form: {
        email: '', // 初始化为空，在 created 钩子中获取
        emailCode: '',
        password: ''
      },
      rules: {
        email: [
          { required: true, message: '用户邮箱信息缺失', trigger: 'change' }, // 因为是只读，触发器改为 change
          { type: 'email', message: '邮箱格式不正确', trigger: 'change' }
        ],
        emailCode: [
          { required: true, message: '请输入邮箱验证码', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ]
      },
      isSendingCode: false,     // 标记是否正在发送验证码
      isDeactivating: false,    // 标记是否正在执行注销
      codeCooldownSeconds: 0, // 验证码冷却倒计时秒数
      codeTimer: null         // 验证码倒计时定时器 ID
    };
  },
  computed: {
    // 计算发送验证码按钮的文本
    sendCodeButtonText() {
      if (this.isSendingCode) {
        return '发送中...';
      }
      if (this.codeCooldownSeconds > 0) {
        return `${this.codeCooldownSeconds} 秒后重发`;
      }
      return '发送验证码';
    }
  },
  methods: {
    // 获取当前用户的邮箱并填充表单
    async fetchCurrentUserEmail() {
      console.log('[ProfileDeletePage] 获取当前用户邮箱...');
      try {
        // 调用获取用户信息的 API
        const userProfile = await getCurrentUserProfile(); // 假设此 API 返回包含 email 的对象
        if (userProfile && userProfile.data.email) {
          this.form.email = userProfile.data.email;
          console.log('[ProfileDeletePage] 成功获取邮箱:', this.form.email);
        } else {
          console.error('[ProfileDeletePage] 获取用户信息成功，但缺少 email 字段:', userProfile);
          this.$message.error('无法获取您的邮箱信息，请稍后重试');
        }
      } catch (error) {
        console.error('[ProfileDeletePage] 获取用户信息失败:', error);
        this.$message.error(error.message || '获取用户信息失败');
      }
    },

    // 发送邮箱验证码
    async handleSendCode() {
      // 简单校验邮箱是否存在
      if (!this.form.email) {
        this.$message.warning('请先确保邮箱地址已加载');
        return;
      }
      // 如果正在发送或处于冷却中，则不执行
      if (this.isSendingCode || this.codeCooldownSeconds > 0) return;

      this.isSendingCode = true;
      try {
        // --- 调用发送验证码的 API 函数 ---
        // 注意：你提供的 sendVerificationCode 函数返回 {success: boolean, message?: string}
        const result = await sendVerificationCode(this.form.email);

        if (result.success) {
          this.$message.success(result.message || `验证码已发送至 ${this.form.email}`);
          // 启动倒计时
          this.codeCooldownSeconds = 120; // 设置 60 秒冷却
          if (this.codeTimer) clearInterval(this.codeTimer); // 清理可能存在的旧定时器
          this.codeTimer = setInterval(() => {
            if (this.codeCooldownSeconds > 0) {
              this.codeCooldownSeconds--;
            } else {
              clearInterval(this.codeTimer);
              this.codeTimer = null;
            }
          }, 1000);
        } else {
          // 如果 API 调用本身没抛错，但返回了 success: false
          this.$message.error(result.message || '发送验证码失败');
        }
      } catch (error) {
        // API 调用抛出错误 (通常由 Axios 拦截器处理后抛出)
        console.error('[ProfileDeletePage] 发送验证码 API 调用失败:', error);
        this.$message.error(error.message || '发送验证码时遇到问题，请重试');
      } finally {
        this.isSendingCode = false;
      }
    },

    // 处理确认注销按钮点击
    handleDelete() {
      this.$refs.formRef.validate(valid => {
        if (!valid) {
          console.log('[ProfileDeletePage] 表单校验未通过');
          return false; // 阻止提交
        }

        // 再次确认
        this.$confirm(
            `您确定要永久注销账号 ${this.form.email} 吗？此操作一旦确认将无法撤销！`,
            '极其重要确认',
            {
              confirmButtonText: '我已了解风险，确认注销',
              cancelButtonText: '我再想想',
              type: 'warning',
              center: true,
              dangerouslyUseHTMLString: true, // 如果需要在消息中使用 HTML
              confirmButtonClass: 'el-button--danger'
            }).then(async () => { // 确认注销，使用 async
          console.log('[ProfileDeletePage] 用户确认注销，开始执行...');
          this.isDeactivating = true;
          try {
            // --- 调用后端注销接口 ---
            const deleteResponse = await deactivateCurrentUserAccount({
              emailCode: this.form.emailCode,
              password: this.form.password
            });

            const success = deleteResponse.data;

            // 假设 API 成功时 resolve true (由拦截器处理)
            if (success === true) {
              this.$message.success('账户已成功注销！即将退出登录...');
              console.log('[ProfileDeletePage] 后端注销成功，准备调用 $setGlobalState 触发基座登出流程');

              // --- 关键：调用 setGlobalState 通知基座执行登出 ---
              // 检查 $setGlobalState 是否存在（在 main.js 中挂载的）
              if (typeof this.$setGlobalState === 'function') {
                // 设置登出状态，基座的 onGlobalStateChange 和路由守卫会处理后续
                this.$setGlobalState({
                  isLoggedIn: false,
                  token: null,
                  userInfo: null,
                  // 可以添加一个 logoutReason 状态，如果基座需要区分是主动登出还是注销登出
                  // logoutReason: 'DEACTIVATED'
                });
                console.log('[ProfileDeletePage] 已调用 $setGlobalState 通知基座登出');
                // 注销成功后，通常不需要前端再做路由跳转或清理 localStorage，
                // 这些应由基座监听到状态变化后统一处理，以确保一致性。
                // 基座的路由守卫会负责将用户导航到登录页。
                const mainAppBaseUrl = process.env.VUE_APP_MAIN_APP_BASE_URL || 'http://localhost:3000';
                // 如果未登录或缺少 token，重定向到主应用的登录页
                const loginUrl = `${mainAppBaseUrl}/login`;
                console.warn(`[子应用路由守卫] 用户未登录或 Token 无效，即将重定向到主应用登录页: ${loginUrl}`);
                // 使用 window.location.replace 跳转到外部地址，不会留下历史记录
                window.location.replace(loginUrl);

              } else {
                console.error('[ProfileDeletePage] 无法调用 this.$setGlobalState！请检查 Qiankun props 是否正确传递并挂载。');
                // 降级处理：尝试直接清理本地存储并跳转（但可能与基座状态不一致）
                localStorage.removeItem('auth_token');
                localStorage.removeItem('userInfo');
                this.$message.warning('全局状态通信异常，已在本地登出，请手动刷新页面或重新访问。');
                // window.location.href = '/login'; // 不推荐，最好是基座处理
              }
              // 清空敏感信息
              this.form.password = '';
              this.form.emailCode = '';

            } else {
              // 后端接口返回成功，但结果不是 true (理论上不应发生，除非拦截器处理有误)
              console.error('[ProfileDeletePage] 注销请求成功但返回值不是 true:', success);
              this.$message.error('注销操作返回异常，请联系管理员');
            }

          } catch (error) {
            // API 调用失败 (例如密码错误、验证码错误等)
            console.error('[ProfileDeletePage] 调用注销 API 失败:', error);
            this.$message.error(error.message || '注销失败，请检查密码或验证码');
          } finally {
            this.isDeactivating = false;
          }
        }).catch(() => {
          // 用户点击了取消按钮
          this.$message.info('已取消注销操作');
        });
      });
    },

    // 清理定时器
    clearCodeTimer() {
      if (this.codeTimer) {
        clearInterval(this.codeTimer);
        this.codeTimer = null;
        console.log('[ProfileDeletePage] 清理验证码定时器');
      }
    }
  },
  // 组件创建时获取用户邮箱
  created() {
    this.fetchCurrentUserEmail();
  },
  // 组件销毁前清理定时器
  beforeDestroy() {
    this.clearCodeTimer();
  }
};
</script>

<style scoped>
.delete-page {
  max-width: 600px;
  margin: 40px auto;
  padding: 30px 40px; /* 增加左右内边距 */
  background-color: #fff;
  border-radius: 8px; /* 轻微调整圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 轻微调整阴影 */
}

.header {
  display: flex;
  justify-content: center; /* 居中对齐 */
  align-items: center;     /* 垂直居中 */
  margin-bottom: 25px;   /* 增加间距 */
  padding-bottom: 15px;  /* 增加底部内边距 */
  border-bottom: 1px solid #eee; /* 添加更柔和的分隔线 */
}

.warning-icon {
  font-size: 28px; /* 增大图标 */
  color: #f56c6c;
  margin-right: 12px; /* 增加图标与文字间距 */
}
.header h2 {
  margin: 0; /* 移除默认的 h2 margin */
  font-size: 20px; /* 调整标题大小 */
  color: #303133;
}

.tip-text {
  margin-bottom: 35px; /* 增加与表单的间距 */
  color: #555; /* 调整文字颜色 */
  font-size: 14px;
  line-height: 1.7; /* 增加行高，提高可读性 */
  text-align: center; /* 文本居中 */
  padding: 10px 15px; /* 添加内边距 */
  background-color: #fef0f0; /* 淡红色背景 */
  border: 1px solid #fde2e2; /* 红色边框 */
  border-radius: 4px; /* 添加圆角 */
}

/* 表单项样式调整 */
.el-form-item {
  margin-bottom: 25px; /* 增加表单项间距 */
}

/* 按钮样式调整 */
.el-form-item:last-child {
  margin-top: 35px; /* 增加与上方表单项的间距 */
  text-align: center; /* 按钮居中 */
}
.el-form-item:last-child .el-button {
  padding: 12px 30px; /* 增大按钮尺寸 */
}
</style>