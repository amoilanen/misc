var spawn = require('child_process').spawn;

function spawnProcess(dir, cmd) {
  return (process.platform.toLowerCase().indexOf("win") >= 0) 
    ? spawnWindowsProcess(dir, cmd)
    : spawnLinuxProcess(dir, cmd);
}

function spawnWindowsProcess(dir, cmd) {
  return spawn("cmd.exe", ["/c", cmd], {cwd: dir});
}

function spawnLinuxProcess(dir, cmd) {
  var cmdParts = cmd.split(/\s+/);

  return spawn(cmdParts[0], cmdParts.slice(1), { cwd: dir});
}

function runCmdHandler(dir, cmd) {
  var process = null;

  try {
    process = spawnProcess(dir, cmd);
  } catch (e) {
    console.error("Error trying to execute command '" + cmd + "' in directory '" + dir + "'");
    console.error(e);
    console.log("error", e.message);
    console.log("finished");
    return;
  }

  process.stdout.on('data', function (data) {
    console.log("progress", data.toString('utf-8'));
  });

  process.stderr.on('data', function (data) {
    console.log("error", data.toString('utf-8'));
  });

  process.on('exit', function (code) {
    console.log("finished");
  });
}

/*
 * Example commands.
 */
runCmdHandler(".", "find . -name '*.js'");
runCmdHandler(".", "uname -a");
runCmdHandler(".", "ls -lh .");
runCmdHandler("/home/anton/src/github/grunt-prepr", "grunt");
runCmdHandler(".", "git clone https://github.com/antivanov/Brackets-Command-Line-Shortcuts");