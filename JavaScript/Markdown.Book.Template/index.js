const showdown  = require('showdown');

const converter = new showdown.Converter();

converter.setOption('omitExtraWLInCodeBlocks', true);

const text = `Multiline string
#hello, markdown!
\`\`\`javascript
var x = 1;
\`\`\`
xyz`;
const html = converter.makeHtml(text);

console.log('html = ', html);

//TODO: Prototype including a simple plugin into the markdown and processing the markdown

//TODO: Include LaTeX expressions

//TODO: Read markdown chapters from the books directory
//output the book into the 'html' folder, clean 'html' folder before

//TODO: Include code with code lines into the markdown