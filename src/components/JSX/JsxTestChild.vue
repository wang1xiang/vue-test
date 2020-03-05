<script>
export default {
  name: 'jsx-test-child',
  props: {},
  data() {
    return {

    }
  },
  render: function (createElement) {
    return createElement('div', {
      class: 'jsx-test-child',
      style: {
        color: this.$attrs.color
      }
    }, this.$slots.default)
  }
}

</script>
<style>
</style>