// src/store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    /**
     * 存储用户信息的对象 (字典/映射)。
     * 使用用户 ID 作为键，用户对象作为值。
     * 这种结构便于在编辑页面通过 ID 快速查找用户。
     * 例如:
     * {
     * 123: { id: 123, username: 'user1', email: 'user1@example.com', ... },
     * 456: { id: 456, username: 'user2', email: 'user2@example.com', ... }
     * }
     */
    usersById: {}
  },
  getters: {
    /**
     * 根据用户 ID 从 state 中获取用户对象。
     * @param {object} state - 当前 Vuex state。
     * @returns {function(id: number|string): object|null} - 返回一个函数，该函数接收用户 ID (数字或字符串)，
     * 返回对应的用户对象，如果找不到则返回 null。
     */
    getUserById: (state) => (id) => {
      // 确保比较时使用正确的类型，或者将传入的 id 统一转换为数字
      // 路由参数通常是字符串，所以转换为数字是比较稳妥的做法
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        console.warn(`[Vuex Getter getUserById] Invalid ID received: ${id}. Must be convertible to a number.`);
        return null;
      }
      return state.usersById[numericId] || null;
    }
  },
  mutations: {
    /**
     * 将从 API 获取的用户数组添加或更新到 state.usersById 中。
     * @param {object} state - 当前 Vuex state。
     * @param {Array<object>} usersArray - 用户对象数组，结构应与 UserManagementPage 中获取的 pageData 一致。
     */
    SET_USERS(state, usersArray) {
      // 输入校验：确保传入的是一个数组
      if (!Array.isArray(usersArray)) {
        console.error('[Vuex Mutation SET_USERS] Failed: Input must be an array. Received:', usersArray);
        return;
      }

      console.log(`[Vuex Mutation SET_USERS] Received ${usersArray.length} users to store/update.`);
      usersArray.forEach(user => {
        // 对每个用户对象进行基本校验，确保有 ID
        if (user && user.id != null) {
          // 使用 Vue.set 来确保响应性，特别是对于新添加到 usersById 的 key。
          // 在 Vue 2 中这是推荐做法。Vue 3 中直接赋值通常也能保证响应性。
          // 为兼容性考虑，这里使用 Vue.set。
          Vue.set(state.usersById, user.id, user);
          // 或者直接赋值: state.usersById[user.id] = user;
        } else {
          // 打印警告信息，跳过无效的用户数据
          console.warn('[Vuex Mutation SET_USERS] Skipping invalid user object (missing or null id):', user);
        }
      });
      // console.log('[Vuex Mutation SET_USERS] Current usersById state:', state.usersById); // 调试用，可以按需开启
    },

    /**
     * 清空所有存储的用户数据。
     * 可在用户登出或其他需要重置状态的场景下调用。
     * @param {object} state - 当前 Vuex state。
     */
    CLEAR_USERS(state) {
      console.log('[Vuex Mutation CLEAR_USERS] Clearing all user data from the store.');
      state.usersById = {};
    },

    /**
     * (可选) 删除指定 ID 的用户。
     * 如果用户在列表页被删除，可以调用此 mutation 从 Vuex 中移除。
     * @param {object} state - 当前 Vuex state。
     * @param {number|string} userId - 要删除的用户 ID。
     */
    REMOVE_USER(state, userId) {
      const numericId = parseInt(userId, 10);
      if (isNaN(numericId)) {
        console.warn(`[Vuex Mutation REMOVE_USER] Invalid ID received: ${userId}.`);
        return;
      }
      if (state.usersById[numericId]) {
        console.log(`[Vuex Mutation REMOVE_USER] Removing user with ID: ${numericId}`);
        Vue.delete(state.usersById, numericId); // 使用 Vue.delete 保证响应性
      } else {
        console.log(`[Vuex Mutation REMOVE_USER] User with ID ${numericId} not found in store.`);
      }
    }
  },
  actions: {
    // 暂时将 API 调用放在组件中，如果后续逻辑变复杂或需要在多处获取用户列表，
    // 可以考虑将 getNormalUserList 的调用封装到 action 中，例如：
    /*
    async fetchUsersAction({ commit }, queryParams) {
      try {
        const response = await getNormalUserList(queryParams); // 假设 API 函数已导入
        const responseData = response?.data ?? {};
        const pageData = responseData.records || [];
        if (pageData.length > 0) {
          commit('SET_USERS', pageData);
        }
        return responseData; // 可以返回数据给调用方
      } catch (error) {
        console.error('[Vuex Action fetchUsersAction] Failed:', error);
        throw error; // 抛出错误让调用方处理
      }
    }
    */
  },
  modules: {
    // 如果应用变得庞大，可以考虑将用户管理相关的 state, getters, mutations, actions
    // 组织到一个独立的 Vuex Module 中，例如 `userModule`。
  }
})