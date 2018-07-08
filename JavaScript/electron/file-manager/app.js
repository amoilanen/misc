const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

let window = null

// Wait until the app is ready
app.once('ready', () => {
  // Create a new window
  window = new BrowserWindow({
    // Set the initial width to 500px
    width: 600,
    // Set the initial height to 400px
    height: 500,
    // set the title bar style
    //titleBarStyle: 'hidden-inset',
    // set the background color to black
    //backgroundColor: "#111",
    // Don't show the window until it's ready, this prevents any white flickering
    show: false
  })

  const directory = process.argv[2] || '.';

  window.webContents.send('open-directory', directory);

  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  window.directory = directory;

  window.once('ready-to-show', () => {
    window.show()
  })
})
