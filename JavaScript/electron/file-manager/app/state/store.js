const Vue = require('vue/dist/vue');
const Vuex = require('vuex');

const fs = require('fs');
const readdir = promisify(fs.readdir);

//TODO: Extract this to a separate file system access layer
const listFiles = async dir => {
  const files = await readdir(dir);

  /*
  files.forEach(file => {
    console.log(file);
  });
  */
  return files;
};

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