<script>
export default {
  name: 'component-two',
  props: {
    compName: String
  },
  render: function (createElement) {
    return createElement('div', [
      `我是第二个component，我的名字是${this.compName}`,
      ...this.$slots.default
    ])
  }
}

</script>
<style>
</style>