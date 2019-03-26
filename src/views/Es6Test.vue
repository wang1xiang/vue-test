<template>
  <div>
    <a-tabs defaultActiveKey="1">
      <a-tab-pane key="1" tab="es6">
        {{ img }}
        {{ getData }}
      </a-tab-pane>
      <a-tab-pane key="2" tab="es5">
        <p>json对象</p>
        <p>{{ getJSONstirng }}</p>
        <p>{{ getJSONparse }}</p>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
export default {
  data () {
    return {
      img: 'testEs6',
      data: []
    }
  },
  computed: {
    getData() {
      let [a,b,c] = [1,2,3,4,5]
      console.log(a, b, c)
      let [, , d] = [4,5,6]
      console.log(d)
      let {name, age} = {name: 'zhangsan', age: 12}
      console.log(name + age)
      return 0
    },
    getJSONstirng() {
      let a = {user:'wx',pass:'123'}
      a = JSON.stringify(a)
      return a
    },
    getJSONparse() {
      let a = {name:'wx',age:'25'}
      a = JSON.stringify(a)
      console.log(typeof a)
      a = JSON.parse(a)
      console.log(typeof a)
      return a
    },
    setProperties() {
      let obj = { firstName: 'w', lastName: 'x' }
      Object.defineProperties(obj, {
        fullName () {
          console.log('get()')
          return this.firstName + this.lastName
        }
      })
      console.log(obj.fullName)
      return 0
    }
  }
}

</script>
<style>
</style>