const Vue = require('vue/dist/vue');
const FileManager = require('components/FileManager');
const store = require('state/store');

Vue.config.productionTip = false;

new Vue({
  store,
  el: '#fileManager',
  render: h => h(FileManager)
});