const Vue = require('vue/dist/vue.js');
const FileManager = require('./components/FileManager');

Vue.config.productionTip = false;

new Vue({
  el: '#fileManager',
  render: h => h(FileManager)
});