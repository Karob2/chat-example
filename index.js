var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var version = 1.1;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.emit('system message', "connection established");
  socket.emit('system message', "server build " + version);
  socket.broadcast.emit('system message', "someone has joined the server");
  io.emit('system message', "population: " + io.clients.length);
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
