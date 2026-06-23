const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  // Título de la pestaña del navegador
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'NeuroLab Inventory'
      return args
    })
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/')
      }
    }
  }
})
