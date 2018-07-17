'use strict';

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var version = 1.2;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    socket.emit('system message', 'connection established');
    socket.emit('system message', 'server build ' + version);
    socket.broadcast.emit('system message', socket.id + ' has joined the server');

    var clientList = Object.keys(io.sockets.sockets);
    io.emit('system message', 'population: ' + clientList.length);

    setupListeners(socket);
});
io.on('disconnect', function(reason){
    io.emit('system message', 'server disconnect: ' + reason);
});
io.on('disconnecting', function(reason){
    io.emit('system message', 'server disconnecting: ' + reason);
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});

function setupListeners(socket) {
    socket.on('chat message', function(msg){
        io.emit('chat message', socket.id + ": " + msg);
    });
    socket.on('disconnect', function(reason){
        socket.broadcast.emit('system message', socket.id + ' has disconnected: ' + reason);
        socket.emit('system message', 'you disconnected: ' + reason);
        var clientList = Object.keys(io.sockets.sockets);
        io.emit('system message', 'population: ' + clientList.length);
    });
    socket.on('disconnecting', function(reason){
        socket.broadcast.emit('system message', socket.id + ' is disconnecting: ' + reason);
        socket.emit('system message', 'you are disconnecting: ' + reason);
    });

    socket.custom = {};
    socket.on('call', function(peer){
        io.sockets.sockets[peer].emit('system message', socket.id + " wants to connect with you");
        socket.custom.interest = peer;
    });
    socket.on('answer', function(peer){
        if (io.sockets.sockets[peer].custom.interest == socket.id) {
            io.sockets.sockets[peer].emit('system message', socket.id + " has accepted your request for connection");
            socket.custom.interest = peer;
            io.sockets.sockets[peer].emit('connect p2p');
        }
    });
    socket.on('send signaling', function(o){
        io.sockets.sockets[o.peerId].emit('receive signaling', o);
    });
}