// src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
// 如果需要使用 Element UI 等组件库，可在此引入
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI);

Vue.config.productionTip = false


let instance = null

function render(props = {}) {
  const { container } = props
  instance = new Vue({
    router,
    render: h => h(App)
  }).$mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// qiankun 生命周期导出
export async function bootstrap() {
  console.log('[user-module] bootstrap')
}

export async function mount(props) {
  console.log('[user-module] mount => ', props)
  render(props)
}

export async function unmount() {
  console.log('[user-module] unmount')
  if (instance) {
    instance.$destroy()
    instance.$el.innerHTML = ''
    instance = null
  }
}
