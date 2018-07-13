const Vue = require('vue/dist/vue');
const Vuex = require('vuex');
const { listFiles } = require('api/filesystem');

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    directory: null,
    files: []
  },
  mutations: {
    setDirectory(state, directory) {
      state.directory = directory;
    },
    setFiles(state, files) {
      state.files = files;
    }
  },
  actions: {
    goToDirectory: async (context, directory) => {
      context.commit('setDirectory', directory);
      const files = await listFiles(directory);
      context.commit('setFiles', files);
    }
  },
  getters: {
    visibleFiles: state => {
      return state.files.filter(file => !file.startsWith('.'))
    }
  }
});

module.exports = store;