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

#### 组件化

```js
import Vue from 'vue'
import App from './App.vue'

var app = new Vue({
  el: '#app',
  // 这里的 h 是 createElement 方法
  render: h => h(App)
})
```

这里的render函数传入为一个组件，在createElement方法中，最终会调用_createElement方法，判断tag

为component类型，通过createComponent方法创建vnode，定义在

`src/core/vdom/create-component.js`中，分析源码推荐只分析核心流程，这里组件渲染有3个关键步骤

##### 构造子类构造函数

组件通常为一普通对象

```js
import HelloWorld from './components/HelloWorld'

export default {
  name: 'app',
  components: {
    HelloWorld
  }
}
```

这里export为对象，所有createComponent代码逻辑会执行到baseCtor.extend(Ctor)，这里baseCtor是Vue

，initGlobalAPI中有定义`Vue.options._base = Vue`，Vue.extend函数作用是构造一个Vue的子类，使用原型继承的方式把一个纯对象转换为一个继承于Vue的构造器Sub并返回，然后扩展Sub对象的属性，如扩展options、添加全局API等，并且对配置中的props和computed做了初始化工作，最后对Sub构造函数做了缓存，避免多次执行Vue.extend的时候对同一个子组件重复构造，当我们去实例化Sub的时候，就会执行this_init方法

##### 安装组件钩子函数

```js
installComponentHooks(data)
```

在初始化一个Component类型的VNode的过程中实现了几个钩子函数；installCOmponentHooks过程是把componentVNodeHooks的钩子函数合并到data.hook中，在VNode执行patch的过程中执行相关的钩子函数

##### 实例化VNode

```js
const name = Ctor.options.name || tag
const vnode = new VNode(
  `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
  data, undefined, undefined, undefined, context,
  { Ctor, propsData, listeners, tag, children },
  asyncFactory
) // 组件的vnode没有children
return vnode
```

通过createComponent返回的组件vnode，接着会执行vm._update方法，进而执行patch函数将VNode转换为真正的DOM节点

#### patch

patch过程就是调用createElm创建元素节点

##### createComponent

createComponent函数首先判断vnode.data，如果vnode是一个组件VNode，并且得到`i`就是`init`钩子函数，不考虑keepAlive通过createComponentInstanceForVnode创建一个Vue实例，然后调用$mount方法挂载子组件

createComponentInstanceForVnode函数构造一个内部组件的参数，执行

```js
new vnode.componentOptions.Ctor(options) // 子组件的构造函数，继承于Vue的一个构造器Sub new Sub(options)
```

所以子组件的实例化是这个时机执行的，并且会执行实例的_init方法，在`src/core/instance/init.js`中

_init函数执行后，接着执行$mount方法，最终调用mountComponent方法，进而执行vm_render方法，执行完vm_render生成VNode后，接着执行vm_update去渲染VNode

_update关键代码，首先`vm._vnode=vnode`，这个vnode通过vm_render()返回的组件渲染VNode，vm._vnode和vm.$vnode是父子关系，vm._update.parent === vm.$parent

接着就是调用`__patch__`渲染VNode，完成组件的整个patch过程后，最后执行insert(parentElm, vnode.elm, refElm)完成组件的DOM插入，如果patch过程创建了子组件，DOM插入先子后父

#### 合并配置

new Vue两种调用，一种代码主动调用new Vue(options)实例化一个VUe对象，另一种组件过程中内部通过new Vue(options)实例化子组件

两种方式都会执行实例的_init(options)方法，首先执行merge options的逻辑，代码在`src/core/instance/init.js`中，不同场景对于options的合并逻辑不一样，并且传入的options值也有非常大的不同

```js
import Vue from 'vue'

let childComp = {
  template: '<div>{{msg}}</div>',
  created() {
    console.log('child created')
  },
  mounted() {
    console.log('child mounted')
  },
  data() {
    return {
      msg: 'Hello Vue'
    }
  }
}

Vue.mixin({
  created() {
    console.log('parent created')
  }
})

let app = new Vue({
  el: '#app',
  render: h => h(childComp)
})
```

##### 外部调用场景

当执行new Vue的时候，在执行this._init(options)的时候，会执行mergeOptions函数去合并options，实际就是合并Vue.options和options，Vue.options在initGlobal API(Vue)中定义，首先Vue.options创建一个空对象，遍历ASET_TYPES创建了components、directives、filter三个空对象，最后执行extend把一些内置组件扩展到Vueoptions.components上，Vue内置组件`<keep-alive><transiiton><transition-group>`

mergeOptions主要功能是把parent和child这两个对象根据合并策略，合并为一个新对象并返回

上面代码执行后，vm.$options的值如下

```js
vm.$options = {
  components: { },
  created: [
    function created() {
      console.log('parent created')
    }
  ],
  directives: { },
  filters: { },
  _base: function Vue(options) {
    // ...
  },
  el: "#app",
  render: function (h) {
    //...
  }
}
```

##### 组件场景

由于组件的构造函数通过Vue.extend继承自Vue，合并的过程执行initInternalComponent(vm, options)逻辑，代码`src/core/instance/init.js`中，initInternalComponent只是简单的对象赋值，并不涉及递归、合并策略等复杂逻辑

上面的代码执行完合并后

```js
vm.$options = {
  parent: Vue /*父Vue实例*/,
  propsData: undefined,
  _componentTag: undefined,
  _parentVnode: VNode /*父VNode实例*/,
  _renderChildren:undefined,
  __proto__: {
    components: { },
    directives: { },
    filters: { },
    _base: function Vue(options) {
        //...
    },
    _Ctor: {},
    created: [
      function created() {
        console.log('parent created')
      }, function created() {
        console.log('child created')
      }
    ],
    mounted: [
      function mounted() {
        console.log('child mounted')
      }
    ],
    data() {
       return {
         msg: 'Hello Vue'
       }
    },
    template: '<div>{{msg}}</div>'
  }
}
```

#### 生命周期

每个Vue实例在被创建前都要经历一系列的初始化过程，例如设置数据监听、编译模板、挂载实例到DOM、在数据变化时更新DOM等，同时在这个时期会运行生命周期钩子函数，可在特定场景下添加代码

执行生命周期函数都是调用callHook方法，在`src/core/instance/lifecycle`中

callHook根据传入的字符串hook，拿到vm.$options[hook]对应的回调函数数组，然后遍历执行，执行的时候把vm作为函数执行的上下文

Vue合并options时，各个阶段的生命周期函数也被合并到vm.$options中，并且是个数组，因此callback的功能是调用某个生命周期钩子注册的所有回调函数

##### beforeCreate & created

`beforeCreate`和`created` 都是实例化Vue的阶段，在_init方法中执行，定义在`src/core/instance/init.js`，

`beforeCreate`和`created`调用是在initState前后，initState作用是初始化props、data、methods、watch、computed属性，`beforeCreate`函数不能获取props、data的值，也不能访问methods中的函数

这两个钩子函数中不能访问DOM，和后台交互这两个钩子函数都可以，如果访问props和data等数据就需要created钩子函数

##### beforeMount & mounted

beforeMount发生在mount，也就是DOM挂载之前，调用时机在mountComponent，定义在`src/core/instance/lifecycle.js`中，在执行vm._render渲染VNode之前，执行了beforeMount函数，执行完vm._update把VNode patch到真实DOM后，执行了mounted函数，这里会判断vm.$vnode是否为null，如果为null则表明这不是一次组件的初始化过程，而是通过外部new Vue初始化过程
组件的VNode patch到DOM后，会执行invokeInsertHook函数，把insertedVnodeQueue里保存的钩子函数执行一遍，该函数后执行insert钩子函数，每个组件都是insert钩子函数中执行mounted钩子函数

##### beforeUpdate $ updated

数据更新的时候执行，beforeUpdate函数执行是在Watcher的before函数中，这里会判断组件是否mounted，updated函数执行是在flushSechedulerQueue函数调用的时候，定义在`src/core/observer/scheduler.js`

updatedQueue是更新了的watcher数组，那么在callUpdatedHooks函数中，对这些数组遍历，只有满足watcher为vm._watcher以及组件已经mounted，才会执行updated函数

##### beforeDestroy & destroyed

beforeDestroy执行时机是在$destroy函数执行最开始的地方，接着执行了一些列销毁动作，包括从parent的$children中删除自身，删除watcher，当前渲染的VNode执行销毁函数等，执行完毕后在调用destroy函数

在$destroy执行过程中，又会执行`vm.__patch__(vm._vnode, null)`触发子组件的销毁函数

##### activated & deactivated

#### 注册组件

##### 全局注册

全局注册使用`vm.component(tagName, options)`，它的定义过程发生在最开始初始化Vue的全局函数的时候，代码在`src/core/global-api/assets.js`中

Vue初始化了3个全局函数，并且type为component且definition是一个对象的话，通过`this._options._base.extend`，相当于Vue.extend把这个对象转换成一个继承于Vue的构造函数，最后通过`this.options[type + 's'][id] = definition`把它挂载到`Vue.options.components`上

接着在组件实例化过程中执行mergeOptions逻辑，把`Sub.options.components`合并到`vm.$options.components`上；然后在创建vnode的过程中，会执行_createElement方法，这里有一个判断逻辑

`isDef(Ctor = resolveAsset(context.$options, 'components', tag))`，resolveAsset首先拿到assets，然后拿到assets[id]，顺序是先直接拿id，拿不到在编程驼峰的方式拿，如果还不存在驼峰基础上把首字母变成大写，所以Vue.component(id, definition) 全局注册组件时，id可以是连字符、驼峰或首字母大写的形式

所以调用resolveAsset会拿到`vm.$options.components[tag]`，这样就可以在resolveAsset的时候拿到这个组件的构造函数，即作为createComponent的钩子函数

##### 局部注册

在组件内使用components选项做组件的局部注册，在组件的Vue的实例化阶段有一个合并option的逻辑，会把components合并到`vm.$options.components`上，这样就可以在resolveAsset的时候拿到这个组件的构造函数，并作为createComponent的钩子的参数

局部注册和全局注册不同的是，全局注册会扩展到Vue.option下，所以在所有组件创建的时候，都会从全局的Vue.options.conponents扩展到当前组件的vm.$options.components下，这就是全局注册组件能被任意使用的原因。

#### 异步组件

减少首屏加载时体积，非首屏组件设计为异步组件，按需加载，Vue也原生支持异步组件的能力

```js
Vue.component('async-example', (resolve, reject) => {
	// 这个特殊的require语法告诉webpack 自动将编译后的代码分割成不同的块 这些块通过Ajax请求自动下载
	require(['./my-async-component'], resolve)
})
```

示例中，Vue注册的组件不在是一个对象，而是一个工厂函数

组件注册逻辑，由于组件定义并不是一个普通函数，所以不会执行Vue.extend的逻辑把它变成一哥组件的构造函数，但是它仍然可以执行到createComponent函数，createComponent函数由于传入的Ctor是一个函数，所以后执行resolveAsyncComponent(asyncFactory, baseCtor，context)方法，定义在`src/core/vdom/helpers/resolve-async-component.js`中

resolveAsyncComponent实现了三种异步组件的创建方式，除了上面示例，还有两种，一种是Promise创建组件

```js
Vue.component(
  'async-webpack-example',
  // 该 `import` 函数返回一个 `Promise` 对象。
  () => import('./my-async-component')
)
```

另一种是高级异步组件

```js
const AsyncComp = () => ({
  // 需要加载的组件。应当是一个 Promise
  component: import('./MyComp.vue'),
  // 加载中应当渲染的组件
  loading: LoadingComp,
  // 出错时渲染的组件
  error: ErrorComp,
  // 渲染加载中组件前的等待时间。默认：200ms。
  delay: 200,
  // 最长等待时间。超出此时间则渲染错误组件。默认：Infinity
  timeout: 3000
})
Vue.component('async-example', AsyncComp)
```

##### 普通函数异步组件

针对普通函数，if判断忽略，对于factory.contexts的判断，是考虑多个地方同时初始化一个异步组件，那么它的实际加载只有一次，接着进入实际加载逻辑，定义了forceRender、resolve和reject函数，resolve和reject函数用once做一层封装，利用闭包和一个标志位保证了它包装的函数只会执行一次

接着执行const res = factory(resolve, reject)逻辑，这块是执行组件的工厂函数，通常会先发送请求去加载我们的异步组件的JS文件，拿到组件定义的res后，执行resolve(res)逻辑，它会先执行factory.resolved = ensureCtor(res, baseCtor)，目的是为了保证能找到异步组件JS定义的组件对象，并判断如果是普通对象，则调用Vue.extend转换为组件的构造函数

resolve最后判断sync，如果sync为false，就会执行forceRender函数，它会遍历factory.contexts，拿到每一个调用异步组件的实例vm，执行vm.$forceUpdate()方法，$forceUpdate就是调用渲染watcher的update方法，让渲染watcher对应的回调函数执行，触发组件重新渲染，Vue是数据驱动，但异步组件加载没有数据变化，所以执行$forceUpdate强制组件重新渲染

##### Promise异步组件

webpack2+ 支持异步加载语法糖：`() => import('./my-async-component')`，执行完res = factory(resolve, reject)，返回的值是`import('./my-async-component')`，是一个Promise对象

##### 高级异步组件

由于异步组件加载需要动态加载JS，有一定网络延时，也有加载失败的情况，所以需要设置loading组件和error组件，在适当的时机渲染

```js
const AsyncComp = () => ({
  // 需要加载的组件。应当是一个 Promise
  component: import('./MyComp.vue'),
  // 加载中应当渲染的组件
  loading: LoadingComp,
  // 出错时渲染的组件
  error: ErrorComp,
  // 渲染加载中组件前的等待时间。默认：200ms。
  delay: 200,
  // 最长等待时间。超出此时间则渲染错误组件。默认：Infinity
  timeout: 3000
})
Vue.component('async-example', AsyncComp)
```

高级异步组件初始化逻辑与普通异步组件一样，执行res.component.then(resolve, reject)，异步组件加载成功，执行resolve，失败执行reject，由于异步组件加载是异步过程，接着同步执行了如下逻辑：

先判断res.error是否定义了error组件，如果有的话赋值给factory.errorComp，res.loading的值赋值给factory.loadingComp，如果设置res.delay且为0，则设置factory.loading = true，否则延时delay，最后判断res.timout组件没有加载成功，执行reject

在resolveAsyncComponent有一段逻辑

```js
sync = false
return factory.loading
  ? factory.loadingComp
  : factory.resolved
```

如果delay设置为0，则直接渲染loading组件，否则延时delay执行forceRender，那么又会再执行一次resolveAsyncComponent，这时候会出现几种情况：

###### 异步组件加载失败

异步组件加载失败，这时候会把factory.error设置为true，同时执行forceRender再次执行到resolveAsyncComponent，这个时候就返回factory.errorComp直接渲染error组件

###### 异步组件加载成功

当异步组件加载成功，会执行resolve函数，把加载结果缓存到factory.resolved中，这时候sync已经为false，则执行forceRender再次执行到resolveAsyncComponent，这个时候返回factory.resolved，渲染成功的组件

###### 异步组件加载中

异步组件加载中，执行以下代码

```js
if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
  return factory.loadingComp
}
```

返回factory.loadingComp，渲染loading组件

###### 异步组件加载超时

超时走到reject逻辑，之后逻辑和加载失败一样，渲染error组件

##### 异步组件patch

回到createComponent逻辑，如果第一次执行resolveAsyncComponent，除非使用高级异步组件0 delay去创建一个loading组件，否则返回都为undefined，接着通过createAsyncPlaceholder创建一个注释节点作为占位符，定义在`src/core/vdom/helpers/resolve-async-components.js`中

实际就是创建一个占位的注释VNode，同时把asyncFactory和asyncMeta赋值给当前vnode

当执行forceRender时，会触发组件的重新渲染，会再一次执行resolveAsyncComponent，这时候就会根据不同情况，可能返回loading、error或成功加载的异步组件，返回值部位undefined，因此会走正常的render、patch过程，与组件的第一次渲染过程不同，这个时候是存在新旧vnode的

异步组件实现的本质是2次渲染，除了0 delay的高级异步组件第一次直接渲染laoding组件外，其它都是第一次渲染生成一个注释节点，当异步组件获取成功后，再通过forcerender强制重新渲染