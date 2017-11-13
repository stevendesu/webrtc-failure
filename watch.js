navigator.getUserMedia = (
	navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.msGetUserMedia
);

RTCPeerConnection = (
	RTCPeerConnection ||
	webkitRTCPeerConnection ||
	mozRTCPeerConnection ||
	msRTCPeerConnection
);

RTCSessionDescription = (
	RTCSessionDescription ||
	webkitRTCSessionDescription ||
	mozRTCSessionDescription ||
	msRTCSessionDescription
);

RTCIceCandidate = (
	RTCIceCandidate ||
	webkitRTCIceCandidate ||
	mozRTCIceCandidate ||
	msRTCIceCandidate
);

var id = prompt('Enter broadcast ID:');
var pc = null;

var socket = io.connect();

if (id !== '') {
	console.log('Joining broadcast ' + id + '...');
	socket.emit('watch', id);
}

socket.on('success', function (room){
	console.log("Success!");
	pc = new RTCPeerConnection({
		"iceServers": [{"urls": "stun:162.243.171.233"}]
	});

	pc.onaddstream = function(e) {
		console.log("Stream added!");
		console.log(e.stream);

		var video = document.querySelector('video');
		video.src = window.URL.createObjectURL(e.stream); 
	};
});

socket.on('error', function (err){
	console.log("Error!");
	console.error(err);
});

socket.on('message', function(msg)
{
	console.log("Message!");
	console.log(msg);
	switch (msg.type)
	{
		case "offer":
			pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
			pc.createAnswer(function(desc)
			{
				pc.setLocalDescription(desc, function()
				{
					socket.emit("message", {type: "answer", answer: desc});
				}, function(){});
			}, function(){});
			break;
		case "candidate":
			if (msg.candidate)
			{
				pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
			}
			break;
	}
});