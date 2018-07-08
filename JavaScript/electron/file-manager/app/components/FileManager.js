const { mapGetters } = require('vuex');

const FileManager = {
  props: ['files'],
  template: `<div class="file-list-container">
    <div class="file-container" v-for="file in visibleFiles">
      {{ file }}
    </div>
  </div>`,
  computed: {
    ...mapGetters([
      'visibleFiles'
    ])
  }
};

module.exports = FileManager;