<template>
  <div class="user-management-page">
    <div class="page-title-container">
      <i class="el-icon-user-solid page-title-icon"></i>
      <h2 class="page-title">用户列表管理</h2>
    </div>
    <el-card shadow="never" class="actions-card">
      <div class="actions-bar">
        <el-button type="primary" icon="el-icon-plus" @click="handleAddUser" class="action-item">
          添加用户
        </el-button>
        <el-input
            v-model="searchQuery"
            placeholder="搜索编号、姓名、邮箱或用户名"
            clearable
            class="action-item search-input"
            @clear="handleSearch(true)"
            @keyup.enter.native="handleSearch(true)"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch(true)"></el-button>
        </el-input>
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
        <el-select
            v-model="sortBy"
            placeholder="排序字段"
            class="action-item sort-select"
            @change="handleFilterOrSortChange"
        >
          <el-option label="默认排序" value="default"></el-option>
          <el-option label="按姓名" value="name"></el-option>
          <el-option label="按编号" value="code"></el-option>
          <el-option label="按用户名" value="username"></el-option>
        </el-select>
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
    <div
        class="user-cards-container"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="loadingMore || noMoreData || loading"
        infinite-scroll-delay="300"
        infinite-scroll-distance="10"
        ref="scrollContainer"
    >
      <transition-group name="card-fade" tag="div" class="card-list-wrapper">
        <el-card
            v-for="user in users"
            :key="user.id"
            class="user-card"
            shadow="hover"
        >
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
          <div class="card-body">
            <p><i class="el-icon-postcard"></i> <strong>编号:</strong> {{ user.userCode }}</p>
            <p><i class="el-icon-message"></i> <strong>邮箱:</strong> {{ user.email }}</p>
            <p><i class="el-icon-time"></i> <strong>注册时间:</strong> {{ formatDateTime(user.createTime) }}</p>
            <p v-if="user.banEndTime" class="ban-info">
              <i class="el-icon-warning-outline"></i> <strong>封禁至:</strong> {{ formatDateTime(user.banEndTime) }}
            </p>
          </div>
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
      <div v-if="loading || loadingMore" class="loading-indicator">
        <i class="el-icon-loading"></i> 加载中...
      </div>
      <div v-if="noMoreData && users.length > 0 && !loading" class="no-more-indicator">
        没有更多用户了
      </div>
      <div v-if="!loading && users.length === 0 && !noMoreData" class="no-data-indicator">
        暂无符合条件的用户数据
      </div>
    </div>
  </div>
</template>

<script>
import defaultAvatarPlaceholder from '@/assets/default-avatar.png';
// 导入 API 函数
import {
  getNormalUserList,
  banUserByAdmin,
  unbanUserByAdmin,
  deleteUserByAdmin
} from '@/api/admin/index.js';
// import { mapMutations } from 'vuex'; // 如果使用 mapMutations

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
      currentPage: 0,
      pageSize: 12,
      totalUsers: 0,
      filterStatus: '',
      sortBy: 'default',
      sortOrder: 'desc',
      statusOptions: [
        { value: 0, label: '正常' },
        { value: 1, label: '封禁15天' },
        { value: 2, label: '封禁30天' },
        { value: 3, label: '永久封禁' },
      ],
    };
  },
  created() {
    this.fetchUsers(true, 1);
  },
  methods: {
    // ...mapMutations(['SET_USERS', 'REMOVE_USER']),

    fetchUsers(isInitialOrSearch = false, pageToFetch) {
      if (isInitialOrSearch) {
        if (this.loading) return;
        console.log(`[fetchUsers] Initial load/search requested for page ${pageToFetch}`);
        this.loading = true;
        this.users = [];
        this.currentPage = 0;
        this.noMoreData = false;
        if (this.$refs.scrollContainer) {
          this.$refs.scrollContainer.scrollTop = 0;
        }
      } else {
        if (this.loading || this.loadingMore || this.noMoreData) {
          console.log(`[fetchUsers] Load more for page ${pageToFetch} skipped: loading=${this.loading}, loadingMore=${this.loadingMore}, noMoreData=${this.noMoreData}`);
          return;
        }
        console.log(`[fetchUsers] Load more requested for page ${pageToFetch}`);
        this.loadingMore = true;
      }

      const queryParams = {
        currentPage: pageToFetch,
        pageSize: this.pageSize,
        searchQuery: this.searchQuery,
        filterStatus: this.filterStatus === '' ? null : this.filterStatus,
        sortBy: this.sortBy === 'default' ? null : this.sortBy,
        sortOrder: this.sortBy === 'default' ? null : this.sortOrder
      };

      console.log(`[Vue Component] 调用 getNormalUserList - 请求页码: ${pageToFetch}, 参数:`, queryParams);

      getNormalUserList(queryParams)
          .then(response => {
            const responseData = response?.data ?? {};
            const pageData = responseData.records || [];
            const total = responseData.total || 0;

            console.log(`[Vue Component] API 响应成功: 获取到页码 ${pageToFetch} 的 ${pageData.length} 条记录, 总数 ${total}`);

            if (pageData.length > 0) {
              try {
                this.$store.commit('SET_USERS', pageData);
                console.log(`[Vue Component] 已将 ${pageData.length} 条用户数据提交到 Vuex store。`);
              } catch (e) {
                console.error("[Vue Component] 提交用户数据到 Vuex 失败:", e);
              }
            }

            if (pageData.length > 0) {
              if (isInitialOrSearch) {
                this.users = pageData;
              } else {
                this.users = this.users.concat(pageData);
              }
              this.currentPage = pageToFetch;
              console.log(`[fetchUsers SUCCESS] currentPage updated to: ${this.currentPage}`);
            }

            this.totalUsers = total;
            this.noMoreData = this.users.length >= this.totalUsers || pageData.length === 0;
            if (isInitialOrSearch && pageData.length === 0) {
              this.noMoreData = true;
            }

            console.log(`[Vue Component] 加载完成: 当前显示 ${this.users.length}, 总数 ${this.totalUsers}, 是否还有更多: ${!this.noMoreData}`);
          })
          .catch(error => {
            console.error('[Vue Component] 获取用户列表失败:', error);
            const errorMsg = error?.response?.data?.message || error?.message || '请稍后重试';
            this.$message.error(`加载用户列表失败: ${errorMsg}`);
            this.noMoreData = true;
          })
          .finally(() => {
            if (isInitialOrSearch) {
              this.loading = false;
            } else {
              this.loadingMore = false;
            }
            console.log(`[fetchUsers finally] loading=${this.loading}, loadingMore=${this.loadingMore}, noMoreData=${this.noMoreData}`);
          });
    },

    loadMore() {
      console.log(`触发 loadMore, 当前已加载页: ${this.currentPage}, 是否还有更多: ${!this.noMoreData}, loadingMore: ${this.loadingMore}`);
      if (!this.loading && !this.loadingMore && !this.noMoreData) {
        const nextPage = this.currentPage + 1;
        console.log(`[loadMore] 准备加载第 ${nextPage} 页`);
        this.fetchUsers(false, nextPage);
      } else {
        console.log(`[loadMore] 加载被阻止: loading=${this.loading}, loadingMore=${this.loadingMore}, noMoreData=${this.noMoreData}`);
      }
    },

    handleSearch() {
      this.fetchUsers(true, 1);
    },
    handleFilterOrSortChange() {
      this.fetchUsers(true, 1);
    },

    handleAddUser() {
      this.$router.push('/admin/users/create');
    },
    handleEditUser(user) {
      const userInStore = this.$store.getters.getUserById(user.id);
      console.log(`[UserManagementPage] Navigating to edit user ${user.id}. Exists in Vuex: ${!!userInStore}`);
      this.$router.push(`/admin/users/edit/${user.id}`);
    },

    handleCommand(command, user) {
      console.log('Command:', command, 'User:', user);
      const actionMap = {
        'ban_15': { message: `确认要将用户 "${user.realName}" 封禁15天吗？`, action: () => this.banUser(user, 15) },
        'ban_30': { message: `确认要将用户 "${user.realName}" 封禁30天吗？`, action: () => this.banUser(user, 30) },
        'ban_permanent': { message: `确认要将用户 "${user.realName}" 永久封禁吗？此操作影响重大！`, action: () => this.banUser(user, -1) }, // -1 代表永久封禁
        'unban': { message: `确认要取消用户 "${user.realName}" 的封禁状态吗？`, action: () => this.unbanUser(user) },
        'delete': { message: `确认要删除用户 "${user.realName}" 吗？此操作不可恢复！`, action: () => this.deleteUser(user), type: 'error' }
      };
      const selectedAction = actionMap[command];
      if (selectedAction) {
        this.confirmAction(selectedAction.message, selectedAction.action, selectedAction.type || 'warning');
      }
    },

    banUser(user, durationDays) {
      let banStatus;
      let durationText;
      if (durationDays === 15) {
        banStatus = 1;
        durationText = '15天';
      } else if (durationDays === 30) {
        banStatus = 2;
        durationText = '30天';
      } else if (durationDays === -1) { // 永久封禁
        banStatus = 3;
        durationText = '永久';
      } else {
        this.$message.error('无效的封禁时长');
        return;
      }

      console.log(`请求封禁用户 ${user.id}，时长: ${durationText}，对应 banStatus: ${banStatus}`);
      this.$message({ message: '处理中...', type: 'info', duration: 1500 });

      banUserByAdmin(user.id, { banStatus })
          .then(() => {
            this.$message.success(`用户 "${user.realName}" 已成功封禁${durationText}`);
            // 操作成功后刷新列表，重新获取第一页数据
            this.fetchUsers(true, 1);
          })
          .catch(error => {
            console.error(`封禁用户 ${user.id} 失败:`, error);
            const errorMsg = error?.response?.data?.message || error?.message || '操作失败，请重试';
            this.$message.error(`封禁失败: ${errorMsg}`);
          });
    },

    unbanUser(user) {
      console.log(`请求取消封禁用户 ${user.id}`);
      this.$message({ message: '处理中...', type: 'info', duration: 1500 });

      unbanUserByAdmin(user.id)
          .then(() => {
            this.$message.success(`用户 "${user.realName}" 已成功取消封禁`);
            this.fetchUsers(true, 1);
          })
          .catch(error => {
            console.error(`取消封禁用户 ${user.id} 失败:`, error);
            const errorMsg = error?.response?.data?.message || error?.message || '操作失败，请重试';
            this.$message.error(`取消封禁失败: ${errorMsg}`);
          });
    },

    deleteUser(user) {
      console.log(`请求删除用户 ${user.id}`);
      this.$message({ message: '处理中...', type: 'info', duration: 1500 });

      deleteUserByAdmin(user.id)
          .then(() => {
            this.$message.success(`用户 "${user.realName}" 删除成功`);
            try {
              this.$store.commit('REMOVE_USER', user.id);
              console.log(`[Vue Component] 已从 Vuex store 移除用户 ${user.id}`);
            } catch(e) {
              console.error("[Vue Component] 从 Vuex 移除用户失败:", e);
            }
            // 刷新列表，看是否需要调整页码或直接刷新当前页/第一页
            // 考虑到删除后总数会变化，且当前页可能因此变空，刷新第一页通常更稳妥
            this.fetchUsers(true, 1);
          })
          .catch(error => {
            console.error(`删除用户 ${user.id} 失败:`, error);
            const errorMsg = error?.response?.data?.message || error?.message || '操作失败，请重试';
            this.$message.error(`删除用户失败: ${errorMsg}`);
          });
    },

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
      return statusMap[status] !== undefined ? statusMap[status] : '未知状态';
    },
    getStatusTagType(status) {
      const typeMap = { 0: 'success', 1: 'warning', 2: 'danger', 3: 'info' };
      return typeMap[status] || 'info';
    },
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '-';
      try {
        const parsableString = dateTimeString.includes('T') ? dateTimeString.replace('T', ' ') : dateTimeString;
        let date = new Date(parsableString);
        if (isNaN(date.getTime())) {
          const fallbackDate = new Date(dateTimeString);
          if (isNaN(fallbackDate.getTime())) {
            console.warn("无法解析日期字符串:", dateTimeString);
            return dateTimeString;
          }
          date = fallbackDate;
        }
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch (e) {
        console.error("格式化日期时出错:", dateTimeString, e);
        return dateTimeString;
      }
    },
  }
}
</script>

<style scoped>
/* 样式部分保持不变 */
.user-management-page { padding: 20px; background-color: #f5f7fa; }
.page-title-container { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e4e7ed; }
.page-title-icon { font-size: 24px; color: #409EFF; margin-right: 10px; }
.page-title { font-size: 22px; font-weight: 600; color: #303133; margin: 0; }
.actions-card { margin-bottom: 20px; }
.actions-bar { display: flex; flex-wrap: wrap; gap: 15px; align-items: center; }
.search-input { width: 280px; min-width: 200px; }
.filter-select { width: 150px; }
.sort-select { width: 130px; }
.order-select { width: 100px; }
.user-cards-container { padding-bottom: 40px; }
.card-list-wrapper { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; position: relative; }
.user-card { min-width: 280px; display: flex; flex-direction: column; transition: all 0.3s ease; background-color: #fff; border-radius: 4px; border: 1px solid #EBEEF5; box-sizing: border-box; }
@media (max-width: 768px) { .actions-bar { flex-direction: column; align-items: stretch; } .action-item { width: 100%; margin-right: 0; } .search-input, .filter-select, .sort-select, .order-select { width: 100%; } }
.user-card:hover { transform: translateY(-5px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
.card-header { display: flex; align-items: center; position: relative; border-bottom: 1px solid #EBEEF5; padding-bottom: 15px; }
.card-avatar { margin-right: 15px; flex-shrink: 0; }
.user-info-header { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; min-width: 0; }
.user-realname { font-weight: 600; font-size: 1.1em; color: #303133; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.user-username { font-size: 0.9em; color: #909399; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status-tag { position: absolute; top: 18px; right: 20px; }
.card-body { padding: 15px 20px; }
.card-body p { margin: 10px 0; font-size: 14px; color: #606266; display: flex; align-items: center; line-height: 1.5; word-break: break-all; }
.card-body p i { margin-right: 10px; color: #C0C4CC; width: 16px; text-align: center; font-size: 16px; flex-shrink: 0; }
.card-body p strong { color: #303133; margin-right: 5px; flex-shrink: 0; }
.ban-info { color: #E6A23C; }
.ban-info i, .ban-info strong { color: #E6A23C; }
.card-actions { margin-top: auto; padding: 15px 20px; border-top: 1px solid #EBEEF5; text-align: center; background-color: #fdfdfd; }
.loading-indicator, .no-more-indicator, .no-data-indicator { text-align: center; padding: 25px 0; color: #909399; width: 100%; font-size: 14px; grid-column: 1 / -1; }
.loading-indicator i { margin-right: 8px; }
.card-fade-enter-active, .card-fade-leave-active { transition: all 0.5s ease; }
.card-fade-enter, .card-fade-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
.card-fade-leave-active { position: absolute; width: calc(100% / 3 - 20px * 2 / 3); z-index: 0; }
.card-list-wrapper > .user-card { transition: transform 0.5s ease, opacity 0.5s ease; }
</style>