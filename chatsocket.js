'use strict';

var socket;
var peer;
function initializeSocket() {
    socket = io('');
    socket.on('connect', function(){console.log(1);});
    socket.on('event', function(data){console.log(2);});
    socket.on('disconnect', function(){console.log(3);});
    $('form').submit(function(){
        var message = $('#m').val();
        var parts = message.split(' ');
        if (parts.length == 2 && parts[0] == "call") {
            peer = parts[1];
            socket.emit('call', parts[1]);
        } else if (parts.length == 2 && parts[0] == "answer") {
            peer = parts[1];
            socket.emit('answer', parts[1]);
        } else if (parts.length >= 2 && parts[0] == "pm") {
            sendP2PMessage(message);
        } else {
            socket.emit('chat message', message);
        }
        $('#m').val('');
        return false;
    });
    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
        window.scrollTo(0, document.body.scrollHeight);
    });
    socket.on('system message', function(msg){
        $('#messages').append($('<li>').append($('<b>').append(document.createTextNode(msg))));
        window.scrollTo(0, document.body.scrollHeight);
    });
    socket.on('receive signaling', function(o){
        if (peer != o.peerId) {
            trace('Unrecognized peer ' + o.peerId + ' attempted signaling.');
            return;
        }
        receiveSignaling(o);
    });
    socket.on('connect p2p', function(){
        requestConnection();
    });
}

function socketSignaling(type, o) {
    socket.emit('send signaling', {peerId: peer, type: type, data: o});
}
