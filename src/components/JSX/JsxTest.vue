<script type="text/jsx">
/**
 * JSX语法
 * 基本内容
 * render() {
 *    reutrn <p>content</p>
 * }
 * 动态内容
 * render() {
 *    return <p>hello{this.message}</p>
 * }
 * 引入组件
 * import ComA from './ComA'
 * export default {
 *    render() {
 *      return <com-a>hello</com-a>
 *    }  
 * }
 * 属性/props
 * render() {
 *  return <input type="password"/>
 * }
 * 动态绑定
 * render() {
 *  return <input placeholder={this.placeholder}/>
 * }
 * 使用展开运算符（对象需要与Vue数据对象兼容）：
 * render() {
 *  const inputAttrs = {
 *    type: 'password',
 *    placeholder: 'enter your email'
 *  }
 *  return <input {...{ attrs: inputAttrs }} />
 * }
 * 插槽
 * 具名插槽
 * render() {
 *  return(
 *    <MyComponent>
 *      <header slot="header">header</header>
 *      <footer slot="footer">footer</footer>
 *    </MyComponent>
 *  )
 * }
 * 自定义指令
 * <input vModel={this.newTodoText} /> // v-model
 * 修饰符
 * <input vModel_trim={this.newTodoText} />v-model.trim用于去掉输入框内首尾空格
 * 带参数
 * <input vOn:click={this.newTodoText} />
 * 带参数和修饰符
 * <input vOn:click_stop_prevent={this.newTodoText} />
 * v-html
 * <p domPropsInnerHTML = {html} />
 * 函数式组件
 * 
 * 
 * 1.通过props传入颜色，并在子组件配置
 * 2.点击改变颜色
 * 3.点击事件通过native获取
 */
import JsxTestChild from './JsxTestChild'
export default {
  name: 'jsx-test',
  components: {
    JsxTestChild
  },
  data() {
    return {
      color: 'red'
    }
  },
  props: {

  },
  // eslint-disable-next-line
  render: function (h) {
    return (
      <div class="jsx-test">
        <jsx-test-child color={this.color} nativeOnClick={this.clickHandler}>
          <span>jsx-test-child组件的slot，color变量通过变量传入：{this.color}</span>
        </jsx-test-child>
      </div>
    )
  },
  methods: {
    clickHandler() {
      this.color = this.color === 'red' ? 'blue' : 'red'
      console.log(`点击了jsx-test-child，通过native触发，改变了颜色[${this.color}]`)
    }
  }
}

</script>
<style>
</style>