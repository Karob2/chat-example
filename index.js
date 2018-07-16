var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var version = 1.2;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    socket.emit('system message', "connection established");
    socket.emit('system message', "server build " + version);
    socket.broadcast.emit('system message', "someone has joined the server");

    var clientList = Object.keys(io.sockets.sockets);
    io.emit('system message', "population: " + clientList.length);

    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
    socket.on('disconnect', function(reason){
        socket.broadcast.emit('system message', "someone disconnect: " + reason);
        socket.emit('system message', "you disconnect: " + reason);
        var clientList = Object.keys(io.sockets.sockets);
        io.emit('system message', "population: " + clientList.length);
    });
    socket.on('disconnecting', function(reason){
        socket.broadcast.emit('system message', "someone disconnecting: " + reason);
        socket.emit('system message', "you disconnecting: " + reason);
        var clientList = Object.keys(io.sockets.sockets);
        io.emit('system message', "population: " + clientList.length);
    });
});
io.on('disconnect', function(reason){
    io.emit('system message', "server disconnect: " + reason);
});
io.on('disconnecting', function(reason){
    io.emit('system message', "server disconnecting: " + reason);
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});
