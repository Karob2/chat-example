'use strict';

function trace(arg) {
  var now = (window.performance.now() / 1000).toFixed(3);
  console.log(now + ': ', arg);
}

var localConnection;
var remoteConnection;
var sendChannel;
var receiveChannel;
var dataConstraint;

/*
usage:
- host and client run creatConnection() to initialize
- the host and a client agree to be peers through socket.io
- host runs requestConnection() to initiate the signaling with the client
*/

function createConnection() {
    localConnection = new RTCPeerConnection(null);
    sendChannel = localConnection.createDataChannel('sendDataChannel', null);
    localConnection.onicecandidate = e => {
        onIceCandidate(e);
    };
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;

    localConnection.ondatachannel = receiveChannelCallback;
}

function requestConnection() {
    localConnection.createOffer().then(
        hostSendDescription,
        onCreateSessionDescriptionError
    );
}

// fired by socket.io
function receiveSignaling(o) {
    trace('Received ' + o.type + ' signaling.');
    if (o.type == 'ice') {
        receiveIceCandidate(o.data);
    } else if (o.type == 'host description') {
        clientReceiveDescription(o.data);
    } else if (o.type == 'client description') {
        hostReceiveDescription(o.data);
    }
}

function onIceCandidate(event) {
    /*
    getOtherPc(pc)
        .addIceCandidate(event.candidate)
        .then(
          () => onAddIceCandidateSuccess(pc),
          err => onAddIceCandidateError(pc, err)
        );
    */
    // HERE: Send ice candidate to the peer
    trace(`Sending ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
    socketSignaling('ice', event.candidate);
}
function receiveIceCandidate(candidate) {
    localConnection
        .addIceCandidate(candidate)
        .then(
          () => onAddIceCandidateSuccess(pc),
          err => onAddIceCandidateError(pc, err)
        );
}
function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}
function onAddIceCandidateError(error) {
  trace(`Failed to add Ice Candidate: ${error.toString()}`);
}

function hostSendDescription(desc) {
    localConnection.setLocalDescription(desc);
    trace(`Sending offer to client\n${desc.sdp}`);
    /*
    remoteConnection.setRemoteDescription(desc);
    remoteConnection.createAnswer().then(
        gotDescription2,
        onCreateSessionDescriptionError
    );
    */
    // HERE: Send description to the peer, causing the peer to run clientReceiveDescription(desc)
    socketSignaling('host description', desc);
}
function clientReceiveDescription(desc) {
    localConnection.setRemoteDescription(desc);
    localConnection.createAnswer().then(
        clientSendDescription,
        onCreateSessionDescriptionError
    );
}
function clientSendDescription(desc) {
    localConnection.setLocalDescription(desc);
    trace(`Sending answer to host\n${desc.sdp}`);
    //remoteConnection.setRemoteDescription(desc);
    // HERE: Send description to the peer, causing the peer to run hostReceiveDescription(desc)
    socketSignaling('client description', desc);
}
function hostReceiveDescription(desc) {
    localConnection.setRemoteDescription(desc);
}

function onSendChannelStateChange() {
    const readyState = sendChannel.readyState;
    trace('Send channel state is: ' + readyState);
    if (readyState === 'open') {
        $('#messages').append($('<li>').append($('<b>').append(document.createTextNode('p2p link established - send ready'))));
        window.scrollTo(0, document.body.scrollHeight);

        /*
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        sendButton.disabled = false;
        closeButton.disabled = false;
        */
        // HERE: outgoing connection established
    } else {
        /*
        dataChannelSend.disabled = true;
        sendButton.disabled = true;
        closeButton.disabled = true;
        */
    }
}
function receiveChannelCallback(event) {
    trace('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
}
function onReceiveChannelStateChange() {
    const readyState = receiveChannel.readyState;
    trace(`Receive channel state is: ${readyState}`);
    if (readyState === 'open') {
        $('#messages').append($('<li>').append($('<b>').append(document.createTextNode('p2p link established - receive ready'))));
        window.scrollTo(0, document.body.scrollHeight);
        // HERE: incoming connection established
    } else {
    }
}

function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}


function sendP2PMessage(msg) {
  sendChannel.send(msg);
  trace('Sent Data: ' + msg);
}
function onReceiveMessageCallback(event) {
    trace('Received Message');
    $('#messages').append($('<li>').text(event.data));
    window.scrollTo(0, document.body.scrollHeight);
    //dataChannelReceive.value = event.data;
}

/*
function sendData() {
  const data = dataChannelSend.value;
  sendChannel.send(data);
  trace('Sent Data: ' + data);
}
function onReceiveMessageCallback(event) {
    trace('Received Message');
    //dataChannelReceive.value = event.data;
}
function closeDataChannels() {
  trace('Closing data channels');
  sendChannel.close();
  trace('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  trace('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  trace('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}
*/
