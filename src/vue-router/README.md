[Vue Router](https://router.vuejs.org/zh/)基础知识官方文档有介绍，请阅读文档

##### 几个重要的知识点

1. 动态路由传参

   ```js
   // 1.通过params获取值 $route.params.id
   const routes = [
       {
     name: 'detail',
     path: '/detail/:id',
     component: detail
       }
   ]
   ```

   ```js
   // 2.使用prop:true的方式
   const routes = [
       {
     name: 'detail',
     path: '/detail/:id',
     component: detail,
     props: true  
       }
   ]
   const detail = {
    props: ['id'],
       template: '<div>Detail ID： {{ id }}</div>'
   }
   ```

2. 嵌套路由

   ```js
   // index 组件和 details 组件 嵌套 layout 组件
   {
       path: '/',
       component: layout,
       children: [
           {
            name: 'index',
               path: '/',
            component: index
           },
           {
               name: 'details',
               path: '/details/:id',
               component: details
           }
       ]
   }
   ```

3. 编程式导航

   ```js
   // 跳转到指定路径
   router.push('/login')
   // 命名的路由
   router.push({ name: 'user', params: { id: '5' }})
   router.replace()
   router.go()
   router.go(-1)
   ```

###### Hash模式和History模式

Vue Router通过hash和History API两种方式实现前端路由，更新视图但不重新请求页面”是前端路由原理的核心之一

- 表现形式区别

  Hash模式会带#

  Hash：<https://music.163.com/#/playlist?id=3102961863>， Histroy：<https://music.163.com/playlist/3102961863>

- 原理区别

  Hash模式默认使用[hash](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/location)模式模拟一个完整的URL，#本身以及后面的字符称为hash，#符号本来作用是加在URL中指示网页中的位置，虽然出现在URL中，但不会被包括在HTTP请求中。用来指导浏览器动作，对服务端无用，所以改变hash不回重新加载页面。

  通过onhashchange可以监听路径变化

  History模式使用[History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)，HTML5开始新增了pushState()和replaceState()方法使得可对浏览器历史记录栈进行修改

  ```js
  // stateObject title添加记录的标题 URL添加记录的URL
  window.history.pushState(stateObject, title, URL)
  window.history.replaceState(stateObject, title, URL)
  ```

  这两个方法有个共同的特点：当调用他们修改浏览器历史记录栈后，虽然当前URL改变了，但浏览器不会立即发送请求该URL。

  需要后台配置支持，在服务端应该除了静态资源外都返回单页应用的 index.html，如果后台没有正确配置，访问时会返回404。

- 源码分析

  当选择mode时，根据不同的类型创建不同的history对象

  ```js
  // 根据mode确定history实际的类并实例化
  switch (mode) {
    case 'history':
      this.history = new HTML5History(this, options.base)
      break
    case 'hash':
      this.history = new HashHistory(this, options.base, this.fallback)
      break
    case 'abstract':
      this.history = new AbstractHistory(this, options.base)
      break
    default:
      if (process.env.NODE_ENV !== 'production') {
        assert(false, `invalid mode: ${mode}`)
      }
  }
  ```

- History模式服务端配置

  - tomcat配置

    在项目目录下添加`WEB-INF`文件夹，`WEB-INF`中添加web.xml

    ```xml
    <!--web.xml-->
    <?xml version="1.0" encoding="UTF-8"?>
    <!--
     Licensed to the Apache Software Foundation (ASF) under one or more
      contributor license agreements.  See the NOTICE file distributed with
      this work for additional information regarding copyright ownership.
      The ASF licenses this file to You under the Apache License, Version 2.0
      (the "License"); you may not use this file except in compliance with
      the License.  You may obtain a copy of the License at
    
          http://www.apache.org/licenses/LICENSE-2.0
    
      Unless required by applicable law or agreed to in writing, software
      distributed under the License is distributed on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
      See the License for the specific language governing permissions and
      limitations under the License.
    -->
    <web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
                          http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
      version="3.1"
      metadata-complete="true">
    
      <display-name>Welcome to Tomcat</display-name>
      <error-page>
            <error-code>404</error-code>
            <location>/index.html</location>
      </error-page>
      <description>
         Welcome to Tomcat
      </description>
    
    </web-app>
    ```

  - nginx配置

    修改nginx配置文件，conf/nginx.conf

    ```json
    location / {
        root html;
        index index.html index.htm;
        #新添加内容
        #尝试读取$uri(当前请求的路径)，如果读取不到读取$uri/这个文件夹下的首页
        #如果都获取不到返回根目录中的 index.html
        try_files $uri $uri/ /index.html;
    }
    ```

  - nodeJs配置

    ```js
    const path = require('path')
    // 导入处理 history 模式的模块
    const history = require('connect-history-api-fallback')
    // 导入 express
    const express = require('express')
    
    const app = express()
    // 注册处理 history 模式的中间件
    app.use(history())
    // 处理静态资源的中间件，网站根目录 ../web
    app.use(express.static(path.join(__dirname, '../web')))
    
    // 开启服务器，端口是 3000
    app.listen(3000, () => {
      console.log('服务器开启，端口：3000')
    })
    ```

##### Vue Router实现原理

- 导入模块 注册插件（Vue.use传入函数时直接调用，传入对象时调用对象install方法）
- 创建路由对象 new VueRouter 参数是对象
- 创建Vue实例 加载router

```js
// 注册插件
// vue.use() 内部调用传入对象的install方法
vue.use(vueRouter)
// 实现VueRouter类 并且VueRouter类必须要有install方法 构造函数接收对象，接收路由规则
const router = new VueRouter({
    routes: [
        { name: 'home', path: '/', component: homeComponent }
    ]
})
// 创建vue实例，注册router对象
new Vue({
 router,
    render: h => h(App)
}).$mount('#app')
```

##### 实现思路

VueRouter类

- options 属性：记录构造函数中传入的对象
- data 属性： 是响应式对象 current属性记录当前路由地址 设置为响应式对象，因为路由地址改变对应组件自动更新
- routeMap 属性： 记录路由地址和组件的对应关系，路由规则解析到routeMap中
- Constructor(Options):VueRouter
- _install(Vue):void 静态方法 实现插件机制
- init():void 调用下面三个方法
- initEvent():void 注册pushState事件 用来监听浏览器历史的变化
- createRouteMap():void 初始化RouteMap  将初始化传入的对象保存到routeMap中
- initComponents(Vue):void 创建router-view和router-link组件

![image-20210226153507451](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210226153507451.png)

完整版 vs 运行时版本

```js
// 完整版本 需要编译器
new Vue({
  template: '<div>{{ hi }}</div>'
})

// 运行时版本 不需要编译器
new Vue({
  render (h) {
    return h('div', this.hi)
  }
})
```

vue-cli 创建的项目默认使用的是运行时版本的 Vue.js，需修改vue.config.js中的配置

```js
module.exports = {
 runtimeCompiler: true // 设置为 true 后你就可以在 Vue 组件中使用 template 选项
}
```

##### Vue Router history模式实现

```js
let _Vue = null
export default class VueRouter {
  static install (Vue) {
    // 1 判断当前插件是否被安装
    if (VueRouter.install.installed) {
      return
    }
    VueRouter.install.installed = true
    // 2 把Vue的构造函数记录在全局
    _Vue = Vue
    // 3 把创建Vue的实例传入的router对象注入到Vue实例 能获取到Vue实例的时候再注入
    // 所有组件都是vue实例 想让所有的实例共享一个成员 应该设置到构造函数原型上 使用混入
    // _Vue.prototype.$router = this.$options.router
    _Vue.mixin({
      beforeCreate () {
        // this就是vue实例 判断不是组件时再挂载，组件上没有router
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router
        }
      }
    })
  }

  constructor (options) {
    // 初始化属性
    this.options = options
    this.routeMap = {}
    // observable 设置为响应式
    this.data = _Vue.observable({
      current: '/' // 记录当前路由地址
    })
    this.init()
  }

  init () {
    this.createRouteMap()
    this.initComponent(_Vue)
    this.initEvent()
  }

  createRouteMap () {
    // 遍历所有的路由规则，把路由规则解析成键值对的形式存储到routeMap中
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component
    })
  }

  initComponent (Vue) {
    Vue.component('router-link', {
      props: {
        to: String
      },
      render (h) {
        return h(
          'a',
          {
            // DOM对象属性
            attrs: {
              href: this.to
            },
            on: {
              click: this.clickhander
            }
          },
          [this.$slots.default]
        )
      },
      methods: {
        clickhander (e) {
            // pushState改变地址栏内容 不糊发送请求
          history.pushState({}, '', this.to)
          this.$router.data.current = this.to
          e.preventDefault()
        }
      }
      // template:'<a :href='to'><slot></slot></a>'
    })
    const self = this
    Vue.component('router-view', {
      render (h) {
        // self.data.current
        // 当前路由地址对应的组件
        const cm = self.routeMap[self.data.current]
        return h(cm)
      }
    })
  }

  initEvent () {
    // 监听历史记录变化popstate 点击前进后退按钮
    window.addEventListener('popstate', () => {
      this.data.current = window.location.pathname
    })
  }
}
```

##### Vue Router hash模式实现

```js
let _vue = null
export default class VueRouter {
  static install (vue) {
    // 如果插件安装直接返回
    if (VueRouter.install.installed && _vue === vue) return
    VueRouter.install.installed = true

    // 记录vue构造函数
    _vue = vue

    // 把创建Vue的实例传入的router对象注入到Vue实例，能获取到Vue实例的时候再注入
    _vue.mixin({
      beforeCreate () {
        // 判断vue实例上是否有router对象
        if (this.$options.router) {
          // 把router对象注入到vue实例上
          _vue.prototype.$router = this.$options.router
          // 初始化插件时调用init
          this.$options.router.init()
        }
      }
    })
  }

  // 构造函数
  constructor (options) {
    this.options = options
    // 记录路径和组件的对应
    this.routeMap = {}
    // data需要设置为响应式 observable
    this.data = _vue.observable({
      current: '/' // 记录当前路由地址
    })
  }

  init () {
    this.initRouteMap()
    this.initComponent(_vue)
    this.initEvent()
  }

  // 遍历所有的路由规则，把路由规则解析成键值对的形式存储到routeMap中
  // routes => [{ name: '', path: '', component: }]
  initRouteMap () {
    this.options.routes.forEach((route) => {
      this.routeMap[route.path] = route.component
    })
  }

  // 生成 router-link 和 router-view 组件
  initComponent (Vue) {
    Vue.component('RouterLink', {
      props: {
        to: String
      },
      // 需要带编译器版本的 Vue.js
      // template: "<a :href='\"#\" + to'><slot></slot></a>"
      // 使用运行时版本的 Vue.js
      render (h) {
        return h(
          'a',
          {
            attrs: {
              href: '#' + this.to
            },
            on: {
              click: this.clickHandler
            }
          },
          [this.$slots.default]
        )
      },
      methods: {
        clickHandler (e) {
          window.location.hash = this.to
          e.preventDefault()
        }
      }
    })

    const self = this
    _vue.component('RouterView', {
      render (h) {
        const component = self.routeMap[self.data.current]
        return h(component)
      }
    })
  }

  // 监听历史记录变化
  initEvent () {
    window.addEventListener('hashchange', this.onHashChange.bind(this))
    window.addEventListener('load', this.onHashChange.bind(this))
  }

  onHashChange () {
    this.data.current = window.location.hash.substr(1) || '/'
  }
}
```
