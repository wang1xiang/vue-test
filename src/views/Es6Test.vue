<template>
  <div>
    <a-tabs defaultActiveKey="1">
      <a-tab-pane key="1" tab="es6">
        {{ img }}
        <br />
        <p>解构赋值</p>
        {{ getData }}
        <br />
        <a-button @click="getTemplate">获取模板字符串</a-button>
        {{ templateStr }}
        <br />
        <a-button @click="getRest">扩展运算符</a-button>
        {{ restStr }}
        <br />
        <a-button @click="getPromisr">promise对象</a-button>
        <br />
        <a-button @click="iterator">for of</a-button>
        <br />
        <a-button @click="foo">async/await</a-button>
        <br />
        <router-link to="/esTest/array">Array</router-link>|
        <router-link to="/esTest/object">Object</router-link>|
        <router-link to="/esTest/set">Set</router-link>|
        <router-link to="/esTest/map">Map</router-link>
        <router-view></router-view>
      </a-tab-pane>
      <a-tab-pane key="2" tab="es5">
        <p>json对象</p>
        <p>{{ someFun }}</p>
        <p>{{ everyFun }}</p>
        <p>{{ getJSONstirng }}</p>
        <p>{{ getJSONparse }}</p>
        <a-button @click="forIn">for in</a-button>
        <br />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
/* 真正意义上解决异步回调的问题，同步流程表达异步操作
  本质：Generator的语法糖
  语法：
    async function foo {
      await 异步操作；
      await 异步操作
    }
  特点：
    1.不需要像Generator去调用next方法，通过await等待，当前的异步操作完成就继续往下执行
    2.返回的promise对象，可以用then方法进行下一步操作
    3.async取代Generator函数的星号*，await取代yield
    4.更简单
*/
async function foo1() {
  let s = await setTimeout(() => {
    console.log('222')
  }, 2000)
  return s
}
export default {
  data() {
    return {
      img: 'testEs6',
      data: [],
      templateStr: '',
      restStr: ''
    }
  },
  computed: {
    getData() { // 数组解构赋值 解析源数据结构并赋值给前面数据
      let [a, b, c] = [1, 2, 3, 4, 5]
      console.log(a, b, c)
      let [, , d] = [4, 5, 6]
      console.log(d)
      let { name, age } = { name: 'zhangsan', age: 12 }
      console.log(name + age)
      return 0
    },
    getJSONstirng() {
      let a = { user: 'wx', pass: '123' }
      a = JSON.stringify(a)
      return a
    },
    getJSONparse() {
      let a = { name: 'wx', age: '25' }
      a = JSON.stringify(a)
      console.log(typeof a)
      a = JSON.parse(a)
      console.log(typeof a)
      return a
    },
    setProperties() {
      let obj = { firstName: 'w', lastName: 'x' }
      Object.defineProperties(obj, {
        fullName() {
          console.log('get()')
          return this.firstName + this.lastName
        }
      })
      console.log(obj.fullName)
      return 0
    },
    someFun() {
      let obj = [
        { user: 'aaa', pass: '123' },
        { user: 'bbb', pass: '456' },
        { user: 'ccc', pass: '789' }
      ]
      return obj.some(item => item.user === 'ccc') // 箭头函数特点 1、简洁 2、没有自己的this，不是调用的时候决定，而是定义的时候决定 3、看外层是否有函数，有的话外层函数this就是内层函数this，没有就是window
    },
    everyFun() {
      // let obj = [
      //   {user: 'aaa', pass: '123'},
      //   {user: 'bbb', pass: '456'},
      //   {user: 'ccc', pass: '789'}
      // ]
      // return obj.every(item => item.user === 'ccc')
      let obj = [
        { user: 'aaa', pass: '123', key: 1 },
        { user: 'bbb', pass: '456', key: 1 },
        { user: 'ccc', pass: '789', key: 1 }
      ]
      return obj.every(item => item.key === 1)
    }
  },
  methods: {
    getTemplate() {  //模板字符串
      let obj = { firstName: 'kobe', age: 41 }
      this.templateStr = `名字是${obj.firstName},年龄是${obj.age}`
    },
    getRest() {
      let a = [2, 3, 4, 5]
      let b = [1, ...a, 6]
      this.restStr = b
      console.log(this.getSum(2, 3, 4))
    },
    getSum(...values) { // 用来取代arguments 但比arguments灵活， 只能是最后的形参参数
      let sum = 0
      values.forEach(item => {
        sum = item + sum
      })
      return sum
    },
    /*
    promise对象，通常是一个异步操作，可以将异步操作以同步形式表达出来，避免层层嵌套，ES6 Promise对象是一个构造函数，用来生成Promise实例
    步骤：创建Promise对象
      let promise = new Promise((resolve, reject) => {
        // 初始化时promise状态为pending
        // 执行异步操作
        if(异步操作成功) {
          resolve(value) // 修改promise的状态为fullfiled
        } else {
          reject(errorMsg) // 修改promise的状态为rejected
        }
      })
      调用Promise的then() 
      promise.then(() => {
        result => console.log(result)
        errorMsg => console.log(errorMsg)
      })
    */
    getPromisr() {
      let promise = new Promise((resolve) => {
        console.log('111')
        setTimeout(() => {
          console.log('333')
          resolve('success')
        }, 2000)
      })
      promise.then(data => {
        console.log('222')
        console.log(data)
      }, error => {
        console.log(error)
      })
    },
    forIn() {
      let a = [1, 23, 45, 6, 7, 8, 9]
      for (let item in a) {
        console.log('--' + item)
      }
      let b = { name: 'wang', age: 25, sex: '男' }
      for (let item in b) {
        console.log('--' + item)
      }
    }, //for in遍历键值/下标，for of遍历value/值
    iterator() { // 数组，字符串，arguments，set容器，map容器
      let a = [1, 23, 45, 6, 7, 8, 9]
      for (let item of a) {
        console.log('--' + item)
      }
    },
    foo() {
      let s = foo1()
      console.log(s)
    }
  }
}

</script>
<style>
</style>