import Vue from 'vue'
import App from './App.vue'
// import App1 from './App1.vue'
import router from './router'
import store from './store'
import animated from 'animate.css'
import './config'

Vue.use(animated)
Vue.config.productionTip = false

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
