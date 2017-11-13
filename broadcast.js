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

var id = prompt('Enter broadcast ID:');
var pc = null;

var socket = io.connect();

if (id !== '') {
	console.log('Creating broadcast ' + id + '...');
	socket.emit('broadcast', id);
}

socket.on('success', function ()
{
	console.log("Success!");
	
	// Initialize video and send SDP information
	// For Limelight we'd want to get the list of ICE servers from an API endpoint
	// It's a collection of edge nodes running a TURN server. I've been using Coturn (open source)
	// For the broadcaster, we'd want all possible ICE servers
	// For the watcher, we'd want the nearest ICE server
	pc = new RTCPeerConnection({
		"iceServers": [
			{ "urls": ["stun:162.243.171.233"] }
		]
	});
	console.log("RTCPeerConnection object was created");
	console.log(pc);

	pc.onicecandidate = function (e)
	{
		console.log("ICE candidate:");
		console.log(e.candidate);
		socket.emit("message", {type: "candidate", candidate: e.candidate});
	};

	pc.onnegotiationneeded = function (e)
	{
		pc.createOffer(
			function(desc)
			{
				pc.setLocalDescription(desc, function()
				{
					console.log("SDP:");
					console.log(JSON.stringify(pc.localDescription));
				});
				socket.emit("message", {type: "offer", offer: desc});
			},
			function(err)
			{
				console.error(err);
			}
		);
	};

	navigator.getUserMedia(
		{
			audio: true,
			video: true
		},
		function (stream)
		{
			console.log("Video stream established");
			pc.addStream(stream);

			var video = document.querySelector('video');
			video.src = window.URL.createObjectURL(stream); 
		},
		function (err)
		{
			console.error(err);
		}
	);
});

socket.on('error', function(err)
{
	console.log("Error!");
	console.error(err);
});

socket.on('message', function(msg)
{
	console.log("Message!");
	console.log(msg);
	if (msg.type == "answer")
	{
		pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
	}
});
