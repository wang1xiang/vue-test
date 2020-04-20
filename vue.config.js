const resolve = require('path').resolve

module.exports = {
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@api': resolve(__dirname, './src/api'),
        '@views': resolve(__dirname, './src/views'),
        '@config': resolve(__dirname, './src/config')
      }
    }
  },
  // 通过chainWebpack自定义打包入口
  chainWebpack: config => {
    config.when(process.env.NODE_ENV === 'production', config => {
      config.set('externals', {
        vue: 'Vue',
        'vue-router': 'VueRouter',
        axios: 'axios',
        lodash: '_',
        echarts: 'echarts',
        nprogress: 'NProgress'
      })
      config.plugin('html').tap(args => {
        args[0].isProd = true
        return args
      })
      config.entry('app').clear().add('./src/main-prod.js')
    })
    config.when(process.env.NODE_ENV === 'development', config => {
      config.entry('app').clear().add('./src/main-dev.js')
      config.plugin('html').tap(args => {
        args[0].isProd = false
        return args
      })
    })
  }
}
