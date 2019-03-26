import Vue from 'vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter)

const Home = { template: '<div>This is Home</div>' }
const First = { template: '<div>This is First</div>' }
const Second = { template: '<div>This is Second</div>' }

const router = new VueRouter({
  mode: 'history',
  base: __dirname,
  routes: [
    {path: '/', component: Home},
    {path: '/first', component: First},
    {path: '/second', component: Second}
  ]
})

new Vue({
  router,
  template:`
    <div id="r">
      <h2>导航</h2>
      <ol>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/first">First</router-link></li>
        <li><router-link to="/second">Second</router-link></li>
      </ol>
      <router-view></router-view>
    </div>
  `
}).$mount('#app')