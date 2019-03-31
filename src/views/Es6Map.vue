<template>
  <div>
    <a-button @click="newMap">new Map</a-button><br/>
    <a-button @click="set">set</a-button><br/>
    <a-button @click="get">get</a-button><br/>
    <a-button @click="deleteMap">deleteMap</a-button><br/>
    <a-button @click="has">has</a-button><br/>
    <a-button @click="clearSize">clear&size</a-button><br/>
  </div>
</template>

<script>
/*
  Map容器: 无序的key不可重复的多个key-value的集合体
  Map()
  Map(array)
  set(key, value)
  get(key)
  delete(key)
  has(key)
  clear()
  size
*/
let map = new Map()
export default {
  data () {
    return {
      map
    }
  },
  methods: {
    newMap () {
      let map = new Map()
      console.log(map)
      let map1 = new Map([['name', 'wang'],['age', 25]])  // key-value用逗号隔开
      console.log(map1)
    },
    set () {
      this.map.set('name', 'wangx')
      this.map.set('age', 25)
      this.map.set('sex', '男')
      console.log(this.map)
    },
    get () {
      console.log(this.map.get('sex'))
    },
    deleteMap () {
      this.map.delete('sex')
      console.log(this.map)
    },
    has () {
      console.log(this.map.has('sex'))
      console.log(this.map.has('age'))
    },
    clearSize () {
      console.log(this.map.size)
      this.map.clear()
      console.log(this.map.size)
    }
  }
}

</script>
<style>
</style>