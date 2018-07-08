const { promisify } = require('util');
const os = require('os');
const fs = require('fs');
const electron = require('electron');
const readdir = promisify(fs.readdir);
require('./app/main.js');

const currentWindow = electron.remote.getCurrentWindow();

console.log('Rendered file manager');
console.log(currentWindow.directory);

const listFiles = async dir => {
  const files = await readdir(dir);

  files.forEach(file => {
    console.log(file);
  });
};

listFiles(currentWindow.directory);