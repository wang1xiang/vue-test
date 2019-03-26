<template>
  <div class="hello">
    <input type="button" value="子组件" @click="myclick">
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'ssssss'
    }
  },
  methods: {
    myclick() {
      this.$emit('func', 'sss')  //调用父组件方法
    },
    show() {
      console.log('调用子组件方法')
    }
  }
}
</script>

