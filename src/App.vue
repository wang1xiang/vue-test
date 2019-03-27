<template>
  <div id="app">
    <div id="nav">
      <router-link to="/home">Home</router-link> |
      <router-link to="/Router?id=10&name=zs">Router-query</router-link> |
      <router-link to="/Router/12/ls">Router-param</router-link> |
      <router-link to="/watch">watch&computed</router-link> |
      <router-link to="/esTest">es6test</router-link> |
      <router-link to="/todolist">todoList</router-link> |
    </div>
    <transition mode="out-in">
      <router-view/>
    </transition>
    <!-- <router-view style="background-color:darkcyan;height:200px"></router-view>  命名视图
    <div style="display:flex;padding:0;margin:0;height:600px">
      <router-view style="flex:2;background-color:lightcoral;" name="a" />
      <router-view style="flex:8;background-color:lawngreen;" name="b" />
    </div> -->
  </div>
</template>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
.router-link-active {
  color: lightcoral;
  font-weight: 200;
  font-style: italic;
  font-style: 20px;
  text-decoration: underline;
  background-color:darkcyan;
}
.v-enter,
.v-leave-to {
  opacity: 0;
  transform: translateX(140px);
}
.v-enter-active,
.v-leave-active {
  transition: all 1s ease;
}
</style>
