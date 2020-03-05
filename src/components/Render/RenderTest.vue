<script>
export default {
  name: 'renderTest',
  props: {
    level: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      msg: 0
    }
  },
  render: function (createElement) {
    this.$slots.subTitle = this.$slots.subTitle || []
    return createElement(
      'h' + this.level,
      {
        class: 'h1-test'
      },
      // this.$slots.default
      // this.$slots.subTitle
      [
        ...this.$slots.default,
        ...this.$slots.subTitle,
        this.msg,
        createElement('button', {
          on: {
            click: this.clickHandler
          },
        }, '改变data值')
      ]
    )
  },
  methods: {
    clickHandler() {
      this.msg = Math.ceil(Math.random() * 1000)
    }
  }
}

</script>
<style>
</style>