<template>
  <div>
    <a-button @click="is">is方法</a-button>
    <a-button @click="assign">assign方法</a-button>
    <a-button @click="proto">__proto__方法</a-button>
    <a-button @click="clone">深度克隆</a-button>
    <a-button @click="checkClone">实现深度克隆</a-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      target: [1, 23, 4, 5, 6],
      target1: { username: 'wang', age: 25 }
    }
  },
  methods: {
    is() { // 判断两个数是否完全相等
      // eslint-disable-next-line
      console.log(0 === -0)
      // eslint-disable-next-line
      console.log(NaN === NaN)
      console.log(Object.is(0, -0))
      console.log(Object.is(NaN, NaN))
    },
    assign() { // 将原对象属性复制到新对象
      let obj = {}
      let obj1 = { name: 'wangxiang', age: '25' }
      let obj2 = { sex: '男' }
      Object.assign(obj, obj1, obj2)
      console.log(obj)
    },
    proto() { // 直接操作——proto——属性
      let obj = {}
      let obj1 = { money: 22222 }
      obj.__proto__ = obj1
      console.log(obj)
      console.log(obj.money)
    },
    /*
      拷贝数据
      基本数据类型：
        拷贝后生成一份新的数据，修改不会影响原数据
      对象/数组：
        拷贝不会生成新的数据，拷贝只是引用，修改会影响元数据
      拷贝数据方法：
        1.直接复制 // 浅拷贝
        2.Object.assign() //浅拷贝
        3.Array.prototype.concat() //浅拷贝
        4.Array.prototype.slice() //浅拷贝
        5.JSON.parse(JSON.stringfy() //深拷贝
      如何实现深度拷贝
      拷贝的数据里有对象/数组
      拷贝的数据不能有对象/数据就行了
      当有对象/数组时就继续遍历对象/数组拿到里面的每一项值，一直到拿到的是基本数据类型，然后再去复制，就是深拷贝
    
      //如何判断数据类型
      1.typeof返沪的数据类型：String, BNumber, Boolean, Undefined, Object, Function 
      2.Object.prototype.toString.call(obj)
    */
    clone() {
      let obj = { username: 'wangxiang' }
      let obj1 = Object.assign(obj)
      obj1.username = 'kobe'
      console.log(obj1)

      let arr = [1, 2, 3, 4, 5]
      let arr1 = arr.concat()
      arr1[2] = 9
      console.log(arr)
      console.log(arr1)

      let arr2 = arr.slice()
      arr2[2] = 45
      console.log(arr)
      console.log(arr2)

      let obj2 = JSON.parse(JSON.stringify(obj))
      obj2.username = 'wade'
      console.log(obj)
      console.log(obj2)
    },
    // 定义检测对象数据类型的功能函数
    checkType(target) {
      return Object.prototype.toString.call(target).slice(8, -1)
    },
    checkClone() {
      let arr = [1, 23, 4, 5, 6]
      let arr1 = this.depthClone(arr)
      console.log(arr1)
      arr1[2] = 'sss'
      console.log(arr, arr1)

      let obj = { name: 'wang', age: 25 }
      let obj1 = this.depthClone(obj)
      console.log(obj1)
      obj1.age = 18
      console.log(obj, obj1)
    },
    // 实现深度克隆
    depthClone(target) {
      // let toString = Object.prototype.toString
      // console.log(toString.call(new Date))
      // console.log(toString.call(new String))
      // console.log(toString.call(Math))
      // console.log(toString.call(undefined))
      // console.log(toString.call(null))
      // console.log(toString.call(NaN))
      // 判断数据类型
      // 初始化变量result 成为最终克隆的数据
      let result, targetType = this.checkType(target)
      if (targetType === 'Object') {
        result = {}
      } else if (targetType === 'Array') {
        result = []
      } else {
        return target
      }
      // 遍历目标对象
      for (let i in target) {
        // 获取遍历数据结构的每一项值
        let value = target[i]
        // 判断目标结构里的每一值是否存在对象/数组
        if (this.checkType(value) === 'Object' || this.checkType(value) === 'Array') {
          // 继续遍历获取到value值
          result[i] = this.clone(value)
        } else {
          result[i] = value
        }
      }
      return result
    }
  }
}

</script>
<style>
</style>