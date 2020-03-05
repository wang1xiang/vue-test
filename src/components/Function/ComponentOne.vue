<script>
export default {
  name: 'component-one',
  props: {
    compName: String
  },
  render: function (createElement) {
    return createElement('div', [
      `我是第一个组件，我的名字是${this.compName}`,
      ...this.$slots.default
    ])
  }
}

</script>
<style>
</style>