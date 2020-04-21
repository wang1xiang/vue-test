### 准备工作

#### 认识Flow

Flow是js静态类型检查工具，vue源码利用Flow做静态类型检查

##### 为什么用Flow

js动态类型语言，类型检查发展趋势，在编译期尽早发现bug，不影响代码运行，使编写js有强类型语言的体验

##### Flow的工作方式

类型检查两种方式：

- 类型推断：通过变量的使用上下文推断变量类型，更具推断来检查类型

  ```js
  // Flow
  function split(str) {
  	return str.split('')
  }
  
  split(11)
  // Flow检查报错，split期待的参数使字符串，而不是数字
  ```

  

- 类型注释：事先注释好期待的类型，Flow会基于这些注释来判断

  ```js
  // 类型推断不需要编写类型注释 特定场景需要类型注释提供更明确的检查
  function add(x: number, y: number): number {
    return x + y
  }
  
  add('Hello', 11)
  ```

  

##### Flow在Vue.js源码的应用

第三方库或自定义类型Flow并不认识，检查时报错，因此FLow提出libdef用来识别，在Vue.js主目录下有.flowconfig文件，这里的[libs]配置的是flow，表示指定的库定义都在flow文件夹内，阅读源码时，遇到某个类型可以在这里查看数据结构的定义

#### Vue.js源码目录设计

vue.js源码目录如下：

```js
src
├── compiler        # 编译相关 
├── core            # 核心代码 
├── platforms       # 不同平台的支持
├── server          # 服务端渲染
├── sfc             # .vue 文件解析
├── shared          # 共享代码
```

##### compiler

包含Vue.js所有编译相关的代码，将模板解析为ast语法树，ast语法树优化，代码生成等

编译工作推荐在构建时做（借助webPack、vue-loader等辅助插件）

##### core

Vue.js核心代码，包括内置组件、全局API封装、Vue实例化、观察者、虚拟DOM、工具函数等

##### platform

Vue.js是跨平台的MVVM框架，可在web和native客户端上，platform是Vue.js的入口，2个目录代表2个主要入口，分别打包成运行在web和weex上的Vue.js

##### server

服务端渲染相关逻辑，主要是泡在服务端的node.js

##### sfc

将单文件组件解析册成javaScript对象

##### shared

浏览器端和服务端所共享的工具方法

#### Vue.js源码构建

基于Rollup构建，构建相关配置都在scripts目录下

##### 构建脚本

script执行脚本，Vue.js构建脚本分别为浏览器端服务器端和weex端

##### 构建过程

构建项目入口在`script/build.js`中，从配置文件取文件，通过命令行参数对构建配置做过滤，配置文件在

```js
let builds = require('./config').getAllBuilds()
// ......
build(builds)
```

`script/config.js`中

```js
const builds = {
  'web-runtime-cjs': {
    entry: resolve('web/entry-runtime.js'),// 项目构建的入口文件
    dest: resolve('dist/vue.runtime.common.js'), //构建后的js文件地址
    format: 'cjs', // 构建的格式 cjs表示构建的文件遵循CommonJS规范，es遵循ES Module，umd遵循UMD
    banner // 
  },
// ......
}
```

这里的resolve函数，执行完成base为web，在`script/alias`中有对别名的配置，经过`Rollup`打包后，在dist下生成`vue.runtime.common.js`

##### Runtime only VS Runtime + Compiler

vue-cli初始化时选择， `Runtime only`借助webpack的vue-loader将.vue文件打包为`JavaScript`，编译阶段打包，只包含运行时Vue.js代码，体积更小；`Runtime+Compiler`代码没有预编译，但又使用Vue的`template`时，需要在客户端编译模板

```js
// 需要编译器的版本
new Vue({
  template: '<div>{{ hi }}</div>'
})

// 这种情况不需要
new Vue({
  render (h) {
    return h('div', this.hi)
  }
})
```

最终渲染都通过render函数，如果写template属性，需要编译成render函数，编译过程发生运行时，需要带有编译器的版本，通常推荐使用`Runtime-Only`的Vue.js

#### 从入口开始

分析`Runtime + Compiler`构建的Vue.js，我们代码中执行`import Vue from 'vue'`时，从这个入口`src/platforms/web/entry-runtime-with-compiler.js`执行代码初始化Vue。

##### Vue入口

上面js中可以找到Vue的来源：`import Vue from './runtime/index'`，这里关键代码`import Vue from 'core/index'`，之后的代码都是Vue这个对象的扩展，这就是真正初始化Vue的地方

2处关键代码，`import Vue from './instance/index'` 和 `initGlobalAPI(Vue)`，初始化全局 Vue API，在index.js中看到Vue的创建，实际就是Function实现的Class，我们只能通过new Vue去实例化

##### Vue为何不用ES6的Class实现

在上面的js中，有很多`xxxMixin`函数调用，传入vue为参数，它们的作用是给Vue的propertype上扩展方法，Vue按功能把这些拓展分散到多个模块中实现，不是在一个模块实现，所以Class难以实现，非常方便代码的维护和管理

##### initGlobalAPI

Vue在初始化时，除了原型上拓展方法，还对vue这个对象本身拓展全局的静态方法，定义在`src/core/global-api/index.js`中，Vue官网中全局API都可以在这找到

### 数据驱动

#### new Vue发生了什么

Vue是一个类，所以只能通过new关键字来初始化，然后调用`src/core/instance/init.js`下的this._init方法，初始化时：合并配置、初始化生命周期、初始化事件中心、初始化渲染、初始化data、props、computed、watcher等等，把不同的功能逻辑拆成一些单独的函数执行，主线逻辑一目了然 

#### Vue实例挂载的实现

初始化时如果有el属性，则调用`vm.$mount`方法挂在vm，挂载的目标是把模板渲染成DOM，`$mount`在多个文件中有定义，几个入口文件，因为`$mount`和平台、构建方式相关。分析带compiler版本的`$mount`实现，抛开webpack的vue-loader在纯前端浏览器环境分析vue的工作原理

在`src/platform/web/entry-runtime-with-compiler.js`中的`$mount`，首先缓存原型上的`$mount`方法，再重新定义，对el进行限制，接下来如果没有定义render方法，则会把el或者template转换成render方法。所有Vue的组件渲染最终都需要render方法，就是Vue的“在线编译”的过程，调用`compileToFunctions`实现，最终调用原型上的`$mount`方法挂载

原型上的`$mount`为了复用定义在`src/platform/web/runtime/index.js`中，直接可以被runtime only版本的Vue直接使用，`$mount`两个参数，第一个el表示挂载对象string或DOM对象，第二个参数和服务端渲染相关

`$mount`实际调用mountComponent方法，mountComponent核心先实例化一个渲染`Watcher`，在回调中使用updateComponent方法，在此方法中调用`vm._render`生成虚拟Node，最终调用`vm._update`更新DOM，函数最后判断为根节点的时候设置`vm._isMounted`为true，表示实例已经挂载，同时执行mounted钩子函数。`vm.$node`表示vue实例的父虚拟Node，为Null时表示根Vue的实例

`Watcher`两个作用，一是初始化时候执行，另一个当vm实例监测的数据发生变化时执行

