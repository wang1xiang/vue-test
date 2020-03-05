<script>
export default {
  name: 'render-test-directives',
  components: {
    List: {
      name: 'list',
      props: {
        items: {
          type: Array
        }
      },
      render(createElement) {
        if (this.items.length) {
          return createElement('ul', this.items.map(item => {
            return createElement('li', item.name)
          }))
        } else {
          return createElement('p', 'No Item found')
        }
      }
    },
    BindValue: {
      name: 'bind-value',
      props: {
        value: {
          type: String,
          default: ''
        }
      },
      render(createElement) {
        let self = this
        return createElement('input', {
          domProps: {
            value: self.value
          },
          on: {
            input: function (e) {
              self.$emit('input', e.target.value)
            }
          }
        })
      }
    }
  },
  props: {
    items: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {
      value: 'ss'
    }
  },
  render: function (createElement) {
    return createElement('div', [
      createElement('list', {
        props: {
          items: this.items
        }
      }),
      createElement('bind-value', {
        props: {
          value: this.value
        }
      })
    ])
  }
}

</script>
<style>
</style>