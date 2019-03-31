<template>
  <div>
    <a-button @click="newSet">new Set</a-button><br/>
    <a-button @click="add">add</a-button><br/>
    <a-button @click="deleteSet">deleteSet</a-button><br/>
    <a-button @click="has">has</a-button><br/>
    <a-button @click="clearSize">clear&size</a-button><br/>
  </div>
</template>

<script>
/*
  Set容器: 无序不可重复的多个value的集合体
  Set()
  Set(array)
  add(value)
  delete(value)
  has(value)
  clear()
  size
*/
let set = new Set([1,2,3,4,3,2,1])
export default {
  data () {
    return {
      set
    }
  },
  methods: {
    newSet () {
      let set = new Set()
      console.log(set)
      let set1 = new Set([1,2,3,4,3,2,1])
      console.log(set1)
    },
    add () {
      this.set.add(5)
      console.log(this.set)
    },
    deleteSet () {
      this.set.delete(1)
      console.log(this.set)
    },
    has () {
      console.log(this.set.has(1))
      console.log(this.set.has(5))
    },
    clearSize () {
      console.log(this.set.size)
      this.set.clear()
      console.log(this.set.size)
    }
  }
}

</script>
<style>
</style>