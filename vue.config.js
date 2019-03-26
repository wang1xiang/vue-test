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
  }
}
