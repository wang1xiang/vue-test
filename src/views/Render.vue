<template>
  <div>
    <render-test :level="1">
      我是h1
      <span slot="subTitle">我是subTitle</span>
    </render-test>
    <render-test-first @click.native="nativeClick" @button-click="clickButton"></render-test-first>
    <render-test-slot></render-test-slot>
    <render-test-scope-slot></render-test-scope-slot>
    <render-test-dirctives :items="items"></render-test-dirctives>
    <jsx-test></jsx-test>
    <function-start></function-start>
  </div>
</template>

<script>
import RenderTest from '@components/Render/RenderTest'
import RenderTestFirst from '@components/Render/RenderTestFirst'
import RenderTestSlot from '@components/Render/RenderTestSlot'
import RenderTestScopeSlot from '@components/Render/RenderTestScopeSlot'
import RenderTestDirctives from '@components/Render/RenderTestDirctives'
import JsxTest from '@components/JSX/JsxTest'
import FunctionStart from '@components/Function/FunctionStart'
export default {
  name: 'render',
  components: {
    RenderTest,
    RenderTestFirst,
    RenderTestSlot,
    RenderTestScopeSlot,
    RenderTestDirctives,
    JsxTest,
    FunctionStart
  },
  data() {
    return {
      items: [
        {
          key: 1,
          name: 'jack'
        },
        {
          key: 2,
          name: 'join'
        }
      ]
    }
  },
  /**
   * 实例属性
   * vm.$data Object vue实例观察的数据对象 data中的响应数据可以通过vm.$data.a访问
   * vm.$props Object 当前组件接收到的props对象
   * vm.$el Element vue实例使用的根dom元素
   * vm.$options Object 用于当前vue实例的初始化选项 选项中包含自定义属性时有用
   * vm.$parent Vue instance 父实例
   * vm.$root Vue instance 当前组件树的根实例 如果没有父实例 代表自己
   * vm.$children Array<Vue instance> 当前实例的直接子组件 $children不保证顺序也不是响应式的
   * vm.$slots {[name: string]: ?Array<VNode>} 用来访问被插槽分发的内容 具名插槽有其响应的属性(v-slot:foo将在vm.$slots.foo中被找到))
   *  default属性包括了所有的没有被包含在具名插槽中的节点
   * vm.$scopedSlots {[name:string]: props => Array<VNode> | undefined} 用来访问作用域插槽 返回一个VNode数组
   * vm.$ref Object 所有注册过ref的Dom元素和组件实例
   * vm.$isServe Boolean 当前vue实例是否运行在服务器
   * vm.$attrs {[key: string]: string } 当一个组件没有声明任何prop时 这里包含所有父作用域的绑定
   * vm.$listeners {[key: string]: Function | Array<Function>} 包含父作用域的v-on事件监听器
   * 
   * 实例方法/数据
   * vm.$watch(expOrFn,callback,[options])
   * 参数 expOrFn {string | Function} callback {Function | Object} options { deep,immediate }
   * 返回值 unwatch {Function } 
   * 用法：观察Vue实例变化的一个表达式或计算属性函数(表达式只接受键路径，对于复杂的表达式用函数替代)
   * 例子：键路径 vm.$watch('a.b.c',(val1,val2) => {})
   * 函数 vm.$watch(() => {return this.a + this.b}, (val1,val2) => {})
   * vm.$watch返回一个取消观察函数，用来停止触发回调
   * deep：true发现对象内部值的变化 vm.$watch('Object', callback, {deep: true}) vm.Object.a = 1
   * immediate:true将立即以表达式的当前值触发回调
   * vm.$set(target, propertyName/index, value) 全局Vue.set的别名
   * vm.$delete(target, propertyName/index) 全局Vue.delete的别名
   * 
   * 实例方法/事件
   * vm.$on(event, callback)
   * 参数 event {string | Array<string>}
   * 监听当前实例上的自定义事件 事件可以由vm.$emit触发
   * 例子：vm.$emit('test', 'hi') vm.$on('test', (val) => {console.log(val)})
   * vm.$once(event, callback)
   * 参数：event {string}
   * 监听一个自定义事件，但是只触发一次，一旦触发监听器就被移除
   * vm.$off([event, callback])
   * 参数：event{string|Array<string>}
   * 移除自定义事件监听器(如果没提供参数移出所有监听器 如果提供了事件移除该事件所有的监听器 如果提供事件和回调只移除这个回调的监听器)
   * vm.$emit(eventName,[...args])
   * 参数：eventName{string}
   * 触发当前实例上的事件，附加参数传给监听器回调
   * 
   * 实例方法/生命周期
   * vm.$mount([elementOrSelector])
   * 参数：[elementOrSelector] { Element|string }
   * 返回值：vm实例本身
   * 如果Vue实例在实例化时没有收到el属性 处于为挂载状态 没有关联的DOM元素 可以使用vm.$mount手动挂载一个未挂载的实例
   * 这个方法返回实例本身 因而可以使用链式调用其他实例方法
   * vm.$forceUpdate() 迫使Vue实例重新渲染，仅影响实例本身和插入插槽内容的子组件
   * vm.$nextTick([callback]) 相当于全局Vue.$nextTick()
   * 
   * createElement参数
   * @return {Vnode}
   * createElement(
   * // { string | object | Function }
   * // 一个Html标签名，组件选项对象
   * 'div',
   *  // {object}
   *  // 一个与模板属性中属性对应的数据对象，可选
   *  {
   *    
   *  },
   *  // { String | Array }
   *  // 子级虚拟节点。由createElement构成
   *  [
   *    '先写一些文字',
   *    createElement('h1','一则头条'),
   *    createElement(MyComponent, {
   *      props： {
   *        someProp: 'foobar'
   *      }
   *    })
   *  ]
   * )
   * 
   * 深入数据对象
   * {
        // 与v-bind:class的API相同
        // 接收一个字符串、对象或者字符串和对象组成的数组
        'class': {
          foo: true,
          bar: false
        },
        // 与v-bind:style的API相同
        // 接收一个字符串、对象或者字符串和对象组成的数组
        'style': {
          color: 'red',
          fontSize: '14px'
        },
        // 普通的HTMl属性
        attrs: {
          id: 'foo'
        },
        // 组件prop
        props: {
          myProp: 'bar'
        },
        // DOM属性
        domProps: {
          innerHTML: 'baz'
        },
        // 事件监听器在'on'属性内，
        // 但不再支持v-on:keyup.enter这样的修饰器
        // 需要在处理函数中手动检查keyCode
        on: {
          click: this.clickHandler
        },
        // 仅用于组件，用于监听原生事件，而不是组件内部使用
        // vm.$emit触发的事件
        vue中<h @click="onClick"/> 这样写没错
        假如有一个组件<comA @click="onClick"></comA>不行 所以加上.native就行 <comA @click.native="onClick"></comA>
        如果createElement创建的是原生HTML元素，那么nativeOn就没有意义 而createElement('组件名称')时就有意义
        nativeOn: {
          click: this.nativeClickHandler
        },
        // 自定义指令 无法对bindind中的oldValue赋值
        // vue已经自动进行了同步
        directives: [
          {
            name: 'my-custom-directives',
            value: 2,
            expression: '1+1',
            arg: 'foo',
            modifiers: {
              bar: true
            }
          }
        ],
        // 作用域插槽的格式为
        // {name: props => VNode | Array<VNode>}
        scopedSlots: {
          default: props => createElement('span', props.text)
        },
        // 如果组件是其他组件的子组件，需要为插槽指定名称
        slot: 'name-of-slot',
        // 其他特殊层属性
        key: 'myKey',
        ref: 'myRef',
        // 如果在渲染函数中给多个元素都应用了相同的ref名
        // 那么'$refs.myRef'会变成一个数组
        refInFor: true
      }
      
      事件$按键修饰符
      template事件修饰符                render写法前缀
      .passive                         &
      .capture                         !
      .once                            ~
      .capture.once 或 .once.capture   !~
      例子 on: {
        '!click': this.clickHandler,
        '~keyup': this.keyupHandler,
        '!~mouseover': this.mouseover
      }

      template事件修饰符                对应的事件方法
      .stop                            event.stopPropagation()
      .prevent                         event.preventDefault()
      .self                            if (event.target !== event.currentTarget) return 
      Keys: .enter .13                 if (event.keyCode === 13) return
      例子 on: {
        keyup: function(event) {
          if (event.target !== event.currentTarget) return
          if (!event.shiftKey || event.keyCode !== 13) return
          event.stopPropagation()
          event.preventDefault()
        }
      }
   * 
   */
  methods: {
    nativeClick() {
      console.log('这是组件外部click.native触发的事件，第二个组件被点击了')
    },
    clickButton() {
      console.log('这是组件外部触发的【emit】事件，第二个组件被点击了')
    }
  }
}

</script>
<style>
</style>