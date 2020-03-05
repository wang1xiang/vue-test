<script>
/**
 * 
 * 深入createElement中scopedSlot用法
 */
export default {
  name: 'render-test-scoped-slot',
  props: {

  },
  data() {
    return {}
  },
  components: {
    TestScoped: {
      name: 'test-scoped',
      props: {
        message: String
      },
      // 等价于<div><slot :text="message"></slot></div>
      render(createElement) {
        return createElement(
          'div', [
          this.$scopedSlots.default({
            text: this.message
          })
        ]
        )
      }
    }
  },
  render: function (createElement) {
    /*
      <div style="margin-top:15px">
        <test-scoped message="测试scopedSlots，传入message">
          <span slot-scoped="props">{{props.text}}</span>
        </test-scoped>
      </div>
    */
    return createElement('div', {
      style: {
        marginTop: '15px'
      }
    },
      [
        createElement('test-scoped', {
          props: {
            message: '测试scopedSlots，传入message'
          },
          scopedSlots: {
            default: function (props) {
              return createElement('span', props.text)
            }
          }
        })
      ])
  }
}

</script>
<style>
</style>