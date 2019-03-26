<template>
  <div>
    <router-view></router-view>
    <router-view name="left" />
    <router-view name="right" />
  </div>
</template>

<script>

export default {
 name: 'Router',
  data() {
    return{

    }
  },
  created() {
    console.log(this.$route)
  }
}

</script>
<style>
.container{
  display: flex;
}
</style>