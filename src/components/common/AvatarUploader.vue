<template>
  <div class="custom-avatar-uploader">
    <el-button
        type="primary"
        icon="el-icon-camera-solid"
        circle
        size="small"
        class="upload-trigger"
        title="更换头像"
        @click="triggerUpload"
        :disabled="disabled || loading"
        :loading="loading"
    >
    </el-button>

    <input
        ref="fileInput"
        type="file"
        :accept="acceptTypes"
        style="display: none"
        @change="handleFileChange"
    />

    <div v-if="errorMessage" class="upload-error-message">
      <el-tooltip :content="errorMessage" placement="top">
        <i class="el-icon-warning" style="color: red;"></i>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
// --- 使用您指定的路径导入 API 函数 ---
import { getUploadUrl } from '@/api/upload-file/index.js'; // <-- 已更新路径

export default {
  name: 'AvatarUploader',
  // --- 无需注册 VueCropper ---
  // components: { ... },
  props: {
    userId: { type: String, required: true },
    // initialImageUrl 理论上不需要，因为预览由父组件控制
    // initialImageUrl: { type: String, default: '' },
    sizeLimit: { type: Number, default: 2 }, // 单位 MB
    disabled: { type: Boolean, default: false },
    // 可接受的文件类型
    acceptTypes: {
      type: String,
      default: 'image/png, image/jpeg, image/jpg'
    }
  },
  data() {
    return {
      loading: false,      // 上传状态
      errorMessage: ''     // 错误信息
      // --- 无需裁剪相关状态 ---
    };
  },
  methods: {
    // 触发文件选择
    triggerUpload() {
      if (this.disabled || this.loading) return;
      this.errorMessage = '';
      // 清除上一次选择的文件，确保 @change 总是触发
      this.$refs.fileInput.value = '';
      this.$refs.fileInput.click();
    },

    // 文件选择后的处理 (直接上传)
    handleFileChange(event) {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (this.validateFile(file)) {
          this.uploadOriginalFile(file); // 直接上传原始文件
        }
      }
    },

    // 文件验证
    validateFile(file) {
      this.errorMessage = '';
      const allowedTypesArray = this.acceptTypes.split(',').map(s => s.trim());
      const fileType = file.type;
      const fileSizeMB = file.size / 1024 / 1024;

      if (!allowedTypesArray.includes(fileType)) {
        this.errorMessage = `请上传指定格式图片 (${this.acceptTypes})`;
        this.$message.error(this.errorMessage);
        return false;
      }
      if (fileSizeMB > this.sizeLimit) {
        this.errorMessage = `图片大小不能超过 ${this.sizeLimit}MB`;
        this.$message.error(this.errorMessage);
        return false;
      }
      return true;
    },

    // --- 修改此方法中的响应处理 ---
    async uploadOriginalFile(file) {
      this.loading = true;
      this.errorMessage = '';
      try {
        // 1. 获取上传许可信息 (response = { code, message, data: { url, fileRecordID } })
        console.log('AvatarUploader: 请求上传 URL...');
        const response = await getUploadUrl(); // 获取完整的响应对象

        // --- 从 response.data 中解构所需信息 ---
        // 增加对 response 和 response.data 的健壮性检查
        if (!response || !response.data || !response.data.url || !response.data.fileRecordID) {
          console.error("获取上传许可失败，响应数据结构不符合预期:", response);
          // 尝试使用后端返回的 message，否则提供通用消息
          throw new Error(response?.message || '获取上传许可失败, 缺少 URL 或文件 ID');
        }
        // --- 正确地从 data 属性中解构 ---
        const { url: presignedUrl, fileRecordID } = response.data;
        // --- 修改结束 ---

        console.log('AvatarUploader: 获取到 URL:', presignedUrl, '文件 ID:', fileRecordID);

        // 2. 上传文件到预签名 URL (不变)
        console.log('AvatarUploader: 开始上传原始文件...');
        await this.uploadToPresignedUrl(presignedUrl, file);
        console.log('AvatarUploader: 文件上传成功');

        // 3. 触发 avatar-updated 事件 (不变)
        this.$emit('avatar-updated', {
          imageId: fileRecordID,
          userId: this.userId,
          imageUrl: URL.createObjectURL(file)
        });

      } catch (error) {
        console.error('AvatarUploader: 头像上传失败:', error);
        this.errorMessage = `上传失败: ${error.message || '未知错误'}`;
        this.$emit('upload-error', error);
      } finally {
        this.loading = false;
      }
    },

    // 使用 XMLHttpRequest 上传到预签名 URL
    uploadToPresignedUrl(url, file) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url, true);
        // xhr.setRequestHeader('Content-Type', file.type); // 根据需要设置

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true });
          } else {
            reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText || ''}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误，上传失败'));
        xhr.onabort = () => reject(new Error('上传已取消'));
        if (xhr.upload) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              this.$emit('upload-progress', percentComplete);
            }
          };
        }
        xhr.send(file);
      });
    }
  }
};
</script>

<style scoped>
.custom-avatar-uploader {
  display: inline-block;
  position: relative;
  line-height: 1; /* 避免按钮下方有额外空间 */
}

.upload-trigger {
  /* 您可以根据需要调整按钮的样式和定位 */
  /* 例如，如果想覆盖在父组件头像的角落 */
  /* position: absolute; */
  /* bottom: 0; */
  /* right: 0; */
  /* z-index: 1; */
  /* 或者只是简单地放在旁边 */
  /* margin-left: 10px; */
}

.upload-error-message {
  /* 显示在按钮下方 */
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #f56c6c;
  white-space: nowrap; /* 防止错误消息换行 */
}
.upload-error-message i {
  margin-right: 2px;
}
</style>