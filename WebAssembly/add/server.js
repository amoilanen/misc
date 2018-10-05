var express = require('express');
var app = express();
var path = require('path');

app.get('/add.wasm', function (req, res) {
  res.set('Content-Type', 'application/wasm');
  res.sendFile(path.join(__dirname, 'add.wasm'));
});

app.get('/add.html', function (req, res) {
  res.sendFile(path.join(__dirname, 'add.html'));
});

const port = 8080;

app.listen(port, () => console.log(`WebAssembly demo app listening on port ${port}!`));