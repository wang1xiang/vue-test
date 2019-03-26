<template>
  <div class="title">
    <a-card key="login" title="登陆">
       <a-form
        :form="form"
        @submit="handleSubmit"
      >
        <a-form-item
          label="用户名:"
          :label-col="{ span: 5 }"
          :wrapper-col="{ span: 12 }"
        >
          <a-input
            v-decorator="[
              'username',
              {rules: [{ required: true, message: 'Please input your username!' }]}
            ]"
          />
        </a-form-item>
        <a-form-item
          label="密码:"
          :label-col="{ span: 5 }"
          :wrapper-col="{ span: 12 }"
        >
          <a-input
            v-decorator="[
              'password',
              {rules: [{ required: true, message: 'Please input your password!' }]}
            ]"
          />
        </a-form-item>
        <a-form-item
          :wrapper-col="{ span: 12, offset: 5 }"
        >
          <a-button
            type="primary"
            html-type="submit"
          >
            Submit
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script>
export default {
  name: 'login',
  data () {
    return {
      formLayout: 'horizontal',
      form: this.$form.createForm(this)
    }
  },
  methods: {
     handleSubmit (e) {
      e.preventDefault();
      this.form.validateFields((err, values) => {
        if (!err && (values.username === 'admin' && values.password === '1' )) {
          this.$router.push('/home')
        }
      })
    }
  }
}

</script>
<style scoped>
</style>
