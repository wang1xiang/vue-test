<template>
  <div class="home">
    <input type="button" value="点击" @click="flag=!flag">
    <input type="button" value="点击,调用子组件方法" @click="getChildFunc">
    <!-- 使用animated.css实现动画  -->
    <!-- <transition enter-active-class="rollIn" leave-active-class="rollOut" :duration="{ enter: 1000, leave: 1000 }">
      <img alt="Vue logo" v-if="flag" class="animated" src="../assets/logo.png">
    </transition> -->
    <!-- 使用钩子函数实现动画  -->
    <transition 
      @before-enter="beforeEnter"
      @enter="enter"
      @after-enter="afterEnter"
      >
      <div v-show="flag" class="ball"></div>
    </transition>
    <HelloWorld ref="hello" @func="show"></HelloWorld>  <!-- 绑定方法 -->
    <router-link to="/home/login">Login</router-link>
    <router-link to="/home/register">Register</router-link>
    <router-view />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '../components/HelloWorld.vue'

export default {
  name: 'hoem',
  data() {
    return {
      flag: false
    }
  },
  components: {
    HelloWorld
  },
  mounted () {
    this.getChild()
  },
  methods: {
    show (data){
      console.log('父组件方法'+ data)
    },
    getChild() {
      console.log(this.$refs.hello.msg)
    },
    getChildFunc () {
      this.$refs.hello.show()
    },
    beforeEnter (el) {
      el.style.transform = 'translate(0,0)'
    },
    enter (el,done) {
      el.offsetWidth  // 必须加
      el.style.transform = 'translate(450px, 450px)'
      el.style.transition = 'all 2s ease'
      done()
    },
    afterEnter () {
      this.flag = !this.flag  // 控制小球显示 还可以直接跳过后场动画 
    }
  }
}
</script>
<style scoped>
  .ball{
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color:darkcyan;
  }
</style>
