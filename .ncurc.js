module.exports = {
  format: [
      'group',
      'repo',
      'ownerChanged',
  ],
  reject: [
      // requires backend update
      'centrifuge',
      // require test
      'qr-scanner',
      // vue 3
      'vuex',
      '@nuxt/content',
      'qrcode.vue',
      // nuxt 3 (webpack5)
      'less-loader',
      // es modules
      'beeper',
      'camelcase-keys',
      'del',
      'gulp-imagemin',
      'imagemin-mozjpeg',
      'nanoid',
  ],
};
