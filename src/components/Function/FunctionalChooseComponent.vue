<script>
/**
 * 
 * 通过props来加载不同的组件，并且在props传递给子组件之前操作它，组件内部定义了click.native事件来展示示例
 * 如果对同一批组件进行相同的操作，则可以使用functional，类似于工厂模式
 */
export default {
  name: 'function-choose-component',
  functional: true,
  props: {
    componentName: String
  },
  render: function (createElement, context) {
    // 给组件加上clasa
    context.data.class = [context.props.componentName]

    // 在props传递给子组件之前操作它
    context.data.props = {
      compName: context.props.componentName
    }

    context.data.nativeOn = {
      click() {
        alert('我是functinoal里面统一的点击事件')
      }
    }
    return createElement(context.props.componentName, context.data, context.children)
  }
}

</script>
<style>
</style>