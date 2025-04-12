<template>
  <div class="user-management-page">
    <!-- 1. 美化后的标题 (已居中) -->
    <div class="page-title-container">
      <i class="el-icon-user-solid page-title-icon"></i>
      <h2 class="page-title">用户列表管理</h2>
    </div>

    <!-- 操作与筛选区域 (无变化) -->
    <el-card shadow="never" class="actions-card">
      <!-- ... 内容不变 ... -->
      <div class="actions-bar">
        <!-- 添加用户按钮 -->
        <el-button type="primary" icon="el-icon-plus" @click="handleAddUser" class="action-item">
          添加用户
        </el-button>

        <!-- 搜索框 -->
        <el-input
            v-model="searchQuery"
            placeholder="搜索编号、姓名或邮箱"
            clearable
            class="action-item search-input"
            @clear="handleSearch(true)"
            @keyup.enter.native="handleSearch(true)"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch(true)"></el-button>
        </el-input>

        <!-- 2. 封禁状态筛选 -->
        <el-select
            v-model="filterStatus"
            placeholder="按状态筛选"
            clearable
            class="action-item filter-select"
            @change="handleFilterOrSortChange"
        >
          <el-option label="全部状态" value=""></el-option>
          <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
          </el-option>
        </el-select>

        <!-- 3. 排序条件筛选 -->
        <el-select
            v-model="sortBy"
            placeholder="排序字段"
            class="action-item sort-select"
            @change="handleFilterOrSortChange"
        >
          <el-option label="默认排序" value="default"></el-option>
          <el-option label="按姓名" value="name"></el-option>
          <el-option label="按编号" value="code"></el-option>
          <!-- <<< 新增：按用户名排序选项 -->
          <el-option label="按用户名" value="username"></el-option>
          <!-- >>> 新增结束 -->
        </el-select>

        <!-- 排序方向 (保持不变) -->
        <el-select
            v-model="sortOrder"
            placeholder="排序顺序"
            class="action-item order-select"
            :disabled="sortBy === 'default'"
            @change="handleFilterOrSortChange"
        >
          <el-option label="升序" value="asc"></el-option>
          <el-option label="降序" value="desc"></el-option>
        </el-select>

      </div>
    </el-card>

    <!-- 用户卡片列表区域 (容器改为 Grid 布局) -->
    <div
        class="user-cards-container"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="loadingMore || noMoreData || loading"
        infinite-scroll-delay="300"
        infinite-scroll-distance="10"
        ref="scrollContainer"
    >
      <!-- transition-group 的 tag 仍然是 div, 但其子元素由 Grid 控制 -->
      <transition-group name="card-fade" tag="div" class="card-list-wrapper">
        <el-card
            v-for="user in users"
            :key="user.id"
            class="user-card"
            shadow="hover"
        >
          <!-- Card Header (无变化) -->
          <div slot="header" class="clearfix card-header">
            <el-avatar :size="50" :src="user.avatar || defaultAvatar" icon="el-icon-user-solid" class="card-avatar"></el-avatar>
            <div class="user-info-header">
              <span class="user-realname">{{ user.realName }}</span>
              <span class="user-username">(@{{ user.username }})</span>
            </div>
            <el-tag :type="getStatusTagType(user.status)" size="small" class="status-tag">
              {{ formatStatus(user.status) }}
            </el-tag>
          </div>
          <!-- Card Body (无变化) -->
          <div class="card-body">
            <p><i class="el-icon-postcard"></i> <strong>编号:</strong> {{ user.userCode }}</p>
            <p><i class="el-icon-message"></i> <strong>邮箱:</strong> {{ user.email }}</p>
            <p><i class="el-icon-time"></i> <strong>注册时间:</strong> {{ formatDateTime(user.createTime) }}</p>
            <p v-if="user.banEndTime" class="ban-info">
              <i class="el-icon-warning-outline"></i> <strong>封禁至:</strong> {{ formatDateTime(user.banEndTime) }}
            </p>
          </div>
          <!-- Card Actions (无变化) -->
          <div class="card-actions">
            <el-button size="mini" type="primary" icon="el-icon-edit" @click="handleEditUser(user)">
              编辑
            </el-button>
            <el-dropdown @command="handleCommand($event, user)" style="margin-left: 10px;">
              <el-button size="mini" type="warning">
                操作<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="ban_15" :disabled="user.status !== 0">封禁15天</el-dropdown-item>
                <el-dropdown-item command="ban_30" :disabled="user.status !== 0">封禁30天</el-dropdown-item>
                <el-dropdown-item command="ban_permanent" :disabled="user.status !== 0">永久封禁</el-dropdown-item>
                <el-dropdown-item command="unban" :disabled="user.status === 0">取消封禁</el-dropdown-item>
                <el-dropdown-item command="delete" divided style="color: red;">删除用户</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </el-card>
      </transition-group>

      <!-- 加载提示 (无变化) -->
      <div v-if="loading || loadingMore" class="loading-indicator">
        <i class="el-icon-loading"></i> 加载中...
      </div>
      <div v-if="noMoreData && users.length > 0" class="no-more-indicator">
        没有更多用户了
      </div>
      <div v-if="!loading && users.length === 0 && !noMoreData" class="no-data-indicator">
        暂无符合条件的用户数据
      </div>
    </div>

  </div>
</template>

<script>
// Script 部分保持不变
import defaultAvatarPlaceholder from '@/assets/default-avatar.png';
import { generateFakeUsers, TOTAL_USERS_COUNT } from './_fakeUserData';

export default {
  name: 'UserManagementPage',
  data() {
    return {
      loading: false,
      loadingMore: false,
      noMoreData: false,
      searchQuery: '',
      users: [],
      defaultAvatar: defaultAvatarPlaceholder,
      currentPage: 1,
      pageSize: 12, // 保持12，以适应3列布局
      totalUsers: 0,
      allSimulatedUsers: [], // 存储所有模拟数据

      // --- 新增数据属性 ---
      filterStatus: '', // 筛选状态 (空字符串表示全部)
      sortBy: 'default', // 排序字段 ('default', 'name', 'code')
      sortOrder: 'asc', // 排序顺序 ('asc', 'desc')

      // --- 筛选/排序选项 ---
      statusOptions: [
        { value: 0, label: '正常' },
        { value: 1, label: '封禁15天' },
        { value: 2, label: '封禁30天' },
        { value: 3, label: '永久封禁' },
      ],
      // sortOptions 和 orderOptions 直接在 template 中定义了
    };
  },
  created() {
    this.allSimulatedUsers = generateFakeUsers(TOTAL_USERS_COUNT);
    // 注意：totalUsers 会在 fetchUsers 中根据过滤结果动态更新
    this.fetchUsers(true);
  },
  methods: {
    // --- 数据获取 (核心修改) ---
    fetchUsers(isInitialOrSearch = false) {
      if (isInitialOrSearch) {
        this.loading = true;
        this.currentPage = 1;
        this.users = [];
        this.noMoreData = false;
        if (this.$refs.scrollContainer) {
          this.$refs.scrollContainer.scrollTop = 0;
        }
      } else {
        this.loadingMore = true;
      }

      console.log(`模拟获取用户列表 - 页码: ${this.currentPage}, 搜索: '${this.searchQuery}', 状态: ${this.filterStatus}, 排序: ${this.sortBy} ${this.sortOrder}`);

      // --- 模拟 API 请求 ---
      setTimeout(() => {
        // 1. 从完整列表中开始处理
        let processedUsers = [...this.allSimulatedUsers];

        // 2. 应用搜索过滤
        if (this.searchQuery) {
          const lowerQuery = this.searchQuery.toLowerCase();
          processedUsers = processedUsers.filter(user =>
              user.userCode.toLowerCase().includes(lowerQuery) ||
              user.realName.toLowerCase().includes(lowerQuery) ||
              user.email.toLowerCase().includes(lowerQuery)
          );
        }

        // 3. 应用状态过滤
        if (this.filterStatus !== '' && this.filterStatus !== null) { // 确保处理 clearable 的 null 值
          processedUsers = processedUsers.filter(user => user.status === this.filterStatus);
        }

        // 4. 应用排序
        if (this.sortBy !== 'default') {
          processedUsers.sort((a, b) => {
            let comparison = 0;
            let valA, valB;

            if (this.sortBy === 'name') {
              valA = a.realName || '';
              valB = b.realName || '';
              // 使用 localeCompare 进行中文友好排序
              comparison = valA.localeCompare(valB, 'zh-CN');
            } else if (this.sortBy === 'code') {
              valA = a.userCode || '';
              valB = b.userCode || '';
              // 尝试按数字比较，如果失败则按字符串比较
              const numA = parseInt(valA, 10);
              const numB = parseInt(valB, 10);
              if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA - numB;
              } else {
                comparison = valA.localeCompare(valB); // 字符串比较
              }
            }
            else if (this.sortBy === 'username') {
              valA = a.username || ''; // 使用 || '' 防止 undefined 或 null
              valB = b.username || '';
              // 用户名通常是字母/数字，也可能包含其他字符，localeCompare 同样适用
              comparison = valA.localeCompare(valB, 'zh-CN'); // 保持中文环境排序一致性
            }

            return this.sortOrder === 'desc' ? (comparison * -1) : comparison;
          });
        }
        // --- 排序结束 ---

        // 5. 更新符合条件的总数 (用于判断 noMoreData)
        this.totalUsers = processedUsers.length;

        // 6. 计算分页数据
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = processedUsers.slice(startIndex, endIndex);

        // 7. 追加或替换数据
        if (isInitialOrSearch) {
          this.users = pageData;
        } else {
          this.users = this.users.concat(pageData);
        }

        // 8. 更新状态
        this.currentPage++;
        // 使用过滤/排序后的总数来判断是否还有更多
        this.noMoreData = this.users.length >= this.totalUsers;

        // 9. 关闭加载状态
        if (isInitialOrSearch) {
          this.loading = false;
        } else {
          this.loadingMore = false;
        }

        console.log(`加载完成: ${pageData.length} 条, 当前显示: ${this.users.length}, 符合条件总数: ${this.totalUsers}, 是否还有更多: ${!this.noMoreData}`);

      }, 500); // 模拟网络延迟
    },

    // --- 无限滚动触发 ---
    loadMore() {
      console.log("触发 loadMore");
      if (!this.loading && !this.loadingMore && !this.noMoreData) {
        this.fetchUsers(false);
      }
    },

    // --- 搜索处理 ---
    handleSearch(isTriggeredByInput = false) {
      // 搜索总是重置到第一页
      this.fetchUsers(true);
    },

    // --- 筛选或排序变化处理 ---
    handleFilterOrSortChange() {
      // 任何筛选或排序变化都应重置到第一页
      // 如果排序字段设为'default'，则自动将排序顺序设回'asc'（或禁用）
      if (this.sortBy === 'default') {
        this.sortOrder = 'asc';
      }
      this.fetchUsers(true);
    },

    // --- 导航操作 (保持不变) ---
    handleAddUser() {
      this.$router.push('/admin/users/create'); // 假设路径
    },
    handleEditUser(user) {
      this.$router.push(`/admin/users/edit/${user.id}`); // 假设路径
    },

    // --- 用户操作 (下拉菜单) (保持不变, 但需要注意更新 allSimulatedUsers 和触发刷新) ---
    handleCommand(command, user) {
      console.log('Command:', command, 'User:', user);
      const actionMap = {
        'ban_15': { message: `确认要将用户 "${user.realName}" 封禁15天吗？`, action: () => this.banUser(user, 15) },
        'ban_30': { message: `确认要将用户 "${user.realName}" 封禁30天吗？`, action: () => this.banUser(user, 30) },
        'ban_permanent': { message: `确认要将用户 "${user.realName}" 永久封禁吗？此操作影响重大！`, action: () => this.banUser(user, -1) },
        'unban': { message: `确认要取消用户 "${user.realName}" 的封禁状态吗？`, action: () => this.unbanUser(user) },
        'delete': { message: `确认要删除用户 "${user.realName}" 吗？此操作不可恢复！`, action: () => this.deleteUser(user), type: 'error' }
      };
      const selectedAction = actionMap[command];
      if (selectedAction) {
        this.confirmAction(selectedAction.message, selectedAction.action, selectedAction.type || 'warning');
      }
    },

    // --- 模拟后端交互 (需要更新本地列表并可能触发刷新) ---
    // 注意：这些操作现在应该在修改 allSimulatedUsers 后，调用 fetchUsers(true) 来刷新当前视图，以反映过滤和排序
    updateUserInList(userId, updates) {
      // 更新 allSimulatedUsers (模拟数据库)
      const indexInAll = this.allSimulatedUsers.findIndex(u => u.id === userId);
      if (indexInAll > -1) {
        Object.assign(this.allSimulatedUsers[indexInAll], updates, {
          updateTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
        });
        return true;
      }
      return false;
    },

    banUser(user, durationDays) {
      console.log(`模拟封禁用户 ${user.id}，时长: ${durationDays === -1 ? '永久' : durationDays + '天'}`);
      this.$message({ message: '处理中...', type: 'info', duration: 500 });
      setTimeout(() => {
        let status;
        let banEndTime = null;
        if (durationDays === 15) status = 1;
        else if (durationDays === 30) status = 2;
        else if (durationDays === -1) status = 3;
        else status = user.status; // 无效时长不改变

        if (durationDays > 0) {
          const now = new Date();
          now.setDate(now.getDate() + durationDays);
          banEndTime = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
        }

        if (this.updateUserInList(user.id, { status, banEndTime })) {
          this.$message.success('用户封禁操作成功');
          this.fetchUsers(true); // 重新获取数据以应用排序/过滤
        } else {
          this.$message.error('操作失败，未找到用户');
        }
      }, 300);
    },

    unbanUser(user) {
      console.log(`模拟取消封禁用户 ${user.id}`);
      this.$message({ message: '处理中...', type: 'info', duration: 500 });
      setTimeout(() => {
        if (this.updateUserInList(user.id, { status: 0, banEndTime: null })) {
          this.$message.success('用户已取消封禁');
          this.fetchUsers(true); // 重新获取数据
        } else {
          this.$message.error('操作失败，未找到用户');
        }
      }, 300);
    },

    deleteUser(user) {
      console.log(`模拟删除用户 ${user.id}`);
      this.$message({ message: '处理中...', type: 'info', duration: 500 });
      setTimeout(() => {
        const indexInAll = this.allSimulatedUsers.findIndex(u => u.id === user.id);
        if (indexInAll > -1) {
          this.allSimulatedUsers.splice(indexInAll, 1);
          // totalUsers 会在 fetchUsers 中重新计算
          this.$message.success('用户删除成功');
          this.fetchUsers(true); // 重新获取数据
        } else {
          this.$message.error('删除失败，未找到用户');
        }
      }, 300);
    },

    // --- 辅助方法 (保持不变) ---
    confirmAction(message, confirmCallback, type = 'warning') {
      this.$confirm(message, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: type
      }).then(() => {
        confirmCallback();
      }).catch(() => {
        this.$message({ type: 'info', message: '已取消操作' });
      });
    },
    formatStatus(status) {
      const statusMap = { 0: '正常', 1: '封禁15天', 2: '封禁30天', 3: '永久封禁' };
      return statusMap[status] || '未知';
    },
    getStatusTagType(status) {
      const typeMap = { 0: 'success', 1: 'warning', 2: 'danger', 3: 'info' };
      return typeMap[status] || 'info';
    },
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '-';
      try {
        // 尝试兼容 'YYYY-MM-DD HH:MM:SS' 格式
        const parts = dateTimeString.split(' ');
        const datePart = parts[0];
        const timePart = parts.length > 1 ? parts[1] : '00:00:00';
        // 移除可能的毫秒部分，以提高兼容性
        const cleanTimePart = timePart.split('.')[0];
        const isoString = `${datePart}T${cleanTimePart}Z`; // 假设是UTC或本地时间，根据实际情况调整
        let date = new Date(isoString); // 尝试解析

        // 如果直接解析失败，尝试不带 'T' 和 'Z'
        if (isNaN(date.getTime())) {
          const fallbackDate = new Date(dateTimeString.replace(/-/g, '/')); // 尝试替换'-'为'/'提高兼容性
          if (!isNaN(fallbackDate.getTime())) {
            date = fallbackDate;
          } else {
            // 再尝试直接解析原始字符串
            const directDate = new Date(dateTimeString);
            if (!isNaN(directDate.getTime())) {
              date = directDate;
            } else {
              console.warn("Could not parse date:", dateTimeString);
              return dateTimeString; // 无法解析，返回原始字符串
            }
          }
        }

        // 格式化输出
        return date.getFullYear() + '-' +
            ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
            ('0' + date.getDate()).slice(-2) + ' ' +
            ('0' + date.getHours()).slice(-2) + ':' +
            ('0' + date.getMinutes()).slice(-2);
      } catch (e) {
        console.error("Error formatting date:", dateTimeString, e);
        return dateTimeString; // 出错时返回原始字符串
      }
    },
  }
}
</script>

<style scoped>
.user-management-page {
  padding: 20px;
  background-color: #f5f7fa;
}

/* 1. 页面标题样式 - 添加居中 */
.page-title-container {
  display: flex;
  align-items: center;
  justify-content: center; /* <<< 新增：水平居中 */
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}
.page-title-icon {
  font-size: 24px;
  color: #409EFF;
  margin-right: 10px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 操作栏卡片 */
.actions-card {
  margin-bottom: 20px;
}

/* 操作栏 flex 布局 */
.actions-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.action-item { } /* 无需额外样式 */

/* 特定项宽度调整 */
.search-input {
  width: 280px;
  min-width: 200px;
}
.filter-select { width: 150px; }
.sort-select { width: 130px; }
.order-select { width: 100px; }

/* 卡片容器 */
.user-cards-container {
  padding-bottom: 40px;
}

/* 卡片列表包装器 - 改为 Grid 布局 */
.card-list-wrapper {
  display: grid; /* <<< 修改：使用 Grid 布局 */
  grid-template-columns: repeat(3, 1fr); /* <<< 新增：默认三列，每列等宽 */
  gap: 20px; /* 卡片之间的间距 */
  position: relative; /* 为了 transition-group 的 absolute 定位 */
}

/* 单个用户卡片样式 - 移除宽度设置，Grid 会处理 */
.user-card {
  /* width: calc(33.333% - 14px); */ /* <<< 移除：不再需要手动计算宽度 */
  min-width: 280px; /* <<< 可选：保留最小宽度，防止列过窄时内容压缩 */
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  box-sizing: border-box; /* <<< 建议添加：确保 padding 和 border 包含在尺寸内 */
}

/* 响应式调整 - 修改 Grid 列数 */
@media (max-width: 992px) {
  .card-list-wrapper {
    grid-template-columns: repeat(2, 1fr); /* <<< 修改：中等屏幕两列 */
  }
  .search-input { width: 240px; }
}

@media (max-width: 768px) {
  /* 移动端操作栏优化 */
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .action-item {
    width: 100%;
    margin-right: 0;
  }
  .search-input, .filter-select, .sort-select, .order-select {
    width: 100%;
  }
  /* .card-list-wrapper {
     grid-template-columns: repeat(1, 1fr); // 移动端可以考虑单列，但下面600px已经处理
  } */
}

@media (max-width: 600px) {
  .card-list-wrapper {
    grid-template-columns: repeat(1, 1fr); /* <<< 修改：小屏幕单列 */
  }
  .user-card {
    min-width: unset; /* 小屏幕时移除最小宽度限制 */
  }
}

.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  position: relative;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 15px;
}
.card-avatar {
  margin-right: 15px;
  flex-shrink: 0;
}
.user-info-header {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}
.user-realname {
  font-weight: 600;
  font-size: 1.1em;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.user-username {
  font-size: 0.9em;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-tag {
  position: absolute;
  top: 18px;
  right: 20px;
}

/* 卡片主体内容 */
.card-body {
  padding: 15px 20px;
}
.card-body p {
  margin: 10px 0;
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  line-height: 1.5;
}
.card-body p i {
  margin-right: 10px;
  color: #C0C4CC;
  width: 16px;
  text-align: center;
  font-size: 16px;
}
.card-body p strong {
  color: #303133;
  margin-right: 5px;
}
.ban-info { color: #E6A23C; }
.ban-info i, .ban-info strong { color: #E6A23C; }

/* 卡片底部操作按钮 */
.card-actions {
  margin-top: auto;
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  text-align: center;
  background-color: #fdfdfd;
}

/* 加载和无数据提示 */
.loading-indicator,
.no-more-indicator,
.no-data-indicator {
  text-align: center;
  padding: 25px 0;
  color: #909399;
  width: 100%;
  font-size: 14px;
  /* Grid 布局下，这些提示需要跨越所有列才能居中显示 */
  grid-column: 1 / -1; /* <<< 新增：让提示元素横跨整个Grid */
}
.loading-indicator i { margin-right: 8px; }

/* 卡片进入动画 */
.card-fade-enter-active, .card-fade-leave-active {
  transition: all 0.5s ease;
}
.card-fade-enter, .card-fade-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}
/* 对于 Grid 布局，离开动画的 position:absolute 可能仍然需要，
   但宽度设置不再需要，Grid 会处理它 */
.card-fade-leave-active {
  position: absolute;
  /* width: calc(33.333% - 14px); */ /* <<< 移除或注释掉 */
  /* 响应式宽度调整也不再需要 */
  /* @media (max-width: 992px) { width: calc(50% - 10px); } */
  /* @media (max-width: 600px) { width: 100%; } */
  z-index: 0; /* 避免覆盖其他元素 */
}

/* 确保 transition-group 内部的元素在离开时不会破坏 Grid 布局 */
.card-list-wrapper > .user-card {
  transition: transform 0.5s ease, opacity 0.5s ease; /* 应用于Grid项目本身的过渡 */
}

</style>
