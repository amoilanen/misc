const fs = require('fs');
const readdir = promisify(fs.readdir);

const listFiles = async dir => {
  const files = await readdir(dir);

    /*
    files.forEach(file => {
      console.log(file);
    });
    */
  return files;
};

module.exports = {
  listFiles
};