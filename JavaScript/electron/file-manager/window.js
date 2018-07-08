const os = require('os');
const fs = require('fs');
const electron = require('electron');
const currentWindow = electron.remote.getCurrentWindow();

console.log('Rendered file manager');
console.log(currentWindow.directory);
fs.readdir(currentWindow.directory, (err, files) => {
  files.forEach(file => {
    console.log(file);
  });
});