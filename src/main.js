// src/main.js (子应用)
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store' // <--- 1. 导入 store
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI);

Vue.config.productionTip = false

let instance = null
// --- Store setGlobalState globally within the micro-app scope ---
// let setGlobalStateFunc = null; // 不再需要单独存储，直接挂载原型

function render(props = {}) {
  const { container, setGlobalState } = props; // 从 props 中解构 setGlobalState

  // --- 将 setGlobalState 挂载到 Vue 原型 ---
  // 检查是否是一个函数，以增加健壮性
  if (typeof setGlobalState === 'function') {
    Vue.prototype.$setGlobalState = setGlobalState;
    console.log('[子应用] setGlobalState 已挂载到 Vue.prototype.$setGlobalState');
  } else {
    console.warn('[子应用] props 中未找到有效的 setGlobalState 函数。子应用将无法更新全局状态。');
    // 提供一个空操作函数以避免组件内部调用时出错
    Vue.prototype.$setGlobalState = (state) => {
      console.warn('[子应用] $setGlobalState 调用无效: 函数未从主应用正确传递。 State:', state);
    };
  }

  instance = new Vue({
    router,
    store, // <--- 2. 将 store 注入到 Vue 实例
    render: h => h(App)
  }).$mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  console.log('[子应用] 独立运行模式');
  // 如果 Vue 原型上还没有 $setGlobalState，则提供一个模拟函数
  if (!Vue.prototype.$setGlobalState) {
    Vue.prototype.$setGlobalState = (state) => {
      console.log('[子应用-独立模式] 模拟 setGlobalState 调用:', state);
      // 可以在独立模式下更新本地存储或状态管理器（如果需要）
      if (state.userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
      }
    };
  }
  // 独立运行时也需要注入 store
  render();
}

// qiankun 生命周期导出
export async function bootstrap() {
  console.log('[子应用] bootstrap');
}

export async function mount(props) {
  console.log('[子应用] mount => 接收到 props:', props);

  // --- 在 render 之前调用 render，确保 $setGlobalState 在实例创建前挂载 ---
  // 并确保 store 在实例创建时被注入
  render(props); // 将 props 传递给 render 函数

  if (props && props.onGlobalStateChange) {
    console.log('[子应用] 检测到 onGlobalStateChange，设置监听器...');
    props.onGlobalStateChange((state, prev) => {
      console.log('--- [子应用] 全局状态发生改变 (onGlobalStateChange) ---');
      console.log('Current State:', state);
      console.log(` -> 登录状态 (isLoggedIn): ${state.isLoggedIn}`);
      console.log(` -> Token: ${state.token ? '*** (存在)' : null}`);
      console.log(' -> 用户信息 (userInfo):', state.userInfo);

      // 将接收到的状态存入 localStorage (这部分逻辑保持不变)
      try {
        console.log('[子应用] 正在将全局状态同步到 localStorage...');
        if (typeof state.isLoggedIn === 'boolean') {
          localStorage.setItem('isLoggedIn', String(state.isLoggedIn));
          console.log(`   -> localStorage.setItem('isLoggedIn', '${String(state.isLoggedIn)}')`);
        } else {
          localStorage.removeItem('isLoggedIn');
          console.log("   -> localStorage.removeItem('isLoggedIn') (非布尔值)");
        }
        if (state.token) {
          localStorage.setItem('auth_token', state.token);
          console.log("   -> localStorage.setItem('auth_token', '***')");
        } else {
          localStorage.removeItem('auth_token');
          console.log("   -> localStorage.removeItem('auth_token')");
        }
        if (state.userInfo && typeof state.userInfo === 'object') {
          localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
          console.log("   -> localStorage.setItem('userInfo', JSON stringified object)");
        } else {
          localStorage.removeItem('userInfo');
          console.log("   -> localStorage.removeItem('userInfo')");
        }
        console.log('[子应用] localStorage 同步完成。');
      } catch (error) {
        console.error('[子应用] 将全局状态存入 localStorage 时出错:', error);
      }
      console.log('--- [子应用] 状态改变处理结束 ---');

    }, true); // true: 立即触发一次回调以获取初始状态
  } else {
    console.warn('[子应用] 未在 props 中检测到 onGlobalStateChange 方法。');
  }

  // render(props); // 将 render 调用移到前面
}

export async function unmount(props) {
  console.log('[子应用] unmount => props:', props);
  if (instance) {
    instance.$destroy();
    if (instance.$el && instance.$el.parentNode) {
      instance.$el.parentNode.removeChild(instance.$el);
    }
    instance = null;
    // --- 清理原型上的 $setGlobalState (可选，但良好实践) ---
    delete Vue.prototype.$setGlobalState;
    console.log('[子应用] Vue 实例已销毁，并清理 $setGlobalState');
  } else {
    console.log('[子应用] unmount 时未找到 Vue 实例');
  }
}

// ... (其他可选生命周期)
