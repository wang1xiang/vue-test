<template>
  <div>
    <input type="text" v-model="query" />
    <function-test>
      <li v-for="(item, index) in computedList" :key="index" :data-index="index">{{item.msg}}</li>
    </function-test>
    <button @click="changeComponent">点击切换组件</button>
    <functional-choose-component :component-name="componentName">
      <span>我是{{componentName}}的slot</span>
    </functional-choose-component>
  </div>
</template>

<script>
import FunctionTest from './FunctinoTest'
import ComponentOne from '@components/Function/ComponentOne'
import FunctionalChooseComponent from '@components/Function/FunctionalChooseComponent'
import ComponentTwo from '@components/Function/ComponentTwo'
export default {
  name: 'function-start',
  components: {
    FunctionTest,
    FunctionalChooseComponent,
    // eslint-disable-next-line
    ComponentOne,
    // eslint-disable-next-line
    ComponentTwo
  },
  data() {
    return {
      query: '',
      list: [
        {
          msg: 'Lee'
        }, {
          msg: 'Chen'
        }, {
          msg: 'Wang'
        }, {
          msg: 'JOIN'
        }, {
          msg: 'ZHAO'
        }, {
          msg: 'QIAN'
        }
      ],
      componentName: 'componentOne'
    }
  },
  computed: {
    computedList() {
      return this.list.filter(item => item.msg.toLowerCase().indexOf(this.query.toLowerCase()) !== -1)
    }
  },
  methods: {
    changeComponent() {
      this.componentName = this.componentName == 'componentOne' ? 'componentTwo' : 'componentOne'
    }
  }
}

</script>
<style>
</style>