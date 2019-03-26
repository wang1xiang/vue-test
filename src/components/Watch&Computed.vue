<template>
  <div>
    <input type="text" v-model="first"> +
    <input type="text" v-model="second"> =
    <input type="text" v-model="all">
    <input type="text" v-model="allCom">
    <p>{{ allCom }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      first: '',
      second: '',
      all: ''
    }
  },
  computed: {
    allCom () {
      console.log('调用')
      return this.first + this.second
    }
  },
  watch: {
    first: {
      handler (val) {
        this.all = val + this.second
      }
    },
    second: {
      handler (val) {
        this.all = this.first + val
      }
    }
  }
}

</script>
<style>
</style>