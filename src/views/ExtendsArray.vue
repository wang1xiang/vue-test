<template>
  <div>
    <a-button @click="from">from方法</a-button>
    <a-button @click="of">of方法</a-button>
    <a-button @click="find">find方法</a-button>
    <a-button @click="findIndex">findIndex方法</a-button>
  </div>
</template>

<script>
export default {
  methods: {
    from () {
      let btns = document.getElementsByTagName('button')
      Array.from(btns).forEach(item => { // 将伪数组转换为数组
        console.log(item)
      })
    },
    of () {
      let arr = Array.of(1,2,3,'sss')
      console.log(arr)
    },
    find() {
      let arr = [1,2,3,5,6,7,8]
      let result = arr.find(item => { // 返回第一个满足的元素
        return item > 4
      })
      console.log(result)
    },
    findIndex() {
      let arr = [1,2,3,5,6,7,8]
      let result = arr.findIndex(item => { // 返回第一个满足的元素下标
        return item > 4
      })
      console.log(result)
    },
  }
}

</script>
<style>
</style>