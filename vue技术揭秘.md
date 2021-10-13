`beforeMount () {
  const update = this._update
  this._update = (vnode, hydrating) => {
    // force removing pass
    this.__patch__(
      this._vnode,
      this.kept,
      false, // hydrating
      true // removeOnly (!important, avoids unnecessary moves)
    )
    this._vnode = this.kept
    update.call(this, vnode, hydrating)
  }
}explicitEnterDuration` 表示 enter 动画执行的时间。

`expectsCSS` 表示过渡动画是受 CSS 的影响。

`cb` 定义的是过渡完成执行的回调函数。准备工作

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

#### 深入响应式原理

Vue数据驱动除了数据渲染DOM之外，还有一个很重要的体现就是数据得变更会触发DOM的变化

##### 响应式对象

Vue.js实现响应式的核心是利用ES5的`Object.defineProperty`，所以不支持IE8及以下浏览器

###### Object.defineProperty

在对象上定义属性或修改一个对象的现有属性，并返回这个对象

```js
Object.defineProperty(obj, prop, descriptor)
// obj 要定义属性的对象
// prop 定义或修改的属性的名称
// descriptor 将被定义或修改的属性描述符
```

descriptot有很多键值，比较重要的是get和set，get给属性提供getter方法，访问该属性时触发getter方法，set是给属性提供一个setter，对属性修改时触发；有了getter和setter，就可以把这个对象称为响应式对象，getter做依赖收集，setter做派发更新

###### initState

初始化执行_init方法的时候，会执行initState(vm)方法，定义在`src/core/instance/state.js`中，initState方法是对props、methods、data、computed和watcher等属性做了初始化操作

- initProps

  props初始化遍历定义的props配置，遍历的过程主要做两件事：一是调用defineReactive方法把每个prop定义的值变为响应式，可以通过vm._props.xxx访问到定义props中对应的属性，另一个通过proxy把vm,_props.xxx的访问代理到vm.xxx上

- initData

  data初始化过程，一是对定义data函数返回对象的遍历，通过proxy把每一个值vm._data.xxx代理到vm.xxx上，另一个是调用observe方法观测整个data的变化，把data变成响应式，可以通过vm._data.xxx访问到定义data返回函数中对应的属性

###### proxy

代理的作用是把props和data上的属性代理到vm实例上，proxy通过`Object.defineProperty`把`target[sourceKey][key]`的读写变成了对`target[key]`的读写，所以props对vm._props.xx的读写变成了vm.xxx的读写；同理对于data而言，对vm._data.xxx的读写变成了vm.xxx的读写

###### observe

observe的功能是用来监测数据的变化，定义在`src/core/observer/index.js`中

obsere的作用是给非VNode对象类型添加一个Observer，如果已经添加则直接返回，否则在满足一定条件下实例化一个Observer对象实例

###### Observer

Observer是一个类，作用是给对象的属性添加getter和setter，用于依赖收集和派发更新

Observer的构造函数逻辑很简单，首先实例化Dep对象，接着通过执行def函数把自身实例添加到数据对象value的`__ob__`上，def定义在`src/core/util/lang.js`中

def函数是一个非常简单的Object.defineProperty的封装，这就是为什么开发中输出data上对象类型的数据，会发现多一个`__ob__`属性

回到Obsever的构造函数，接下来会对value做判断，对于数组会调用observeArray方法，否则对纯对象调用walk方法，observerArray是遍历数组再次调用observe方法，而walk方法发是遍历对象的key调用defineReactive方法

###### defineReactive

defineReactive功能是定义一个响应式对象，给对象动态添加getter和setter，定义在`src/core/observer/index.js`中，defineReactive函数最开始初始化Dep对象的实例，接着拿到obj的属性描述符，然后对子对象递归调用observe方法，保证无论obj结构多复杂，它的所有子属性也能变成响应式的对象，最后利用Object.defineProperty去给obj的属性key添加getter和setter

##### 依赖收集

getter部分逻辑主要关注两个地方，一个是`const dep = new Dep()`实例化一个Dep的实例，另一个是在get函数中通过dep.depend做依赖收集，这里还有对childOb判断逻辑

###### Dep

Dep是整个getter依赖收集的核心，定义在`src/core/observer/dep.js`中

Dep是一个class，定义了一些属性和方法，要注意的是他有一个静态属性target，这是一个全局唯一Watcher，这是一个非常巧妙的设计，因为在同一时间只能有一个全局的Watcher被计算，另外它的自身属性subs也是Watcher的数组

Dep实际是对Watcher的一种管理，脱离Watcher单独存在没有意义，Watcher定义在`src/core/observer/watcher.js`中

###### Watcher

Watcher是一个class，在它的构造函数中定义了一些和Dep相关的属性

```js
this.deps = []
this.newDeps = []
this.depIds = new Set()
this.newDepIds = new Set()
```

this.deps和this.newDeps表示Watcher实例持有的Dep实例的数组，this.depIds和this.newDepIds分别代表this.deps和this.newDeps的id

Watcher还定义了一些原型的方法，和依赖收集相关的有get、addDep和cleanupDeps方法

###### 过程分析

当对数据对象的访问会触发他们的getter方法，那么这些对象什么时候被访问？Vue的mount过程是通过mountComponent函数，其中有一段重要逻辑

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
new Watcher(vm, updateComponent, noop, {
  before () {
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate')
    }
  }
}, true /* isRenderWatcher */)
```

当我们实例化一个渲染watcher的时候，首先进入watcher的构造函数逻辑，然后会执行它的this.get()方法，进入get函数，首先会执行`pushTarget(this)`

```js
export function pushTarget (_target: Watcher) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}
```

实际就是把Dep.target赋值给当前的渲染watcher并压栈，接着又执行

```js
value = this.getter.call(vm, vm)
```

this.getter对应就是updateComponent函数，实际上就是在执行

```js
vm._update(vm._render(), hydrating)
```

他会先执行vm_render方法，生成渲染VNode，并且这个过程会对vm上的数据访问，这个时候就触发了数据对象的getter

每个对象值得getter都持有一个dep，在触发getter的时候会调用dep.depend方法，也就会执行Dep.target.addDep(this)

刚才提到这时候Dep.target已经被渲染为渲染wather，那么就执行到addDep方法，这里保证同一数据不回被添加多次，接着执行dep.addSub(this)，就会把当前的watcher订阅到这个数据持有的dep的subs中，这个目的是为了后续数据变化能通知道哪些subs做准备

所以在vm_render()过程中，会触发所有数据的getter，这样就完成了一个依赖收集的过程。此时还有几个逻辑要执行，首先

```js
if (this.deep) {
  traverse(value)
}
```

递归去访问value，触发它所有子项的getter，接着

```js
popTarget()
```

实际上就是把Dep.target恢复成上一个状态，因为当前vm的数据依赖收集已经完成，那么对应的Dep.target也需要改变，最后执行

```js
this.cleanupDeps()
```

依赖清空，每次数据更新都会重新render，vm.render()方法再次执行，并触发数据的getters，所以Watcher在构造函数中会初始化2个Dep实例数组，newDeps表示新添加的Dep实例数组，而deps表示上一次添加的Dep实例数组

在执行cleanupDeps函数时，会首先遍历deps，移除对dep.subs数组中Watcher的订阅，然后把newDepIds和depIds交换，newDeps和deps交换，并把newDepIds和newDeps清空

##### 派发更新

收集依赖目的是为了当响应式数据变化时，触发他们的setter的时候，能知道应该通知哪些订阅者去做相应的逻辑处理，这个过程叫派发更新，

###### 过程分析

当我们在组件中对响应式数据做了修改，就会触发setter逻辑，最后调用dep.notify()方法，遍历所有的subs，也急速hiWatcher的实例数组，然后调用每一个watcher的update方法，这里对不同状态的数据执行不同逻辑，对一般组件数据更新，会走到一个queue Watcher(this)的逻辑，并不是每次数据改变都触发watcher的回调，而是把这些watcher先添加到一个队列里，然后执行nextTick后执行flushSchedulerQueue

细节：首先用has对象保证同一个watcher只添加一次，接着对flushing做判断，最后通过waiting保证对nextTick(flushSchedulerQueue)的调用逻辑只有一次

接着时flushSchedulerQueue的实现，定义在`src/core/observer/scheduler.js`中，重要点

- 队列排序

  queue,sort((a, b) => a.id - b.id) 对队列做了从小到大的排序，只要确保以下几点

  1. 组件的更新由父到子，watcher创建先父后子
  2. 用户的自定义watcher要优于渲染watcher执行，因为用户自定义watcher是在渲染watcher之前
  3. 如果一个父组件的watcher执行期间被销毁，那么它对应的watcher执行都可以被跳过，所以父组件的watcher应该先执行

- 队列遍历

  对queue排序后，接着就要对他做遍历，拿到对应的watcher，执行watcher.run()方法；这时候flushing为true，就要执行else的逻辑，然后从后往前找，找到第一个待插入watcher的id比当前队列的watcher的id大的位置，把watcher按照id的插入到队列中

- 状态恢复

  这个过程执行resetSchedulerState函数，就是把这些控制流程状态的变量恢复到初始值，把watcher队列清空

  watcher.run()逻辑定义在`src/core/observer/watcher.js`中，run函数实际上就是执行this.getAndInvoke方法，并传入watcher的回调函数。

  getAndInvoke函数通过this.get()得到它当前的值，然后做判断，如果满足新旧值不等，新值是对象类型，deep模式任何一个条件，则执行watcher的回调

  所以对于渲染watcher而言，它在执行this.get()方法求值的时候，会执行getter方法，所以这就是当我们去修改组件相关的响应式数据的时候，会触发组件重新渲染的原因，接着会执行patch的过程，但是和首次渲染有所不同

##### nextTick

###### JS运行机制

js执行是单线程，基于事件循环的，事件循环步骤：

1. 所有同步任务都在主线程上执行，形成一个执行栈(execution context stack)
2. 主线程之外，还存在一个“任务队列”（task queue），只要异步任务有了运行结果，就在“任务队列”之中放置一个事件
3. 一旦“执行栈”中所有同步任务执行完毕，系统就会读取“任务队列“，看看里面有哪些事件。那些对应的异步任务，于是结束等待状态，进入执行栈，开始执行
4. 主线程不断重复上面的第三步

主线程的执行过程是一个tick，而所有异步结果都是通过”任务队列“来调度，消息队列中存放的是一个个的任务（task），规定task分为两类，分别是macro task和micro task，并且每个macro task结束后，都要清空所有的micro task

常见的macro task有setTimeout、MessaeChannel、postMessage、setImmediate，常见的micro task有MutationObsever和Promise.then

###### Vue的实现

next-tick.js申明了microTimerFunc和macroTimerFunc两个变量，对应macro task的实现，优先检测是否支持原生setImmediate，不支持的话再去检测是否支持原生的MessageChannel，如果也不支持会降级为setTimeout 0；而对于micro task的实现，检测浏览器是否原生支持Promise，不支持的话直接指向macro task的实现

next-tick.js向外暴露两个函数，首先是nextTick，执行逻辑，把传入的回调函数cb压入callbacks数组，最后一次性根据useMacroTask条件执行macroTimerFunc或者microTimerFunc，而它们都会在下一次tick执行flushCallbacks（对callbacks遍历，然后执行相应的回调函数）

这里使用callbacks而不是直接在nextTick中执行回调函数的原因是保证同一个tick内多次执行nextTick，不会开启多个异步任务，而把这些异步任务都压成一个同步任务，在下一个tick执行完毕

next-tick.js还对外暴露了withMacroTask函数，它是对函数做一层包装，确保函数执行过程中对数据任意的修改，触发变化执行nextTick的时候强制走macroTimerFunc，比如对一些DOM交互事件，如v-on绑定的事件回调函数的处理，会强制走macro task

所以数据的变化到DOM的重新渲染是一个异步过程，会发生在下一个tick，这就是当我们依赖数据变化后的DOM变化，就必须在nextTick后执行

##### 检测变化的注意事项

###### 对象添加属性

对于使用Object.defineProperty实现响应式的对象，当我们去给这个对象添加新的属性的时候，是不够触发它的setter，这时候可以使用Vue.set，如果是数组，则通过splice去添加进数组，接着判断key是否存在与target中，存在则直接赋值返回，因为已经是响应式了，接着在获取到`target.__ob__`并赋值给ob，它是Observer的构造函数执行的时候初始化的，并且Observer是一个实例，如果不存在，则说明targer不是响应式对象，则直接赋值并返回，最后通过defineReactive(ob.value, key, val)把新添加的属性变成响应式对象，再通过ob.dep.notify()手动触发依赖通知，在getter中判断childOb，并调用了childOb.dep.depend()收集依赖，这就是执行Vue.set的时候通过ob.dep.notify()能够通知到watcher，从而让添加新的属性到对象也可以检测到变化

###### 数组

Vue不能检测到以下变动的数组

1. `vm.items[indexOfItem] = newValue`，通过索引直接设置一个值
2. 修改数组的长度，`vm.items.length = newLength`

对于第一种情况，使用`Vue.set(items, indexOfItem, newValue)`，对于第二种，可以使用vm.items.splice(newLength)

splice如何将添加的对象变成响应式呢？

在通过observe方法去观察对象的时候会实例化Observer，在它的构造函数中是专门对数组做了处理，通过hasProto判断对象中是否存在`__proto__`，如果存在argument指向protoAugment，否则指向copyAugment，

protoAugment方法直接把`target.__proto__`原型修改为src，而copyAument方法是遍历keys，通过def，也就是Object.defineProperty去定义它自身的属性值，对于大部分浏览器都会走到protoAugment，那么它实际上就把value的原型指向了arrayMethods

arrayMethods首先继承了Array，然后对数组所有能改变自身的方法，如push、pop等方法进行重写，重写后对增加数组长度的3个方法push、unshift、splice做了判断，获取到插入的值，然后把新添加的值变成一个响应式对象，并通过ob.dep.notify()手动触发依赖通知

##### 计算属性VS侦听属性

###### computed

计算属性初始化在Vue实例初始化阶段的initState函数中，执行了`if(opts.computed) initComputed(vm, opts.computed)`

`initComputed`首先创建vm._computedWatchers为一个空对象，接着对computed做遍历，拿到计算属性的每一个userDef，然后获取userDef对应的getter函数，拿不到则报错，接着为每一个getter创建一个watcher，最后判断key不是vm的属性，则调用defineComputed(vm, key, userDef)

defineComputed利用Object.defineProperty给计算属性对应的key添加getter和setter，setter通常是计算属性的一个对象，并且有set方法的时候才有，重点关注getter，缓存的配置先忽略，最终getter对应的是createComputedGetter(key)的返回值

`createComputedGetter` 返回一个函数 `computedGetter`，就是计算属性对应的getter

computed watcher和watcher区别

```js
var vm = new Vue({
  data: {
    firstName: 'Foo',
    lastName: 'Bar'
  },
  computed: {
    fullName: function () {
      return this.firstName + ' ' + this.lastName
    }
  }
})
```

初始化computed watcher实例的时候，并不会立刻求值，同时持有dep实例，然后当render函数执行到this.fuilName的时候，就触发了计算属性的getter，会拿到计算属性对应的watcher，然后执行watcher.depend()，相当于渲染了watcher订阅了这个computed watcher的变化

然后再执行watcher.evaluate()去求值

一旦对计算属性依赖的数据做修改，则会触发setter过程，通知所有订阅它变化的watcher更新，执行watcher.update()方法

对于计算属性的computed watcher，实际有两种模式，lazy和active。如果`thisdep.subs.length === 0`成立，则说明没有人去订阅这个computed watcher的变化，仅仅把this.dirty = true，只有当下次访问这个计算属性的时候才会重新求值

当渲染watcher订阅了这个computed watcher的变化时，会执行

```js
this.getAndInvoke(() => {
  this.dep.notify()
})

getAndInvoke (cb: Function) {
  const value = this.get()
  if (
    value !== this.value ||
    // Deep watchers and watchers on Object/Arrays should fire even
    // when the value is the same, because the value may
    // have mutated.
    isObject(value) ||
    this.deep
  ) {
    // set new value
    const oldValue = this.value
    this.value = value
    this.dirty = false
    if (this.user) {
      try {
        cb.call(this.vm, value, oldValue)
      } catch (e) {
        handleError(e, this.vm, `callback for watcher "${this.expression}"`)
      }
    } else {
      cb.call(this.vm, value, oldValue)
    }
  }
}
```

getAndInvoke函数会重新计算，对比新旧值，如果变化了执行this.dep.notify回调函数，渲染watcher重新渲染

###### watcher

侦听属性的初始化在computed初始化之后，执行了

```js
if (opts.watch && opts.watch !== nativeWatch) {
  initWatch(vm, opts.watch)
}
```

initWatch对watch对象遍历，拿到每一个handler，因为Vue是支持watch的同一个key对应多个handler，所以如果handler是一个数组，则遍历整个数组，调用createWatcher方法，否则直接调用createWatcher

侦听属性最后会调用$watch方法，首先判断cb如果是一个对象则调用createWatcher方法，接着执行const watcher = new Watcher(vm, expOrFn, cb, options)实例化了一个watcher，一旦watcher的数据发生变化，它最终会执行watcher的run方法，执行回调函数cb，并且如果设置了immediate为true，则直接会执行回调函数cb，最终返回一个unwatchFn方法，它会调用teardown方法去移除这个watcher

###### Watcher options

watcher总共有4中类型

1. deep watcher

   对象深度监测，watcher监听a对象，修改a.b时只触发了a的getter，并没有触发a.b的getter，所以并没有订阅它的变化，导致我们对a.b赋值的时候，虽然出发了setter，但并没有可通知的对象；设置deep：true，会执行traverse函数，对对象做深层遍历递归

2. user watcher

   通过vm.$watch创建的watcher是个user watcher

3. computed watcher

   计算属性watcher

4. sync watcher

   当响应式数据发生变化后，出发了watcher.update()，只是把这个watcher推送到一个队列中，在nextTick后才真正执行watcher的回调函数，而如果设置了sync，就可以在当前tick中同步执行watcher的回调函数

   只有当我们需要 watch 的值的变化到执行 `watcher` 的回调函数是一个同步过程的时候才会去设置该属性为 true

##### 组件更新

组件的更新还是调用了vm._update方法，定义在`src/core/instance/lifecycle.js`中，组件更新过程，会执行vm.$el = vm._patch__(prevVnode, vnode)，它仍然会调用patch函数，这里会有oldVnode，会执行sameVNode(oldVnode, vnode)判断它们是否是相同的VNode来决定走不同的更新逻辑

sameVnode比较两个vnode的key，不等则是不同的，否则为同步组件，继续判断isComment、data、input类型等是否相同，对于异步组件，则判断asyncFactory是否相同

###### 新旧节点不同

替换已存在节点，分为三步

1. 创建新节点

   参考旧节点创建新节点，并插入到DOM中

2. 更新父的占位符节点

   找到当前vnode的父的占位符节点，先执行各个module的destroy的钩子函数，如果当前占位符是一个可挂载的节点，则执行module的create钩子函数

3. 删除旧节点

   把oldVnod从当前DOM树删除，如果父节点存在，则执行removeVnodes方法

   遍历待删除vnodes，其中removeAndInvokeRemoveHook的作用是从DOM中移除节点并执行module的remove钩子函数，invokeDestroyHook是执行module的destroy钩子函数以及vnode的destroy钩子函数，并对它的子vnode递归并调用invokeDestroyHook函数，removeNode调用平台DOM API真正删除DOM节点

###### 新旧节点相同

调用patchVnode，作用是把新的vnode patch到旧的vnode上，分为四步

1. 执行prepatch钩子函数

   prepatch就是拿到新的vnode的配置以及组件实例，执行updateChildComponent方法，更新vnode对应的实例的一系列属性

2. 执行update钩子函数

   执行完vnode的prepatch钩子函数，会执行所有module的update钩子函数以及用户自定义update钩子函数

3. 完成patch过程

   如果vnode是文本节点且新旧节点不同，则直接替换文本内容；如果不是文本节点

   - oldCh和ch都存在且不相同，使用updateChildren函数来更新子节点
   - 只有ch存在，则旧节点不需要，删除旧节点，通过addVnodes将ch批量插入到新节点elm下
   - 只有oldCh存在，则将旧节点通过removeVnodes全部清除
   - 当只有旧节点是文本节点时，清除文本内容

4. 执行postpatch钩子函数

   组件自定义的钩子函数，有则执行

组件更新的核心就是新旧vnode diff，新旧节点不同则创建新节点->替换父占位符节点->删除旧节点；新旧节点相同时获取它们的children，根据不同情况做不同更新逻辑，最复杂的是新旧节点相同且它们都存在子节点，那么会执行updateChildren逻辑

##### Props

在初始化props前，会对props做一次normalize，它发生在mergeOptions的时候，在`src/core/util/options.js`中，合并配置处理我们定义组件的对象option，然后挂载到实例this.$options中

normalizeProps主要就是把props转成对象格式

###### 初始化

props的初始化在new Vue中的initState阶段，initProps主要做了三件事：校验、响应式和代理

1. 校验

   遍历propsOptions，执行validateProp(key, propsOptions, propsData, vm)方法，检查我们传递的数据是否满足prop的定义规范

   validateProp主要做三件事：处理Boolean类型的数据、处理默认数据、prop断言，并最终返回prop的值

   Boolean类型处理，先通过`const booleanIndex = getTypeIndex(Boolean, prop.type)`来判断prop的定义是否为Boolean类型，getTypeIndex就是找到type和expectedTypes匹配的索引并返回

   通过执行getTypeIndex得到booleanIndex，如果prop.type是一个Boolean类型，通过`absent && !hasOwn(prop, 'default')`判断如果父节点没有传递这个prop数据并且未设置default时，则value为false

   针对[Boolean, String]多类型，接着判断`value === '' || value === hyphenate(key)`的情况，如果满足先通过`const stringIndex = getTypeIndex(String, prop.type)`获取匹配的String类型 的索引，然后判断`stringIndex < 0 || booleanIndex < stringIndex`的值来决定value的值是否为true

   当value为undefined时，说明父组件未传，则通过`getPropDefaultValue(vm, prop, key)`获取prop的默认值

   getPropDefaultValue检测如果没有定义default属性，那么返回undefined，除了Boolean之外，其余没有设置default属性的prop默认值都是undefined

   接着对开发环境下prop的默认值是否为对象或者数组类型的判断，它们的默认值必须返回一个工厂函数

   接着判断如果上一次组件渲染父组件传递的prop是undefined，则直接返回上一次的默认值vm._props[key]，这样可以避免触发不必要的watcher更新

   最后判断def如果是工厂函数且prop的类型并且不是Function的时候，返回工厂函数的返回值，否则直接返回def

   到这里，validateProp函数的Boolean类型数据的处理逻辑和默认数据处理逻辑讲完，最后是prop断言逻辑

   assertProp函数的目的是断言这个prop是否合法

   首先判断如果prop定义了required父组件未传递，则警告；接着如果value为空且prop没有定义required属性则直接返回；然后再对prop的类型做检验，先拿到prop中定义的类型type，转换为类型数组，然后依次遍历这个数组，执行assertType(value, type[i])去获取断言的结果，直到遍历完成或者valid为true时跳出循环，如果循环结束valid仍为false，那么说明prop的值value与prop定义的类型不匹配，就会生成告警信息

   最后判断当prop自定义了validator自定义校验器，则执行validator校验器

2. 响应式

   通过`const value = validateProp(key, propOptions, propsData, vm)`对prop做验证并且获取到prop的值后，接着通过defineReactive把prop做成响应式

3. 代理

   在经过响应式处理后，prop的值添加到vm._props下，比如vm._props.name，通过代理可以通过this.name访问

   通过proxy函数实现，对于非根实例的子组件而言，prop的代理发生在Vue.extend阶段，这么做的好处是不用为了每个组件实例都做一层proxy，是一种优化手段

###### props更新

当父组件传递给子组件的props值变化，子组件对应的值也会变化，同时触发子组件的重新渲染

- 子组件props更新

  当父组件的prop数据变化，触发父组件重新渲染，patch过程会执行patchVnode函数，patchVnode是个递归过程，当遇到组件vnode的时候，会执行组件更新过程的prepatch钩子函数

  prepatch内部会调用updateChildComponent方法来更新props，第二个参数就是父组件的propData，为什么`vnode.componentOptions.propsData`是父组件传递给子组件的prop数据呢（这个也同样解释了第一次渲染的propsData来源）？

  原来在组件render过程中，对于组件节点会通过createComponent方法来创建组件vnode，首先从data中提取到propData，然后在new VNode的时候，作为第七个参数中一个属性传入，所以可以通过vnode.componentOptions.propsData拿到prop数据

  然后是updateChildComponent函数，这里的propsData是父组件传递的props数据，vm是子组件实例，vm._props指向子组件的props值，propsKeys就是之前initProps过程中，缓存的子组件中定义的所有prop的key。主要逻辑是遍历propKeys，然后执行`props[key] = validateProp(key, propOptions, propsData, vm)`重新验证并计算新的prop数据，更新vm._props

- 子组件重新渲染

  子组件重新渲染有两种情况，一是prop值被修改，二是对象类型的prop内部属性的变化

  prop值被修改时，执行`props[key] = validateProp(key, propOptions, propsData, vm)`更新子组件prop的时候，会触发prop的setter过程，触发子组件重新渲染

  对象类型prop的内部属性发生变化时，并没有触发子组件prop的更新。但是子组件渲染访问过这个对象，所以这个prop在触发getter的时候会把子组件的render watcher收集到依赖中，然后父组件更新这个对象prop的某个属性时，会触发setter过程，会通知子组件的render watcher的update，进而触发子组件重新渲染

- toggleObserving

```js
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}
```

定义shouldObserve控制在observe的过程中是否需要把当前值变成一个Observer对象

在props的初始化和更新过程中，多次执行`toggleObesrving(false)`：对于非根实例会执行`toggleObesrving(false)`，然后对于每个prop值，也会执行defineReactive(props, key, value)去把它变成响应式，对于值val执行observe函数；在valudaeProp过程中，需要执行toggleObserving(true)，然后执行observe(value)把值变为响应式

在updateChildComponent过程中，和initProps的逻辑一样，不需要对引用类型props递归做响应式处理，所以也需要执行toggleObserving(false)

##### 原理图

[原理图](https://ustbhuangyi.github.io/vue-analysis/v2/reactive/summary.html)

#### 编译

模板到真实DOM渲染过程，需要将模板编译成render函数，Vue.js提供两个版本，一个是Runtime + Compiler的，一个是Runtime only的，前者包含编译代码，可以把编译放在运行时做，后者不包含编译代码，借助webpack的vue-loader事先编译模板

##### 编译入口

Runtime + Compiler的入口在`src/platforms/web/entry-runtime-with-compiler.js`，这里对$mount定义，其中编译入口就在这里

```js
const { render, staticRenderFns } =  compileToFunctions(template, {
    shouldDecodeNewlines,
    shouldDecodeNewlinesForHref,
    delimiters: options.delimiters,
    comments: options.comments
  }, this)
options.render = render
options.staticRenderFns = staticRenderFns
```

`compileToFunctions`把template编译生成render以及staticRenderFns，

```js
import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
```

`compileToFunctions`实际是`createCompiler`的返回值，该方法接受一个编译配置参数，`createCompiler`方法实际是`createCompilerCreator`方法返回的，该方法传入一个函数，真正的编译都在baseCompile函数里执行

`createCompilerCreator`接收baseOptions参数，返回`createCompiler`的函数，包括compile方法属性和`compileToFunctions`方法

`compileToFunctions`接收3个参数，编译模板template、编译配置options和Vue实例vm，核心编译过程就一行代码

```js
const compiled = compile(template, options)
```

compile函数在执行`createCompileToFunctionFn`的时候作为参数调用，它是`createCompiler`函数中定义的compile函数

compile函数执行的逻辑是先处理配置参数，真正执行编译过程就一行代码

```js
const compiled = baseCompile(template, finalOptions)
```

baseCompile在执行`createCompilerCreator`方法时作为参数传入

```js
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  const ast = parse(template.trim(), options)
  optimize(ast, options)
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
```

所以编译的入口，主要执行了以下几个逻辑：

- 解析模板字符串生成 AST

  ```js
  const ast = parse(template.trim(), options)
  ```

- 优化语法树

  ```js
  optimize(ast, options)
  ```

- 生成代码

  ```js
  const code = generate(ast, options)
  ```

##### parse

编译过程首先是对模板做解析，生成AST，是一种抽象语法树，是对源代码的抽象语法结构的树状表现形式，很多编译技术，如babel编译ES6的代码都会先生成AST

生成的AST是一个树状结构，每一个节点都是一个ast element，除了它自身的一些属性，还维护了它的父子关系，如parent指向它的父节点，children指向它的子节点

###### 整体流程

parse的定义在`src/compiler/parser/index.js`中，parse代码很长，分解分析每段伪代码的作用

- 从options中获取方法和配置

  ```js
  getFnsAndConfigFromOptions(options)
  ```

  parse函数输入template和options，输出是AST的根节点，options是和平台相关的一些配置，这些属性和方法之所以放在platforms目录下是因为它们在不同的平台(web和weex)的实现是不同的

  用伪代码`getFnsAndConfigFromOptions`表示这一过程

  ```js
  warn = options.warn || baseWarn
  
  platformIsPreTag = options.isPreTag || no
  platformMustUseProp = options.mustUseProp || no
  platformGetTagNamespace = options.getTagNamespace || no
  
  transforms = pluckModuleFunction(options.modules, 'transformNode')
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')
  
  delimiters = options.delimiters
  ```

  这些方法和配置都是后续解析时需要的，可以不用去管它们的具体作用

- 解析HTML模板

  ```js
  parseHTML(template, options)
  ```

  整体来说，parseHTML逻辑就是循环解析template，用正则做各种匹配，对不同情况分别进行不同的处理，直到整个template被解析完毕，在匹配过程中利用advance函数不断前进整个模板字符串，知道字符串末尾

  ```js
  function advance (n) {
    index += n
    html = html.substring(n)
  }
  ```

  匹配的过程中通过正则表达式，可以匹配到注释节点，文档类型节点，开闭合标签等

  1. 注释节点、文档类型节点

     注释和条件注释，前进至它们的末尾位置，文档类型节点，前进至它自身长度的距离

  2. 开始标签

     首先通过`parseStartTag`解析开始标签，除了标签名还有一些标签相关的属性，函数先通过正则表达式startTagOpen，然后定义了match对象，接着循环去匹配开始标签中的属性并添加到match.attrs中，直到匹配到开始标签的闭合符结束

     `parseStartTag`对开始标签拿到match后，紧接着执行`handleStartTag`对match做处理

     `handleStartTag`先判断是否为一元标签，接着对match.attrs遍历处理，如果为非一元标签，则往stach里push一个对象，并把tagName赋值给lastTag

     最后调用options.start回调函数，并传入一些参数

  3. 闭合标签

     通过正则endTag匹配到闭合标签，然后前进到闭合标签末尾，然后执行`parseEndTag`方法对闭合标签做解析

     `parseEndTag`逻辑很简单，上面`handleStartTag`对非一元标签会把它构造为一个对象压入stack中，所以对于闭合标签的解析，就是倒序stack匹配endTag

     最后调用options.end回调函数，并传入一些参数

  4. 文本

     接下来判断textEnd是否大于0，满足则说明从当前位置到textEnd位置都是文本

     在判断textEnd小于0的情况，则说明整个template解析完毕了，把剩余的html都赋值给了text

     最后调用options.chars回调函数，并传入text参数

  因此在循环解析整个template过程中，会根据不同的情况，执行不同的回调函数

- 处理开始标签

  ```js
  start (tag, attrs, unary) {
    let element = createASTElement(tag, attrs)
    processElement(element)
    treeManagement()
  }
  ```

  解析到开始标签后，最后会执行start函数，函数主要做三件事，创建AST元素，处理AST元素和AST树管理

  1. 创建AST元素

     `通过createASTElement`方法创建一个AST元素，并添加namespace，每个AST元素是一个简单的JS对象，其中，type表示AST元素类型，tag表示标签名，attrsList表示属性列表，attrsMap表示属性映射表，parent表示父的AST元素，children表示子AST元素集合

  2. 处理AST元素

     首先是对模块preTransforms的调用，接着通过processXXX对指令做处理，扩展为AST元素的属性

  3. AST树管理

     在不断解析模板创建AST元素的时候，为他们建立父子关系，就像DOM元素父子关系一样

- 处理结束标签

  ```js
  end () {
    treeManagement()
    closeElement()
  }
  ```

  解析到闭合标签最后执行end函数，首先处理尾部空格情况，然后stack出栈，并把stack的最后一个元素赋值给currentParent，保证当遇到闭合标签的时候，可以正确更新stack的长度以及currentParent的值，这样就维护了整个AST树

  最后执行`closeElement(element)`，更新inVPre和inPre的状态，以及执行postTransforms函数

- 处理文本内容

  ```js
  chars (text: string) {
    handleText()
    createChildrenASTOfText()
  }
  ```

  文本构造的AST元素有两种类型，一是有表达式，type为2，一种是纯文本，type为3，最后执行`parseText(text, delimiters)`对文本解析

###### 流程图

[https://ustbhuangyi.github.io/vue-analysis/v2/compile/parse.html#%E6%95%B4%E4%BD%93%E6%B5%81%E7%A8%8B](https://ustbhuangyi.github.io/vue-analysis/v2/compile/parse.html#整体流程)

parse目的是把template模板字符串传唤为AST树，AST元素节点总共有3种类型，type为1是普通元素，type为2是表达式，type为3是纯文本

##### optimize

模板通过parse后生成AST树，optimize对这棵树做优化

优化过程作用：因为Vue是数据驱动，但是模板不是所有数据都是响应式的，有很多数据是首次选然后就永远不变，那么这部分数据生成的DOM也不回变化，可以在patch的过程中跳过对它们的比对

optimize定义在`src/compiler/optimizer.js`中，主要完成两个功能：`markStatic(root)`标记静态节点，`markStaticRoots(root, false)`标记静态根

##### 标记静态节点

执行`node.static = isStatic(node)`，isStatic判断AST元素节点是否为静态，如果是表达式为非静态，纯文本就是静态；对于普通元素，如果有pre属性，那么它使用了v-pre指令，是静态，否则要同时满足以下条件：没有使用 `v-if`、`v-for`，没有使用其它指令（不包括 `v-once`），非内置组件，是平台保留的标签，非带有 `v-for` 的 `template` 标签的直接子节点，节点的所有属性的 `key` 都满足静态 key；这些都满足则这个 AST 节点是一个静态节点

对于普通元素，遍历它的所有children，递归执行markStatic。因为所有的elseif和else节点都不在children中，如果节点ifConditions不为空，则遍历ifConditions拿到所有条件中的block，也就是它们对应的AST节点，递归执行markStatic，递归时一旦子节点又不是static的情况，那么父节点的static变为false

###### 标记静态根

`markStaticRoots`第二个参数为isInFor，对于已经是static的节点或者是v-once指令的指点，`node.staticInFor = isInFor`，接着对于staticRoot的判断逻辑，对于有资格成为staticRoot的节点，除了本身是一个静态节点外，必须满足用于children，并且children不能只是一个文本节点

##### codegen

编译的最后一步就是把优化的AST树转换为可执行的代码，如下例子

```html
<ul :class="bindCls" class="list" v-if="isShow">
    <li v-for="(item,index) in data" @click="clickItem(index)">{{item}}:{{index}}</li>
</ul>
```

它经过编译，执行`const code = generate(ast, options)`，生成的render代码传如下

```js
with(this){
  return (isShow) ?
    _c('ul', {
        staticClass: "list",
        class: bindCls
      },
      _l((data), function(item, index) {
        return _c('li', {
          on: {
            "click": function($event) {
              clickItem(index)
            }
          }
        },
        [_v(_s(item) + ":" + _s(index))])
      })
    ) : _e()
}
```

 `_l`、`_v` 定义在 `src/core/instance/render-helpers/index.js` 中

然后在`compileToFunctions`中，会把这个render代码串转换为函数，实际上就是把render代码串通过`new Function`的方式转换为可执行的函数，赋值给`vm.options.render`，当组件通过`vm._render`时，就会执行这个render函数，接下来就重点关注一下render代码串的生成过程

###### generate

`generate` 函数的定义在 `src/compiler/codegen/index.js` 中

`generate`函数首先通过`genElement(ast, state)`生成code，再把code用`with(this){return ${code}}`包裹起来，这里的state是`CodegenState`的一个实例

`genElement`根据当前AST元素节点的属性执行不同的代码生成函数

###### genIf

genIf通过执行`genIfConditions`，依次从conditions获取第一个condition，然后通过`condition.exp`生成一段三元运算符的代码，`: `后递归调用`genIfConditions`，这里如果有多个conditions，就生成多层三元运算逻辑，所以`genTernaryExp`最终是调用了`genElement`

上面例子，只有一个condition，exp为isShow，因此生成以下代码

```js
return (isShow) ? genElement(el, state) : _e()
```

###### genFor

首先AST元素节点中获取与for相关的一些属性，返回一个代码字符串

上面例子，exp是data，alias是item，iterator1，因此生成如下代码

```js
_l((data), function(item, index) {
  return genElememt(el, state)
})
```

###### genData & genChildren

上面例子首先执行genIf，最终调用`genElement(el, state)`去生成子节点

- genData

  genData函数根据AST元素节点的属性构造出一个data对象字符串，在后面创建VNode的时候作为参数传入

- genChildren

  genChildren就是遍历children，执行genNode方法，根据不提供的type执行具体的方法

#### 扩展

##### event

通过例子分析源码

```js
let Child = {
  template: '<button @click="clickHandler($event)">' +
  'click me' +
  '</button>',
  methods: {
    clickHandler(e) {
      console.log('Button clicked!', e)
      this.$emit('select')
    }
  }
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child @select="selectHandler" @click.native.prevent="clickHandler"></child>' +
  '</div>',
  methods: {
    clickHandler() {
      console.log('Child clicked!')
    },
    selectHandler() {
      console.log('Child select!')
    }
  },
  components: {
    Child
  }
})
```

###### 编译

先从编译阶段开始，会执行processAttrs方法，定义在`src/compiler/parser/index.js`中

在对标签处理过程中，判断如果是指令，首先通过parseModifiers解析出修饰符，然后判断如果是事件的指令，则执行`addHandler(el, name, value, modifiers, false, warn)`方法

addHandler主要做3件事情，首先根据modifier修饰符对事件名name做处理，接着根据modifier.native判断是一个纯原生事件还是普通事件，分别对应`el.nativeEvents`和`el.events`，最后按照name对事件做归类，并把回调函数的字符串保留到对应的事件中

在我们例子中，父组件的child节点生成的`el.nativeEvents`和`el.events`如下

```js
el.events = {
  select: {
    value: 'selectHandler'
  }
}

el.nativeEvents = {
  click: {
    value: 'clickHandler',
    modifiers: {
      prevent: true
    }
  }
}
```

子组件的button节点生成`el.events`如下

```js
el.events = {
  click: {
    value: 'clickHandler($event)'
  }
}
```

然后在`codegen`的阶段，会在genData函数根据AST元素节点中的`events`和`nativeEvents`生成data数据，通过`genHandlers`实现

`genHandler`方法遍历事件对象`events`，对同一个事件名称的事件调用`genHandler(name, events[name])`方法，首先判断如果handler是一个数组，就遍历它然后递归调用`genHandler`方法并拼接结果，然后判断`handler.value`是一个函数的调用路径还是函数表达式，接着对`modifiers`做判断，如果没有`modifiers`的情况，就根据`handler.value`不同情况处理，要么直接返回，要么返回一个函数包裹的表达式；对于有`modifiers`的情况，则对各种不同的`modifer`情况做不同处理，添加相应的代码串

对于我们例子，父组件生产的data串为

```js
{
  on: {"select": selectHandler},
  nativeOn: {"click": function($event) {
      $event.preventDefault();
      return clickHandler($event)
    }
  }
}
```

子组件生成的data串为

```js
{
  on: {"click": function($event) {
      clickHandler($event)
    }
  }
}
```

编译部分结束，接下来是运行时部分实现。Vue事件主要有两种，一种是原生DOM事件，一种是用户自定义事件

###### DOM事件

之前patch的时候执行各种`module`钩子函数，之前只分析DOM是如何渲染的，而DOM元素相关的属性、样式、事件都是通过这些module钩子函数完成设置的

在patch过程中的创建阶段和更新阶段都执行`updateDOMListeners`

```js
let target: any
function updateDOMListeners (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  target = vnode.elm
  normalizeEvents(on)
  updateListeners(on, oldOn, add, remove, vnode.context)
  target = undefined
}
```

首先获取`vnode.data.on`，这是之前生成的data中对应的事件对象，target是当前`vnode`对应的DOM对象，`normalizeEvents`主要对`v-model`的处理，接着调用`updateListeners(on, oldOn, add, remove, vnode.context)`方法

`updateListeners`遍历on去添加事件监听，遍历oldOn去移除事件监听，关于监听和移除事件的方法都是外部传入的，因为它既处理原生DOM事件的添加删除，也处理自定义事件的添加删除

对on的遍历，首先获取每一个事件名，然后做`normalizeEvent`处理，根据事件名特殊标识区分出这个事件是否有`once`、`capture`、`passive`等修饰符

处理完事件名后，对事件回调函数做处理，对于第一次，满足`isUndef(old)`并且`isUndef(cur.fns)`，会执行`cur = on[name] = createFnInvoker(cur)`方法去创建一个回调函数，然后再执行`add(event.name, cur, event.once, event.capture, event.passive, event.params)`完成一次事件绑定

`createFnInvoker`定义了invoker方法并返回，由于一个事件可能会对应多个回调函数，所以这里做了数组判断，多个回调函数就依次调用。最后使用`invoker.fns = fns`，每一次执行`invoker`函数都是从`invoker.fns`里取执行的回调函数，回到`updateListeners`，当我们第二次执行该函数的时候，判断如果`cur !== old`，只需要修改`old.fns = cur`把之前绑定的`invoker.fns`赋值为新的回调函数即可，并且通过`on[name] = old`保留引用关系，保证事件回调只添加一次，之后仅仅去修改它的回调函数的引用

`udpateListeners`函数最后遍历`oldOn`拿到事件名称，判断如果满足`isUndef(on[name])`，则执行remove去移除事件回调

原生DOM事件真正添加回调和移除回调函数的实现

```js
function add (
  event: string,
  handler: Function,
  once: boolean,
  capture: boolean,
  passive: boolean
) {
  handler = withMacroTask(handler)
  if (once) handler = createOnceHandler(handler, event, capture)
  target.addEventListener(
    event,
    handler,
    supportsPassive
      ? { capture, passive }
      : capture
  )
}

function remove (
  event: string,
  handler: Function,
  capture: boolean,
  _target?: HTMLElement
) {
  (_target || target).removeEventListener(
    event,
    handler._withTask || handler,
    capture
  )
}
```

add和remove实际就是调用`addEventListener`和`removeEventListener`，并根据参数传递一些配置，这里的`handler`会用`withMacroTask(handler)`包裹一下，作用是强制在DOM事件的回调函数执行期间如果修改了数据，那么这些数据更改推入的队列会被当做`macroTask`在`nextTick`后执行

###### 自定义事件

自定义事件只能作用在组件上，如果在组件上使用原生事件，需要加`.native`修饰符

在render阶段，组件通过`createComponent`创建，这里会把`data.on`赋值给`listeners`，把`data.nativeOn`赋值给`data.on`，这样所有的原生DOM事件处理跟我们刚才介绍的一样，是在当前组件环境中处理的。而对于自定义事件，我们把`listeners`作为`vnode`的`componentOptions`传入，它是在子组件初始化阶段中处理的，所以它的处理环境是子组件

然后在子组件初始化过程中，会执行`initInternalComponent`方法，拿到父组件传入的`listeners`，然后在执行`initEvents`的过程中，拿到`listeners`，执行`updateComponentLiseners(vm, listeners)`

对于自定义事件和原生DOM事件处理的差异就在事件添加和删除上

```js
function add (event, fn, once) {
  if (once) {
    target.$once(event, fn)
  } else {
    target.$on(event, fn)
  }
}

function remove (event, fn) {
  target.$off(event, fn)
}
```

实际上就是利用Vue定义的事件中心

把所有事件用`vm._events`存储起来，当执行`vm.$on(event, fn)`的时候，按事件的名称`event`把回调函数fn存储起来`vm._events[event].push(fn)`。当执行`vm.$emit(event)`的时候，根据时间名event找到所有的回调函数`let cbs = vm._events[event]`，然后遍历执行所有回调函数。当执行`vm.$off(event,fn)`移除指定事件名event和指定的fn，当执行`vm.$once(event, fn)`的时候，内部执行`vm.$on`，并且当回调函数执行一次后再通过`vm.$off`移除事件的回调，确保回调函数只执行一次

`vm.$emit`是给当前vm上派发的实例，用它做父子组件通讯，是因为它的回调函数定义在父组件中，对于这个例子而言，当子组件的button被点击，通过`this.$emit('select')`派发事件，那么子组件的实例监听到select事件，并执行它的回调函数--定义在父组件中的selectHandler方法，就相当于完成一次父子组件的通讯

##### v-model

很多人会认为Vue的响应式数据原理就是双向绑定，双向绑定除了通过数据改变驱动DOM视图的变化，还有DOM的变化反过来影响数据，是一个双向关系，通过v-model实现

###### 表单元素

```js
let vm = new Vue({
  el: '#app',
  template: '<div>'
  + '<input v-model="message" placeholder="edit me">' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  }
})
```

编译阶段开始，在parse阶段，v-model被当作普通的指令解析到el.directives中，然后在`codegen`阶段，执行`genData`时，会执行`const dirs = genDirective(el, state)`

`genDirective`遍历`el.directive`，获取每一个指令对应的方法`const gen: DirectiveFunction = state.directives[dir.name]`，这个指令方法是在实例化`CodegenState`的时候通过option传入的，option是编译相关配置

对于v-model而言，对应的directive函数就是`src/platforms/web/compiler/directives/model.js` 中定义的 `model` 函数

也就是当我们执行`needRuntime = !!gen(el, dir, state.warn)`就是执行model函数，会根据AST节点的不同情况执行不同的逻辑，对于我们这个例子而言，它会命中`genDefaultModel(el, value, modifiers)`的逻辑

`genDefaultModel`函数先处理了`modifiers`，它的不同主要影响的是`event`和`valueExpression`的值，对于我们的例子，`event`为`input`，`valueExpression`为`$event.target.value`，然后执行`genAssignmentCode`去生成代码

该方法首先对`v-model`对应的value做i了解析，它处理了非常多情况，对于我们的例子，value就是message，所以返回的`res.key`为null，然后我们就得到`${value} = ${assignment}`，也就是`message = $event.target.value`，然后又执行`needCompositionGuard`为true的逻辑，所以最终code为`if ($event.target.composing) return;message = $event.target.value`

code生成完，执行两行关键代码

```js
addProp(el, 'value', `(${value})`)
addHandler(el, event, code, null, true)
```

这就是input实现`v-model`关键，通过修改AST元素，给el添加一个prop，相当于我们在input上动态绑定了value，又给el添加了事件处理，相当于在input上绑定了input事件

```js
<input
  v-bind:value="message"
  v-on:input="message=$event.target.value">
```

其实就是动态绑定了input的value指向了message变量，并且在触发input事件的时候去动态把message设置为目标值，这样就完成了双向绑定

再回到`genDirectives`，它接下来的逻辑就是根据指令生成一些data的代码

```js
if (needRuntime) {
  hasRuntime = true
  res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
    dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
  }${
    dir.arg ? `,arg:"${dir.arg}"` : ''
  }${
    dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
  }},`
}
```

对我们例子而言，最终生成的render代码如下

```js
with(this) {
  return _c('div',[_c('input',{
    directives:[{
      name:"model",
      rawName:"v-model",
      value:(message),
      expression:"message"
    }],
    attrs:{"placeholder":"edit me"},
    domProps:{"value":(message)},
    on:{"input":function($event){
      if($event.target.composing)
        return;
      message=$event.target.value
    }}}),_c('p',[_v("Message is: "+_s(message))])
    ])
}
```

###### 组件

```js
let Child = {
  template: '<div>'
  + '<input :value="value" @input="updateValue" placeholder="edit me">' +
  '</div>',
  props: ['value'],
  methods: {
    updateValue(e) {
      this.$emit('input', e.target.value)
    }
  }
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child v-model="message"></child>' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  },
  components: {
    Child
  }
})
```

父组件通过v-model绑定，子组件定义prop，并且在input回调函数中，通过`this.$emit('input', e.target.value)`派发事件

编译阶段，对于父组件而言，在编译阶段会解析v-model指令，依然会执行`genData`函数中`genDirectives`函数，接着执行`src/platforms/web/compiler/directives/model.js` 中定义的 `model` 函数，并命中如下逻辑：

```js
else if (!config.isReservedTag(tag)) {
  genComponentModel(el, value, modifiers);
  return false
}
```

`genComponentModel`对于我们例子而言，生成的`el.model`的值为

```js
el.model = {
  callback:'function ($$v) {message=$$v}',
  expression:'"message"',
  value:'(message)'
}
```

在`genDirectives`之后，`genData`还有一段逻辑

```js
if (el.model) {
  data += `model:{value:${
    el.model.value
  },callback:${
    el.model.callback
  },expression:${
    el.model.expression
  }},`
}
```

那么父组件最终生成的render代码如下

```js
with(this){
  return _c('div',[_c('child',{
    model:{
      value:(message),
      callback:function ($$v) {
        message=$$v
      },
      expression:"message"
    }
  }),
  _c('p',[_v("Message is: "+_s(message))])],1)
}
```

然后在子组件`vnode`阶段，会执行`createComponent`函数

对`data.model`情况做处理，执行`transformModel(Ctor.options, data)`方法

`transformModel`给`data.props`添加`data.model.value`，并且给`data.on`添加`data.model.callback`，对于我们例子而言，扩展结果如下

```js
data.props = {
  value: (message),
}
data.on = {
  input: function ($$v) {
    message=$$v
  }
} 
```

就相当于我们这样编写父组件

```js
let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child :value="message" @input="message=arguments[0]"></child>' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  },
  components: {
    Child
  }
})
```

`v-model`子组件的value prop以及派发的input事件名都是可配置的，

```js
let Child = {
  template: '<div>'
  + '<input :value="msg" @input="updateValue" placeholder="edit me">' +
  '</div>',
  props: ['msg'],
  model: {
    prop: 'msg',
    event: 'change'
  },
  methods: {
    updateValue(e) {
      this.$emit('change', e.target.value)
    }
  }
}
```

##### slot

###### 普通插槽

```js
  template: '<div class="container">' +
  '<header><slot name="header"></slot></header>' +
  '<main><slot>默认内容</slot></main>' +
  '<footer><slot name="footer"></slot></footer>' +
  '</div>'
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<app-layout>' +
  '<h1 slot="header">{{title}}</h1>' +
  '<p>{{msg}}</p>' +
  '<p slot="footer">{{desc}}</p>' +
  '</app-layout>' +
  '</div>',
  data() {
    return {
      title: '我是标题',
      msg: '我是内容',
      desc: '其它信息'
    }
  },
  components: {
    AppLayout
  }
})
```

###### 编译

首先编译父组件，在parse阶段，会执行`processSlot`处理slot

当解析到标签上有slot属性时，会给对应的AST元素节点添加slotTarget属性，然后在`codegen`阶段，在`genData`中处理`slotTarget`

```js
if (el.slotTarget && !el.slotScope) {
  data += `slot:${el.slotTarget},`
}
```

会给data添加一个slot属性，并指向`slotTarget`，父组件最终生成代码

```js
with(this){
  return _c('div',
    [_c('app-layout',
      [_c('h1',{attrs:{"slot":"header"},slot:"header"},
         [_v(_s(title))]),
       _c('p',[_v(_s(msg))]),
       _c('p',{attrs:{"slot":"footer"},slot:"footer"},
         [_v(_s(desc))]
         )
       ])
     ],
   1)}
```

接下来编译子组件，同样在parse阶段会执行`processSlot`处理函数，当遇到slot标签时会给对应的AST元素节点添加`slotName`属性，然后在`codegen`阶段，会判断如果当前AST元素节点是slot标签，则执行genSlot函数

先不考虑slot标签上有attrs以及v-bind的情况，genSlot函数代码实际就是

```js
const slotName = el.slotName || '"default"'
const children = genChildren(el, state)
let res = `_t(${slotName}${children ? `,${children}` : ''}`
```

这里`slotName`实际从AST元素节点对应的属性上取，默认default，而children对应的就是slot开始和闭合标签包裹的内容，我们的例子最终生成代码

```js
with(this) {
  return _c('div',{
    staticClass:"container"
    },[
      _c('header',[_t("header")],2),
      _c('main',[_t("default",[_v("默认内容")])],2),
      _c('footer',[_t("footer")],2)
      ]
   )
}
```

_t函数对应的就是`renderSlot`方法，它的定义在 `src/core/instance/render-heplpers/render-slot.js` 中

`render-slot`参数name对应插槽名称slotName，fallback代表插槽的默认内容生成的vnode数组，如果`this.$slot[name]`有值，就返回对应的vnode数组，否则返回fallback。那么这个`this.$slot`是哪里来的呢？

子组件的init时机是在父组件执行patch过程的时候，这个时候父组件已经编译完成，并且子组件在init过程中会执行`initRender`函数，`initRender`会获取到`vm.$slot`

`vm.$slot`通过执行`resolveSlots(options._renderChildren, renderContext)`返回

`resolveSlots`接收两个参数，children对应父`vnode`的`children`，在我们例子中就是`<app-layout>`和`</app-layout>`包裹内容，第二个参数context是父vnode的上下文，父组件的vm实例

`resolveSlots`函数逻辑是遍历children，拿到每一个child的data，然后通过data.slot获取到插槽名称，这个slot就是之前编译父组件在codegen阶段设置的data.slot。接着以插槽名称为key把child添加到slots中，如果data.slot不存在，则是默认插槽的内容，则把对应的child添加到slots.default中，这样就获取到整个slots，他是一个对象，key是插槽名称，value是一个vnode类型的数组，因为它可以有多个同名插槽

拿到vm.$slot后，在`renderSlot`函数，`const slotNodes = this.$slot[name]`，这样就能根据插槽名称获取到对应的vnode数组，vnode是在父组件创建的，会替换子组件插槽的内容

普通插槽，父组件应用到子组件插槽里的数据都是绑定到父组件，因为它渲染成vnode的时机的上下文都在父组件的实例，如果想通过子组件的一些数据来决定父组件实现插槽的逻辑，需要作用域插槽

###### 作用域插槽

```js
let Child = {
  template: '<div class="child">' +
  '<slot text="Hello " :msg="msg"></slot>' +
  '</div>',
  data() {
    return {
      msg: 'Vue'
    }
  }
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child>' +
  '<template slot-scope="props">' +
  '<p>Hello from parent</p>' +
  '<p>{{ props.text + props.msg}}</p>' +
  '</template>' +
  '</child>' +
  '</div>',
  components: {
    Child
  }
})
```

最终生成的DOM结构

```html
<div>
  <div class="child">
    <p>Hello from parent</p>
    <p>Hello Vue</p>
  </div>
</div>
```

在编译阶段，同样是通过`processSlot`函数去处理`scoped-slot`

读取`scoped-slot`属性并赋值给当前AST节点的`slotScoped`属性，在构建AST树的时候，执行以下逻辑

```js
if (element.elseif || element.else) {
  processIfConditions(element, currentParent)
} else if (element.slotScope) { 
  currentParent.plain = false
  const name = element.slotTarget || '"default"'
  ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element
} else {
  currentParent.children.push(element)
  element.parent = currentParent
}
```

拥有`scopedSlot`属性的AST元素节点，是不会作为children添加到SAT树中，而是存在父AST元素节点的`scopedSlots`属性上，它是一个对象，以插槽名称name为key

然后再`genData`过程，对`scopedSlots`做处理

`genScoped`就是对`scopedSlots`对象做遍历，执行`genScopedSlot`，并把结果用逗号拼接，而`genScopedSlot`是先生成i一段函数代码，并且函数的参数是我们的`slotScope`，也就是卸载标签属性上的`scoped-slot`对应的值，然后再返回一个对象，key为插槽名称，fn为生成的函数代码

对于我们例子，最终生成的代码

```js
with(this){
  return _c('div',
    [_c('child',
      {scopedSlots:_u([
        {
          key: "default",
          fn: function(props) {
            return [
              _c('p',[_v("Hello from parent")]),
              _c('p',[_v(_s(props.text + props.msg))])
            ]
          }
        }])
      }
    )],
  1)
}
```

和普通插槽父组件编译结果的区别是没有`children`，data部分多了一个对象，并且执行了`_u`，就是`resolveScopedSlots`

```js
export function resolveScopedSlots (
  fns: ScopedSlotsData, // see flow/vnode
  res?: Object
): { [key: string]: Function } {
  res = res || {}
  for (let i = 0; i < fns.length; i++) {
    if (Array.isArray(fns[i])) {
      resolveScopedSlots(fns[i], res)
    } else {
      res[fns[i].key] = fns[i].fn
    }
  }
  return res
}
```

`fns`是一个数组，包含一个key和一个fn，key对应插槽的名称，fn对应一个函数

接着是子组件的编译，和普通插槽基本相同，只是在`genSlot`的时候，对attrs和v-bind做处理，对应我们的例子

```js
with(this){
  return _c('div',
    {staticClass:"child"},
    [_t("default",null,
      {text:"Hello ",msg:msg}
    )],
  2)}
```

_t就是renderSlot方法，其中定义`this.$scopedSlots`是在子组件的渲染函数执行前，在`vm_render`中

```js
 if (_parentVnode) {
  vm.$scopedSlots = _parentVnode.data.scopedSlots || emptyObject
}
```

这个 `_parentVnode.data.scopedSlots`就是父组件通过执行`resolveScopedSlots`返回的对象，然后`genSlot`函数就可以通过插槽的名称拿到对应的`scopedSlotFn`，把相关的数据扩展到props上，作为函数参数传入，返回`vnodes`，为后续渲染节点用

##### keep-alive

###### 内置组件

`<keep-alive>`是Vue源码实现的一个组件

在`created`钩子定义了`this.cache`和`this.keys`，本质上就是去缓存已经创建的vnode。props定义了include、exclude和max，max表示缓存的大小

`<keep-alive>`使用render函数，首先获取第一个子元素的vnode

```js
const slot = this.$slots.default
const vnode: VNode = getFirstComponentChild(slot)
```

由于在keep-alive标签内部写DOM，所以获取它的默认插槽，然后在获取它的第一个子节点，keep-alive只处理第一个子元素，因此搭配使用的有component动态组件或router-view

接着判断当前组件的名称和include、exclude的关系

```js
// check pattern
const name: ?string = getComponentName(componentOptions)
const { include, exclude } = this
if (
  // not included
  (include && (!name || !matches(include, name))) ||
  // excluded
  (exclude && name && matches(exclude, name))
) {
  return vnode
}

function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  return false
}
```

`matches`做匹配，分别处理数组、字符串和正则的情况，也就是include和exclude可以是三种类型的任意一种，当组件名满足配置include且不匹配或配置exclude且匹配，那么直接返回这个组件的vnode，否则的话走下一步缓存

```js
const { cache, keys } = this
const key: ?string = vnode.key == null
  // same constructor may get registered as different local components
  // so cid alone is not enough (#3269)
  ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
  : vnode.key
if (cache[key]) {
  vnode.componentInstance = cache[key].componentInstance
  // make current key freshest
  remove(keys, key)
  keys.push(key)
} else {
  cache[key] = vnode
  keys.push(key)
  // prune oldest entry
  if (this.max && keys.length > parseInt(this.max)) {
    pruneCacheEntry(cache, keys[0], keys, this._vnode)
  }
}
```

如果命中缓存，则直接从缓存中拿vnode的组件实例，并且重新调整了key的顺序放在最后一个，否则把vnode设置进缓存，最后还有一个逻辑，如果配置了max并且缓存的长度超过了this.max，还要从缓存中删除一个

```js
function pruneCacheEntry (
  cache: VNodeCache,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const cached = cache[key]
  if (cached && (!current || cached.tag !== current.tag)) {
    cached.componentInstance.$destroy()
  }
  cache[key] = null 
  remove(keys, key)
}
```

除了从缓存中删除外，还要判断如果要删除的缓存组件tag不是当前渲染组件tag，也执行删除缓存的组件的$destroy方法

最后设置 `vnode.data.keepAlive = true` 

watch监听include和exclude，观测他们的变化执行 `pruneCache` 函数，其实就是对 `cache` 做遍历，发现缓存的节点名称和新的规则没有匹配上的时候，就把这个缓存节点从缓存中摘除

###### 组件渲染

和普通组件的区别：首次渲染和缓存渲染

```js
let A = {
  template: '<div class="a">' +
  '<p>A Comp</p>' +
  '</div>',
  name: 'A'
}

let B = {
  template: '<div class="b">' +
  '<p>B Comp</p>' +
  '</div>',
  name: 'B'
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<keep-alive>' +
  '<component :is="currentComp">' +
  '</component>' +
  '</keep-alive>' +
  '<button @click="change">switch</button>' +
  '</div>',
  data: {
    currentComp: 'A'
  },
  methods: {
    change() {
      this.currentComp = this.currentComp === 'A' ? 'B' : 'A'
    }
  },
  components: {
    A,
    B
  }
})
```

- 首次渲染

  Vue的渲染最终都会到patch阶段，组件的patch过程会执行`createComponent`方法

  `createComponent`定义`isReactivated`变量，它是根据`vnode.componentInstance`以及`vnode.data.keepAlive`的判断，第一次渲染的时候，`vnode.componentInstance`为`undefined`，`vnode.data.keepAlive`为true，因为它的父组件`<keep-alive>`会先执行，那么该vnode缓存到内存中，并设置`vnode.data.keepAlive`为true，因此`isReactivated`为false，那么走正常的init的钩子函数执行组件的mount，当vnode已经执行完patch后，执行initComponent函数

  这里会有vnode.elm缓存了vnode创建生成的DOM节点，所以对于首次渲染而言，除了在`<keep-alive>`中建立缓存，和普通组件渲染没有区别

- 缓存渲染

  第二次渲染，就会命中缓存渲染

  当数据发生变化，在patch过程中会执行`patchVnode`的逻辑，它会对比新旧vnode节点，甚至对比它们的子节点做更新逻辑，所以对于vnode而言，是没有children的，那么对于`keep-alive`组件而言，如何更新它包裹的内容呢

  原来在`patchVnode`做各种diff前，会执行`prepatch`钩子函数

  `prepatch`核心逻辑是执行`updateChildComponent`方法

  `updateChildComponent`主要是去更新组件实例的一些属性，这里重点关注slot，由于`keep-alive`组件本质上也支持了slot，所以它执行prepatch的时候，需要对自己的children，也就是`slots`做重新解析，并触发`keep-alive`组件实例`$forceUpdate`逻辑，也就是重新执行`keep-alive`的render方法，这个时候如果它包裹的第一个组件vnode命中缓存，则直接返回缓存中的`vnode.componentInstance`，在我们例子中就是缓存的A组件，接着又执行patch过程，再次执行到`createComponent`方法

  这个时候`isReactivated`为true，并且在执行init钩子函数的时候不会在执行组件的mount过程了

  这也就是被`keep-alive`包裹的组件在有缓存的时候不会再执行组件的created、mounted钩子函数原因，在`isReactivated`为true的情况下执行`reactivateComponent`方法

  最后执行`insert(parentElm, vnode.elm, refElm)`就把缓存的DOM对象直接插入到目标元素中，就完成了数据更新的情况下的渲染过程

###### 生命周期

再次渲染不会执行created、mounted等钩子函数，所以Vue提供了activated钩子函数，它的执行时机是在`<keep-alive>`包裹的组件渲染的时候

在渲染的最后一步，会执行`invokeInsertHook(vnode, insertVNodeQueue, isInitialPatch)`函数执行vnode的insert钩子函数

这里判断如果被`<keep-alive>`包裹的组件已经mounted，那么执行`queueActivatedComponent(componentInstance`)，否则执行`acticateChildComponent(componentInstance, true)`

非mounted时，执行组件的activated钩子函数，并且递归去执行它的所有子组件的activated钩子函数

已经mounted时，把当前vm添加到`activatedChildren`数组中，等所有渲染完毕，在`nextTick`后会执行`flushSchedulerQueue`，这个时候会执行

```js
function flushSchedulerQueue () {
  // ...
  const activatedQueue = activatedChildren.slice()
  callActivatedHooks(activatedQueue)
  // ...
} 

function callActivatedHooks (queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true)  }
}
```

也就是遍历所有的`acticatedChildren`，执行`activateChildComponent`方法，通过队列调的方式把整个`activated`时机延后了

有了`activated`钩子函数，也就又有了对应的`deactivated`钩子函数，它的发生在vnode的destory的钩子函数

对于`<keep-alive>`包裹的组件，会执行`deactivateChildComponent(componentInstance. true)`方法，和`activatedChildCOmponent`方法类似，就是执行组件的`deactivated`钩子函数，并且递归去执行它的所有子组件的`deactivated`钩子函数

##### transition

搭配css3样式和JavaScript钩子函数实现过渡效果，在下列情形中，可给任何元素和组件添加entering/leaving过渡:

- 条件渲染--v-if
- 条件展示--v-show
- 动态组件
- 组件根节点

```js
let vm = new Vue({
  el: '#app',
  template: '<div id="demo">' +
  '<button v-on:click="show = !show">' +
  'Toggle' +
  '</button>' +
  '<transition :appear="true" name="fade">' +
  '<p v-if="show">hello</p>' +
  '</transition>' +
  '</div>',
  data() {
    return {
      show: true
    }
  }
})
```

```css
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
```

###### 内置组件

`<transition>`内置组件作为web平台独有

`<transition>`组件和`<keep-alive>`有几点相似，同样是抽象组件，直接实现render函数，都利用默认插槽，`<transition>`组件很灵活，支持props很多

```js
export const transitionProps = {
  name: String,
  appear: Boolean,
  css: Boolean,
  mode: String,
  type: String,
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String,
  duration: [Number, String, Object]
}
```

render函数主要作用是渲染生成的vnode

- 处理`children`

  从默认插槽获取transition包裹的子节点，判断长度

- 处理model

  两种 `in-out`和`out-in`

- 获取rawChild & child

  `rawChild`第一个子节点vnode，判断当前`<transition>`如果是组件根节点并且外面包裹该组件的容器也`<transition>`跳过

  `hasParentTransition`，传入`this.$vnode`，也就是`<transition>`组件的占位vnode，只有当它同时作为根vnode，也就是`vm._vnode`的时候，它的parent才不会为空，并且判断parent也是`<transition>`组件，才返回true

  `getRealChild`目的是获取组建的非抽象子节点，因为`<transition>`可能会包含`<keep-alive>`组件

- 处理id & data

  首先获取到id，接着从当前通过`extractTransitionData`组件实例上提取出过渡所需要的数据：

  首先遍历props赋值到data中，接着遍历所有父组件的事件，把事件回调赋值到data中

  这样`child.data.transition`就包含了过渡所需的一些数据，对于child如果使用v-show指令，也会把child.data.show设置为true

  在我们例子中，得到的child.data如下

  ```js
  {
    transition: {
      appear: true,
      name: 'fade'
    }
  }
  ```

###### transition module

动画相关逻辑在`src/platforms/web/modules/transition.js`中

`vnode patch`过程执行钩子函数，对于过渡元素，只接受了create和activate两个钩子函数

过渡时机有两个，一个是create和activate的时候提供entering进入动画，一个是remove的时机提供leaving离开动画

###### entering

整个entering的过程实现是enter函数

1. 解析过渡数据

   使用`resolveTransition`获取过渡相关的一些数据，通过`autoCssTransition`处理name属性，生成一个用来描述各个阶段的Class名称的对象，扩展到def中并返回给data，这样就能从data中获取到过渡相关的数据

2. 处理边界情况

   为了处理当`<transition>`作为子组件的根节点，那么需要检查它的父组件作为apper的检查。isAppear表示当前上下文实例还没有mounted，第一次出现的时机，如果是第一次并且`<transition>`组件没有配置appear的话，直接返回

3. 定义过渡类名、钩子函数和其他配置

   `startClass`定义进入过渡的开始状态，在元素被插入时生效，在下一帧移除，`activeClass`定义过渡的状态，在整个过渡期间作用，在元素被插入时生效，在`transition/animation`完成后移除，`toClasss`定义进入过渡的结束状态，在元素被插入一帧后生效（同时startClass被删除），在`transition/animation`完成后移除

   对于过渡钩子函数，`beforeEnterHook`时过渡开始前执行的钩子函数，`enterHook`是在元素插入后或者是v-show显示切换后执行的钩子函数，`afterEnterHook`是在过渡动画执行完后的钩子函数

   `explicitEnterDuration` 表示 enter 动画执行的时间。shou

   `expectsCSS` 表示过渡动画是受 CSS 的影响。

   `cb` 定义的是过渡完成执行的回调函数。

4. 合并insert钩子函数

   `mergeVNodeHook`把hook函数合并到`def.data.hook[hookey]`中，生成新的invoker

   组件的vnode定义了`init`、`prepatch`、`insert`、`destroy`四个钩子函数，而`mergeVNodeHook`函数就是把一些新的钩子函数合并进来，例如在`<transition>`过程中合并的insert钩子函数，就是合并到组件vnode的insert钩子函数，这样当组件插入后，就会执行我们定义的`enterHook`

5. 开始执行过渡动画

   首先执行`beforeEnterHook`钩子函数，把当前元素的DOM节点`el`传入，然后判断`expectsCSS`，如果为true则表明希望使用CSS来控制动画，那么会执行`addTransitionClass(el, startClass)`和`addTransitionClass(el, activeClass)`

   ```js
   export function addTransitionClass (el: any, cls: string) {
     const transitionClasses = el._transitionClasses || (el._transitionClasses = [])
     if (transitionClasses.indexOf(cls) < 0) {
       transitionClasses.push(cls)
       addClass(el, cls)
     }
   }
   ```

   给当前DOM元素`el`添加样式`cls`，这里添加了`startClass`和`activeClass`，在我i们例子中就是给p标签添加了`fade-enter`和`fade-enter-active`两个样式

   接下来执行nextFrame

   ```js
   const raf = inBrowser
     ? window.requestAnimationFrame
       ? window.requestAnimationFrame.bind(window)
       : setTimeout
     : fn => fn()
   
   export function nextFrame (fn: Function) {
     raf(() => {
       raf(fn)
     })
   }
   ```

   就是一个简单的`requestAnimationFrame`的实现，它的参数fn会在下一帧执行，因此下一帧执行了`removeTransitionClass(el, startClass)`

   ```js
   export function removeTransitionClass (el: any, cls: string) {
     if (el._transitionClasses) {
       remove(el._transitionClasses, cls)
     }
     removeClass(el, cls)
   }
   ```

   把`startClass`移除，在我们例子中就是移除了`fade-enter`样式，接着判断如果此时过渡没有被取消，则执行`addTransitionClass(el, toClass)`添加了`toClass`，在我们例子中就是添加了`fade-enter-to`，然后判断`!userWantsControl`，也就是用户不通过`enterHook`钩子函数控制动画，这时候如果用户指定了`explicitEnterDuration`，则延时这个时间执行`cb`，否则`whenTransitionEnds(el, type, cb)`决定`cb`的时机

   `whenTransitionEnds` 本质上就利用了过渡动画的结束事件来决定 `cb` 函数的执行

   最后回到`cb`函数

   ```js
   const cb = el._enterCb = once(() => {
     if (expectsCSS) {
       removeTransitionClass(el, toClass)
       removeTransitionClass(el, activeClass)
     }
     if (cb.cancelled) {
       if (expectsCSS) {
         removeTransitionClass(el, startClass)
       }
       enterCancelledHook && enterCancelledHook(el)
     } else {
       afterEnterHook && afterEnterHook(el)
     }
     el._enterCb = null
   })
   ```

   执行`removeTransitionClass(el, toClass)`和`removeTransitionClass(el, activeClass)`把`toClass`和`activeClass`移除，然后判断如果取消，则移除`startClass`并执行`enterCanceledHook`，否则执行`afterEnterHook(el)`

###### leaving

`entering`主要发生在组件插入后，而`leaving`主要发生在组件销毁前

纵观`leave`实现，和enter的实现几乎是一个镜像过程，不同的是data中解析出来的是`leave`相关的样式类名和钩子函数，还有一点就是配置`delayLeave`，延时执行`leave`的相关过渡动画，在`leave`动画执行完成，它会执行`rm`函数把节点从DOM中真正的移除

所以真正执行动画的是我们写的CSS或者JavaScript钩子函数，Vue的`<transition>`只是帮我们管理这些CSS的添加/删除，以及钩子函数的执行时机

##### transition-group

`<transition>`只能对单一元素有效，对列表过渡效果需使用`<transition-group>`组件

```js
let vm = new Vue({
  el: '#app',
  template: '<div id="list-complete-demo" class="demo">' +
  '<button v-on:click="add">Add</button>' +
  '<button v-on:click="remove">Remove</button>' +
  '<transition-group name="list-complete" tag="p">' +
  '<span v-for="item in items" v-bind:key="item" class="list-complete-item">' +
  '{{ item }}' +
  '</span>' +
  '</transition-group>' +
  '</div>',
  data: {
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    nextNum: 10
  },
  methods: {
    randomIndex: function () {
      return Math.floor(Math.random() * this.items.length)
    },
    add: function () {
      this.items.splice(this.randomIndex(), 0, this.nextNum++)
    },
    remove: function () {
      this.items.splice(this.randomIndex(), 1)
    }
  }
})
```

```css
 .list-complete-item {
  display: inline-block;
  margin-right: 10px;
}
.list-complete-move {
  transition: all 1s;
}
.list-complete-enter, .list-complete-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.list-complete-enter-active {
  transition: all 1s;
}
.list-complete-leave-active {
  transition: all 1s;
  position: absolute;
}
```

###### render函数

`<transition-group>`是由render函数渲染生成的`vnode`，实现步骤

- 定义一些变量

  ```js
  const tag: string = this.tag || this.$vnode.data.tag || 'span'
  const map: Object = Object.create(null)
  const prevChildren: Array<VNode> = this.prevChildren = this.children
  const rawChildren: Array<VNode> = this.$slots.default || []
  const children: Array<VNode> = this.children = []
  const transitionData: Object = extractTransitionData(this)
  ```

  不同于`<transition>`，`<transition-group>`是非抽象组件，会被渲染成真实元素，默认`tag`是~，`prevChildren`存储上一次子节点，children存储当前的子节点，~表示`<transition-group>`包裹的原始子节点，`transitionData`是从`<transition-group>`组件上提取出来的渲染数据

- 遍历`rawChildren`，初始化`children`

  ```js
  for (let i = 0; i < rawChildren.length; i++) {
    const c: VNode = rawChildren[i]
    if (c.tag) {
      if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
        children.push(c)
        map[c.key] = c
        ;(c.data || (c.data = {})).transition = transitionData
      } else if (process.env.NODE_ENV !== 'production') {
        const opts: ?VNodeComponentOptions = c.componentOptions
        const name: string = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag
        warn(`<transition-group> children must be keyed: <${name}>`)
      }
    }
  }
  ```

  拿到`vnode`，判断`vnode`是否设置`key`，这是`<transition-group>`对列表元素的要求，然后把`vnode`添加到`children`中，把提取到的数据`transitionData`添加到`vnode.data.transition`中，这是实现单个元素过渡动画的重点

- 处理`prevChildren`

  ```js
  if (prevChildren) {
    const kept: Array<VNode> = []
    const removed: Array<VNode> = []
    for (let i = 0; i < prevChildren.length; i++) {
      const c: VNode = prevChildren[i]
      c.data.transition = transitionData
      c.data.pos = c.elm.getBoundingClientRect()
      if (map[c.key]) {
        kept.push(c)
      } else {
        removed.push(c)
      }
    }
    this.kept = h(tag, null, kept)
    this.removed = removed
  }
  
  return h(tag, null, children)
  ```

  当存在时，遍历获取每个`vnode`，然后把`transitionData`赋值给`vnode.dasta.transition`，这是为了当在`enter`和`level`的钩子函数时有过渡动画；接着调用原生`DOM`的`getBoundingChientRect`方法获取到原生`DOM`的位置信息，记录到`vnode.data.pos`中，然后判断以下·是否在map中，如果在则放入`kept`中，否则表示该节点 已被删除，放入`removed`中，然后通过执行`h(tag, null, kept)`渲染后放入`this.kept`中，把`removed`用`this.removed`保存。最后整个`render`函数通过`h(tag, null, children)`生成渲染`vnode`

###### move过渡实现

`<transition-group>`是如何实现剩余元素平移的过渡效果的？

元素插入和删除，就是操作数据，除了触发`render`函数渲染之外，还会触发`updated`钩子函数


- 判断子元素是否定义move相关样式

  核心就是`hasMove`的判断，首先克隆一个DOM节点，然后为了避免影响，移除它的所有其他的过渡`class`，接着添加`moveClass`样式，设置`display`为`none`，添加到组件根节点上，接下来通过`getTransitionInfo`获取它的一些缓动相关的信息，然后从根节点上删除这个克隆节点，并通过判断`info.hasTransform`来判断`hasMove`，在我们例子中，该值为`true`

- 子节点预处理

  ```js
  children.forEach(callPendingCbs)
  children.forEach(recordPosition)
  children.forEach(applyTranslation)
  ```

  对`children`做了3轮循环，分别做了如下处理

  ```js
  function callPendingCbs (c: VNode) {
    if (c.elm._moveCb) {
      c.elm._moveCb()
    }
    if (c.elm._enterCb) {
      c.elm._enterCb()
    }
  }
  
  function recordPosition (c: VNode) {
    c.data.newPos = c.elm.getBoundingClientRect()
  }
  
  function applyTranslation (c: VNode) {
    const oldPos = c.data.pos
    const newPos = c.data.newPos
    const dx = oldPos.left - newPos.left
    const dy = oldPos.top - newPos.top
    if (dx || dy) {
      c.data.moved = true
      const s = c.elm.style
      s.transform = s.WebkitTransform = `translate(${dx}px,${dy}px)`
      s.transitionDuration = '0s'
    }
  }
  ```

  `callPendingCbs`方法在前一个过渡动画执行完又再次执行到该方法的时候，会提前执行`_moveCb`和`_enterCb`

  `recordPosition`的作用是记录节点的新位置

  `applyTransition`的作用是先计算节点新位置和旧位置的差值，如果差值不为0，则说明这些节点是需要移动的，所以记录`vnode.data.moved`为`true`，并且通过设置`transform`把需要移动的节点的位置移到之前的旧位置，目的是为了做`move`缓动做准备

- 遍历子元素实现`move`过渡

  ```js
  this._reflow = document.body.offsetHeight
  
  children.forEach((c: VNode) => {
    if (c.data.moved) {
      var el: any = c.elm
      var s: any = el.style
      addTransitionClass(el, moveClass)
      s.transform = s.WebkitTransform = s.transitionDuration = ''
      el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
        if (!e || /transform$/.test(e.propertyName)) {
          el.removeEventListener(transitionEndEvent, cb)
          el._moveCb = null
          removeTransitionClass(el, moveClass)
        }
      })
    }
  })
  ```

  首先通过`document.body.offsetHeight`强制触发浏览器重绘，接着再次对`children`遍历，先给子节点添加`moveClass`，在我们例子中，`moveClass`定义`transition: all 4s;`缓动，接着把子节点的`style.transform`设置为空，由于前面把这些节点偏移到之前的旧位置，所以就会从旧位置按照`1s`的缓动时间过渡偏移到它的当前位置，这样就实现了move的过渡动画，并且接下来会监听`transitionEndEvent`过渡结束的时间，做一些清理的操作

  另外，虚拟`DOM`的子元素更新算法是不稳定的，不能保证被移除元素的相对位置，所以强制`<transition-group>`有两个步骤：第一步移除需要移除的`vnode`，同时触发它的`leaving`过渡，第二步需要把插入和移动的节点达到它们的最终态，同时还要保持移除的节点保留在应该的位置，这个是通过`beforeMount`钩子函数实现的

  ```js
  beforeMount () {
    const update = this._update
    this._update = (vnode, hydrating) => {
      // force removing pass
      this.__patch__(
        this._vnode,
        this.kept,
        false, // hydrating
        true // removeOnly (!important, avoids unnecessary moves)
      )
      this._vnode = this.kept
      update.call(this, vnode, hydrating)
    }
  }
  ```

  通过把 `__patch__` 方法的第四个参数 `removeOnly` 设置为 true，这样在 `updateChildren` 阶段，是不会移动 `vnode` 节点的