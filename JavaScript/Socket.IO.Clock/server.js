var http = require('http'),
    fs = require('fs'),
    io = require('socket.io');

var port = 8080,
    timePrecisionMs = 1000;

var server = http.createServer(function (request, response) {
    fs.readFile('index.html', 'utf8', function (err, data) {
        response.writeHead(200);
        response.write(data, "binary");
        response.end();
    });
});

server.listen(port);
io = io.listen(server);

io.sockets.on('connection', function (socket) {
    setInterval(function() {
        var currentDate = new Date();
        
        socket.emit('time-tick', {
            hours: currentDate.getHours(),
            minutes: currentDate.getMinutes(),
            seconds: currentDate.getSeconds()
        });
    }, timePrecisionMs);
});

console.log("Launched Clock server at the port " + port);