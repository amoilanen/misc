var help = [
  'Command line tool to unuglify a JavaScript file.',
  '',
  'Before using install js-beautify:',
  '',
  'npm install js-beautify',
  '',
  'To unuglify file code.js run:',
  '',
  'node unuglify code.js > code.unuglified.js'
].join('\n');

var beautify = require('js-beautify').js_beautify;
var fs = require('fs');

var beautifyOptions = {
  indent_size: 2
};

function unuglify(file, callback) {
  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      throw err;
    }
    callback(beautify(data, beautifyOptions));
  });
}

var codePath = process.argv[2];

if (codePath) {
  unuglify(codePath, function(unuglifiedCode) {
    console.log(unuglifiedCode);
  });
} else {
  console.log(help);
}