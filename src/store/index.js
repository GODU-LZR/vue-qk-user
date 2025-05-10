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
        if (user && user.id != null) { // user.id 可以是数字或字符串，只要非 null/undefined
          // 使用 Vue.set 来确保响应性，特别是对于新添加到 usersById 的 key。
          // 在 Vue 2 中这是推荐做法。
          Vue.set(state.usersById, user.id, user);
        } else {
          // 打印警告信息，跳过无效的用户数据
          console.warn('[Vuex Mutation SET_USERS] Skipping invalid user object (missing or null id):', user);
        }
      });
      // console.log('[Vuex Mutation SET_USERS] Current usersById state after update:', JSON.parse(JSON.stringify(state.usersById))); // 调试用，深拷贝以避免直接打印代理对象
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
     * 删除指定 ID 的用户。
     * 如果用户在列表页被删除，可以调用此 mutation 从 Vuex 中移除。
     * @param {object} state - 当前 Vuex state。
     * @param {number|string} userId - 要删除的用户 ID。
     */
    REMOVE_USER(state, userId) {
      const numericId = parseInt(userId, 10); // 尝试转换为数字，以匹配通常的 ID 格式
      if (isNaN(numericId)) {
        // 如果转换失败，尝试使用原始 userId (可能ID本身就是非数字字符串)
        // 但通常情况下，如果 usersById 的键是数字，这里也应该是数字
        // 为保持一致性，我们主要依赖 numericId，或确保 user.id 存储时和查询时类型一致
        console.warn(`[Vuex Mutation REMOVE_USER] Invalid or non-numeric ID received after parsing: ${userId}. Attempting direct key if different.`);
        // 如果 usersById 中的键可能不是严格的数字转换后的字符串，这里的逻辑可能需要调整
        // 但基于 SET_USERS 中 user.id 可以是数字，Vue.set(obj, key, val) 中数字键会转为字符串键
        // 所以 parseInt 后的 numericId 作为键是合理的。
        // 如果原始 userId 就是预期的键类型且不能转为数字，则可以直接用 userId。
        // 不过，鉴于 getUserById 也用了 parseInt，这里保持一致是好的。
        if (state.usersById.hasOwnProperty(userId)) { // 直接检查原始ID
          console.log(`[Vuex Mutation REMOVE_USER] Removing user with original ID key: ${userId}`);
          Vue.delete(state.usersById, userId); // 使用 Vue.delete 保证响应性
        } else {
          console.log(`[Vuex Mutation REMOVE_USER] User with original ID ${userId} not found, and numeric ID was NaN.`);
        }
        return;
      }

      if (state.usersById.hasOwnProperty(numericId)) { // 检查数字ID转换后的键是否存在
        console.log(`[Vuex Mutation REMOVE_USER] Removing user with ID: ${numericId}`);
        Vue.delete(state.usersById, numericId); // 使用 Vue.delete 保证响应性
      } else {
        console.log(`[Vuex Mutation REMOVE_USER] User with numeric ID ${numericId} (from original ${userId}) not found in store.`);
      }
    }
  },
  actions: {
    // 你们在组件中直接调用 API 并 commit mutation，这对于当前场景是可行的。
    // 如果未来 API 调用逻辑变得复杂或需要在多个地方复用获取用户列表的逻辑，
    // 可以考虑将 getNormalUserList 的调用封装到 action 中，如此处注释的示例：
    /*
    async fetchUsersAction({ commit }, queryParams) {
      try {
        // 假设 getNormalUserList API 函数已在此文件或相关API模块中导入
        // import { getNormalUserList } from '@/api/admin';
        const response = await getNormalUserList(queryParams);
        const responseData = response?.data ?? {}; // 根据实际API响应结构调整
        const pageData = responseData.records || [];
        if (pageData.length > 0) {
          commit('SET_USERS', pageData);
        }
        return responseData; // 可以返回数据给调用方，例如总数等
      } catch (error) {
        console.error('[Vuex Action fetchUsersAction] Failed to fetch users:', error);
        throw error; // 抛出错误让组件捕获并处理用户提示
      }
    }
    */
  },
  modules: {
    // 如果应用规模持续扩大，可以考虑将用户管理相关的 state, getters, mutations, actions
    // 组织到一个独立的 Vuex Module 中 (例如 userModule.js)，然后在主 store 文件中注册。
    // 例如:
    // import userModule from './modules/userModule';
    // modules: {
    //   user: userModule
    // }
  }
})