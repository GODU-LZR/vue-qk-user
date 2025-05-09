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
import { getNormalUserList } from '@/api/admin/index.js';
// 引入 mapMutations (如果你想用辅助函数的话，但直接用 this.$store.commit 更直观)
// import { mapMutations } from 'vuex';

export default {
  name: 'UserManagementPage',
  data() {
    return {
      loading: false,
      loadingMore: false,
      noMoreData: false,
      searchQuery: '',
      users: [], // 本地列表数据，用于页面显示
      defaultAvatar: defaultAvatarPlaceholder,
      currentPage: 0, // 记录当前已加载的页码 (从1开始计数比较好，API通常也是)
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
    // 首次加载时，请求第 1 页
    this.fetchUsers(true, 1);
  },
  methods: {
    // ...mapMutations(['SET_USERS', 'REMOVE_USER']), // 如果使用 mapMutations

    /**
     * 获取用户列表数据
     * @param {boolean} isInitialOrSearch - 是否是首次加载或搜索/筛选/排序触发的加载
     * @param {number} pageToFetch - 需要请求的页码 (从 1 开始)
     */
    fetchUsers(isInitialOrSearch = false, pageToFetch) {
      // --- 加载状态判断逻辑 ---
      if (isInitialOrSearch) {
        // 初始加载或搜索/筛选/排序
        if (this.loading) return; // 防止重复请求
        console.log(`[fetchUsers] Initial load/search requested for page ${pageToFetch}`);
        this.loading = true;
        this.users = []; // 清空本地列表
        this.currentPage = 0; // 重置当前页码记录 (因为要从第一页开始)
        this.noMoreData = false; // 重置“没有更多”状态
        // 滚动到顶部 (如果容器存在)
        if (this.$refs.scrollContainer) {
          this.$refs.scrollContainer.scrollTop = 0;
        }
      } else {
        // 加载更多
        // 如果正在加载、或正在加载更多、或已确定没有更多数据，则不执行
        if (this.loading || this.loadingMore || this.noMoreData) {
          console.log(`[fetchUsers] Load more for page ${pageToFetch} skipped: loading=${this.loading}, loadingMore=${this.loadingMore}, noMoreData=${this.noMoreData}`);
          return;
        }
        console.log(`[fetchUsers] Load more requested for page ${pageToFetch}`);
        this.loadingMore = true;
      }

      // --- 请求参数 ---
      const queryParams = {
        currentPage: pageToFetch, // 使用传入的要请求的页码
        pageSize: this.pageSize,
        searchQuery: this.searchQuery,
        filterStatus: this.filterStatus === '' ? null : this.filterStatus,
        sortBy: this.sortBy === 'default' ? null : this.sortBy, // 'default' 时传 null 或不传
        sortOrder: this.sortBy === 'default' ? null : this.sortOrder // 'default' 时传 null 或不传
      };

      console.log(`[Vue Component] 调用 getNormalUserList - 请求页码: ${pageToFetch}, 参数:`, queryParams);

      // --- 调用 API ---
      getNormalUserList(queryParams)
          .then(response => {
            const responseData = response?.data ?? {};
            const pageData = responseData.records || []; // 用户数据数组
            const total = responseData.total || 0; // 总记录数

            console.log(`[Vue Component] API 响应成功: 获取到页码 ${pageToFetch} 的 ${pageData.length} 条记录, 总数 ${total}`);

            // --- ⭐ 将获取到的数据存入 Vuex ---
            if (pageData.length > 0) {
              try {
                this.$store.commit('SET_USERS', pageData);
                console.log(`[Vue Component] 已将 ${pageData.length} 条用户数据提交到 Vuex store。`);
              } catch (e) {
                console.error("[Vue Component] 提交用户数据到 Vuex 失败:", e);
                // 考虑添加用户提示
                // this.$message.error('缓存用户信息失败');
              }
            }
            // --- ⭐ Vuex 存储结束 ---

            // --- 更新本地列表数据用于显示 ---
            if (pageData.length > 0) {
              if (isInitialOrSearch) {
                this.users = pageData; // 初始加载或搜索，直接替换
              } else {
                this.users = this.users.concat(pageData); // 加载更多，追加数据
              }
              this.currentPage = pageToFetch; // 更新当前已成功加载的页码
              console.log(`[fetchUsers SUCCESS] currentPage updated to: ${this.currentPage}`);
            }

            // --- 更新总数和“没有更多”状态 ---
            this.totalUsers = total;
            // 判断是否没有更多数据：当前列表长度 >= 总数，或者当前请求返回的数据为空
            this.noMoreData = this.users.length >= this.totalUsers || pageData.length === 0;
            // 如果是初始加载且第一页就没数据，也标记为 noMoreData
            if (isInitialOrSearch && pageData.length === 0) {
              this.noMoreData = true;
            }


            console.log(`[Vue Component] 加载完成: 当前显示 ${this.users.length}, 总数 ${this.totalUsers}, 是否还有更多: ${!this.noMoreData}`);

          })
          .catch(error => {
            // --- 错误处理 ---
            console.error('[Vue Component] 获取用户列表失败:', error);
            const errorMsg = error?.message || '请稍后重试';
            this.$message.error(`加载用户列表失败: ${errorMsg}`);
            // 出错时也认为没有更多数据，防止无限滚动一直尝试
            this.noMoreData = true;
          })
          .finally(() => {
            // --- 结束加载状态 ---
            if (isInitialOrSearch) {
              this.loading = false;
            } else {
              this.loadingMore = false;
            }
            console.log(`[fetchUsers finally] loading=${this.loading}, loadingMore=${this.loadingMore}, noMoreData=${this.noMoreData}`);
          });
    },

    // --- 无限滚动加载更多 ---
    loadMore() {
      console.log(`触发 loadMore, 当前已加载页: ${this.currentPage}, 是否还有更多: ${!this.noMoreData}, loadingMore: ${this.loadingMore}`);
      // 只有在非加载中、非加载更多、且还有更多数据时才加载下一页
      if (!this.loading && !this.loadingMore && !this.noMoreData) {
        const nextPage = this.currentPage + 1; // 计算下一页页码
        console.log(`[loadMore] 准备加载第 ${nextPage} 页`);
        this.fetchUsers(false, nextPage); // 调用 fetchUsers 加载下一页
      } else {
        console.log(`[loadMore] 加载被阻止: loading=${this.loading}, loadingMore=${this.loadingMore}, noMoreData=${this.noMoreData}`);
      }
    },

    // --- 搜索、筛选、排序处理 ---
    handleSearch() {
      // 搜索时，总是从第 1 页开始重新加载
      this.fetchUsers(true, 1);
    },
    handleFilterOrSortChange() {
      // 筛选或排序改变时，也总是从第 1 页开始重新加载
      this.fetchUsers(true, 1);
    },

    // --- 添加用户导航 ---
    handleAddUser() {
      this.$router.push('/admin/users/create');
    },
    // --- 编辑用户导航 ---
    handleEditUser(user) {
      // 可以在导航前检查 Vuex 中是否已存在该用户 (可选调试)
      const userInStore = this.$store.getters.getUserById(user.id);
      console.log(`[UserManagementPage] Navigating to edit user ${user.id}. Exists in Vuex: ${!!userInStore}`);
      this.$router.push(`/admin/users/edit/${user.id}`);
    },

    // --- 用户操作指令处理 ---
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

    // --- 用户操作方法 (模拟 API 调用) ---
    banUser(user, durationDays) {
      console.log(`请求封禁用户 ${user.id}，时长: ${durationDays === -1 ? '永久' : durationDays + '天'}`);
      this.$message({ message: '处理中...', type: 'info', duration: 1000 });
      // TODO: 调用后端封禁 API
      setTimeout(() => {
        this.$message.success('用户封禁操作成功 (模拟)');
        // 操作成功后刷新列表 (会重新获取并覆盖 Vuex 中的数据)
        this.fetchUsers(true, 1);
        // 如果需要立即更新 Vuex 中该用户的状态，可以在这里 commit
        // const newStatus = durationDays === -1 ? 3 : (durationDays === 30 ? 2 : 1);
        // const newBanEndTime = ... // 计算封禁结束时间
        // this.$store.commit('SET_USERS', [{...user, status: newStatus, banEndTime: newBanEndTime}]);
      }, 500);
    },
    unbanUser(user) {
      console.log(`请求取消封禁用户 ${user.id}`);
      this.$message({ message: '处理中...', type: 'info', duration: 1000 });
      // TODO: 调用后端解封 API
      setTimeout(() => {
        this.$message.success('用户已取消封禁 (模拟)');
        this.fetchUsers(true, 1);
        // this.$store.commit('SET_USERS', [{...user, status: 0, banEndTime: null}]);
      }, 500);
    },
    deleteUser(user) {
      console.log(`请求删除用户 ${user.id}`);
      this.$message({ message: '处理中...', type: 'info', duration: 1000 });
      // TODO: 调用后端删除 API
      setTimeout(() => {
        this.$message.success('用户删除成功 (模拟)');
        // 删除成功后，不仅要刷新列表，最好也从 Vuex 中移除
        try {
          this.$store.commit('REMOVE_USER', user.id); // 调用移除 mutation
          console.log(`[Vue Component] 已从 Vuex store 移除用户 ${user.id}`);
        } catch(e) {
          console.error("[Vue Component] 从 Vuex 移除用户失败:", e);
        }
        this.fetchUsers(true, 1); // 刷新列表
      }, 500);
    },

    // --- 辅助方法 ---
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
