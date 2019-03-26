<template>
  <div class="about">
    <h1>{{ $route.query.id }} --- {{ $route.query.name }}</h1>
    <h1>{{ $route.params.id }} --- {{ $route.params.name }}</h1>
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
