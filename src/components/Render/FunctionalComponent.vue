<script>
/**
 * 
 * 函数式组件(functional)：没有管理任何状态，也没有监听任何传递给它的状态，也没有生命周期方法，无状态(无响应式数据)、无实例(没有this上下文)
 * 像这样：
 * Vue.component('my-component', {
 *  function: true,
 *  // props是可选的
 *  props: {
 *  },
 *  // 为了弥补缺少的this实例，提供第二个参数作为上下文
 *  render: funciton(createElement, context) {
 *  }
 * })
 * 单文件组件
 * <template functoinal></template>
 * 组件需要的一切都是通过context来传递，context是包含以下字段的对象：
 * props:提供所有prop的对象
 * children:VNode子节点的数组
 * slots:一个数组，包含所有插槽
 * scopedSlots:传入的作用域插槽的对象，或返回普通插槽的函数
 * data:传递给组建的整个数据对象，作为createElement的第二个参数传入组件
 * parent:对父组件的引用
 * listeners:包含所有父组件为当前组件注册的事件监听器的对象，data.on的一个别称
 * injections:如果使用inject选项，则该对象包含了应当被注入的属性
 * functional相当于一个传函数，内部不存储用于在界面上展示的数据，传入什么，展示什么，传入的是相同的数据，展示的必然是相同的
 * 优点：因为函数式组件只是一个函数，所有开销会低很多
 * 使用场景：1.仅仅作为接收参数的组件，不做任何状态管理和监听状态
 * 2.包装动画组件，因为动画组件不需要状态管理这些
 * 3.程序化的在多个组件中选择一个
 * 4.在将children、props、data传递给子组件之前操作它们
 * 
 */
export default {

}

</script>
<style>
</style>