<script>
import Velocity from 'velocity-animate'
export default {
  name: 'function-test',
  functional: true, //函数式组件
  render: function (createElement, context) {
    let data = {
      props: {
        tag: 'ul',
        css: false
      },
      on: {
        beforeEnter: function (el) {
          el.style.opacity = 0
          el.style.height = 0
        },
        enter: function (el, done) {
          let delay = el.dataset.index * 150
          setTimeout(() => {
            Velocity(el, {
              opacity: 1,
              height: '60px'
            }, {
              complete: done
            })
          }, delay)
        },
        level: function (el, done) {
          let delay = el.dataset.index * 150
          setTimeout(() => {
            Velocity(el, {
              opacity: 0,
              height: 0
            }, {
              complete: done
            })
          }, delay)
        }
      }
    }
    return createElement('transition-group', data, context.children)
  }
}

</script>
<style>
</style>