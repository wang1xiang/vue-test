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

#### render

私有方法，把实例渲染成虚拟Node，定义在`src/core/instance/render.js`，这里关键就是render方法的调用

Vue官网中render函数第一个参数为createElement

```js
<div id="app">
    {{message}}
</div>
// 用render函数
render (createElement) {
	return createElement('div',{
		attrs: {
			id: 'app'
        }
    }, this.message)
}
// 再看_render函数中的render方法的调用，render函数中的createElement就是vm.$createElement方法
vnode = render.call(vm._renderProxy, vm.$createElement)
export function initRender (vm: Component) {
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
}
vm._c是模板编译成的render函数使用，vm.$createElement是用户手写render方法使用
```

vm._render返回vnode，是虚拟Node

#### Virtual DOM

真正的DOM很复杂，当频繁更新时，会产生性能问题，Virtual DOM是用一个原生的JS对象去描述一个DOM节点，Vue中Virtual DOM使用VNode这个Class描述，定义在`src/core/vdom/vnode.js`中，Virtual DOM核心定义就是几个关键属性，标签名、数据、子节点、键值等，其他属性都是用来扩展VNode的灵活性以及实现特殊feature，由于VNode只是映射真实DOM的渲染，不需要包含操作DOM的方法，因此很轻量

VNode除了定于，映射到真实DOM需经历VNode的create、diff、patch等

#### createElement

Vue使用createElement方法创建VNode，定义在`src/core/vdom/create-elemenet.js`

createElement方法是对_createElement的封装，传入参数更加灵活，处理完这些参数后，在调用真正创建VNode的_createElement

_createElement五个参数，context表示VNode上下文，tag表示标签，data表示VNode的数据，children表示当前VNode的子节点，normalizationType表示子节点规范的类型，类型不同规范的方法也就不一样，只要参考render函数的编译生成还是用户手写的

##### children的规范化

Virtual DOM是树状结构，每个节点都是VNode类型，_createElement传入的children为任意类型，需要规范为VNode类型，根据normalizationType的不同，调用normalizeChildren(children)和simpleNormalize Children(children)方法，定义在`src/core/vdom/helpers/normalzie-children.js`中

simpleNormalizeChildren方法调用render函数编译生成的，理论上编译生成的children都是VNode类型，但是functional component函数式组件返回的是数组而不是一个根节点，所以需要调用concat方法

normalezeChildren方法有两种调用，一个是用户手写的render函数，当children只有一个节点，Vue.js允许将children携程基础类型，这种情况会调用createTextVNode创建文本节点的VNode；另一个是当编译slot、v-for的时候产生嵌套数组，会调用normalizeArrayChlidren方法

normalizeArrayChlidren主要逻辑是遍历children，获取每个节点c，判断类型为数组则递归调用，为基础类型通过createTextVNode转换为VNode类型；否则就已经是VNode类型，如果children是一个列表还存在嵌套的情况，则根据nestedIndex去更新key

##### VNode的创建

规范化children后，接下来创建VNode实例，对tag进行判断，如果为string类型，接着判断如果是内置的一些节点，则直接创建一个普通VNode，如果是已注册的组件名，则通过createComponent创建组件类型的VNode，否则创建一个未知的Vnode

接下来就是要把这个 VNode 渲染成一个真实的 DOM 并渲染出来，这个过程是通过 `vm._update` 完成的

#### update

Vue的_update是实例的私有方法，调用时机有两个，一个是首次渲染，一个是数据更新；__update作用是VNode渲染成真实DOM，定义在`src/core/instance/lifecycle.js`中

_update的核心是调用vm._patch_方法，此方法在不同平台定义不同，在web平台定义在`src/platforms/web/runtime/index.js`中，

```js
Vue.prototype.__patch__ = inBrowser ? patch : noop
// 服务端渲染没有真实的DOM环境，不需要将VNode转换为DOM，因此为空函数
```

patch方法的定义是调用createPatchFunctino方法的返回值，包含nodeOps和mudules参数，nodeOps封装一系列DOM操作的方法，modules定义一些模块钩子函数的实现

cteatePatchFunction内部调用一系列辅助方法，最终返回patch方法，赋值给vm._update函数调用的vm._patch_

Vue相关代码分散到各个目录，因为patch方法和平台相关，在web和weex环境中，它们把虚拟DOM映射到“平台DOM”的方法是不同的，并且对DOM包括的属性模块创建和更新也不尽相同，因此每个平台都有nodeOps和modules，统一托管在`src/platform`下；而不同的patch的主逻辑是相同的，所以这不部分代码托管到core目录下，差异化通过参数来区别

patch方法本身有四个参数，oldValue表示旧的VNode节点，不必须，vnode表示执行_render后返回的VNode节点，hydrating表示是否服务端渲染，removeOnly是给transition-group使用

patch主逻辑：首次渲染时，执行patch函数，传入的$el为id为app的DOM对象，vm.$el的赋值在mountComponent函数中，vnode对应的调用rnder函数的返回值，hydrating和removeOnly都为false；传入的oldValue为DOM contailer，所以isRealElemetn为true，调用emptyNodeAt方法转换为VNode对象，在调用createElm方法，作用是通过虚拟节点创建真实的DOM并插入它的父节点中，createComponent方法创建子组件，接下来判断vnode是否包含tag，如果包含，会简单的对tag的合法性在非生产环境下做校验，看是否是一个合法标签；然后调用平台DOM的操作创建一个占位符元素；接着调用createChildren方法创建子元素，调用invokeCreateHooks方法执行所有的create的钩子并把vnode push到insertedVnodeQueue中，最后insert方法把DOM插入到父节点，整个vnode树节点的插入时先子后父，insert方法调用一些nodeOps把子节点插入到父结点中，其实就是调用原生DOM的API进行DOM操作



