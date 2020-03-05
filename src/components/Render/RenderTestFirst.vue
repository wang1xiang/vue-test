<script>
export default {
  name: 'renderTestFirst',
  props: {

  },
  data() {
    return {
      msg: '这是data的数据',
      selected: true
    }
  },
  render: function (createElement) {
    return createElement(
      'div',
      {
        class: [
          { 'change-color': this.selected },
          'render-first'
        ],
        // style: {
        //   color: 'blue'
        // },
        attrs: {
          id: 'first'
        },
        props: {
          myProps: 'bar'
        },
        on: {
          click: this.clickText
        }
      },
      [
        '这是第二个组件，点击触发此组件方法和父组件的native方法',
        createElement('div', `${this.msg}${this.myProps}`),
        createElement('button', {
          on: {
            click: this.clickButton
          }
        }, '触发emit')
      ]
    )
  },
  methods: {
    clickText() {
      this.selected = !this.selected
      console.log('组件内部触发事件')
    },
    clickButton(e) {
      e.stopPropagation()
      console.log('点击button，触发emit')
      this.$emit('buttonClick', e)
    }
  }
}

</script>
<style scoped>
.render-first {
  margin-top: 15px;
}
.change-color {
  color: red;
}
</style>