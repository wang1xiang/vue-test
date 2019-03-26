import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Login from './views/Login.vue'
// import Header from './views/Header.vue'
// import Left from './views/Left.vue'
// import Right from './views/Right.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: Login
    },
    {
      path: '/home',
      name: 'home',
      component: Home,
      children: [
        { path:'login', component: () => import(/* webpackChunkName: "about" */ './views/Login.vue') },
        { path:'register', component: () => import(/* webpackChunkName: "about" */ './views/Register.vue') }
      ]
    },
    {
      path: '/Router',
      name: 'Router',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/Router.vue')
    },
    {
      path: '/Router/:id/:name',
      name: 'Router',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/Router.vue')
    },
    {
      path: '/watch',
      name: 'watch',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './components/Watch&Computed.vue')
    },
    {
      path: '/esTest',
      name: 'esTest',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/Es6Test.vue')
    },
    // { // 命名视图
    //   path: '/',
    //   components: {
    //     default: Header,
    //     a: Left,
    //     b: Right
    //   }
    // },
    {
      path: '*',
      component: () => import('./views/Error.vue')
    },
  ]
})
