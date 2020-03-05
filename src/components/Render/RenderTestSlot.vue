<script>
/*
  createElement中slot属性的用法
 */
export default {
  name: 'render-test-second',
  props: {},
  data() {
    return {

    }
  },
  components: {
    TestSlot: {
      name: 'test-slot',
      render(createElement) {
        this.$slots.slottest = this.$slots.slottest || []
        return createElement(
          'div',
          [
            '我是组件testslot内容',
            ...this.$slots.slottest
          ]
        )
      }
    },
    TestSlotIn: {
      name: 'test-slot-in',
      render(createElement) {
        return createElement(
          'div',
          {
            style: {
              color: 'red'
            }
          },
          [
            '我是组件testslotin内容'
          ]
        )
      }
    }
  },
  render: function (createElement) {
    return createElement(
      'div',
      {
        style: {
          marginTop: '15px'
        }
      }, [
      createElement('test-slot', [
        createElement('test-slot-in', {
          slot: 'slottest'
        })
      ])
    ]
    )
  }
}

</script>
<style>
</style>