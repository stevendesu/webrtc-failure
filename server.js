var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
	file.serve(req, res);
}).listen(2017);

var io = require('socket.io').listen(app);

// To track individual streams
// { id: { candidates: [] }, ... }
var activeBroadcasts = {};

io.sockets.on('connection', function (conn){

	// for a given connection, we want to know what room they're in
	var broadcast = null;

	conn.on('message', function (message) {
		console.log('Got message:', message);
		console.log('Broadcast: ' + broadcast);
		if (message.type == "candidate")
		{
			activeBroadcasts[broadcast].candidates.push(message.candidate);
		}
		if (message.type == "offer")
		{
			activeBroadcasts[broadcast].offer = message.offer;
		}
		io.to(broadcast).emit('message', message);
	});

	conn.on('broadcast', function (id) {
		if (activeBroadcasts.hasOwnProperty(id))
		{
			conn.emit('error', 'Broadcast with that ID already exists');
			return;
		}

		conn.join(id);
		broadcast = id;

		activeBroadcasts[id] = {
			offer: null,
			candidates: []
		};

		conn.emit('success');
	});

	conn.on('watch', function (id) {
		if (!activeBroadcasts.hasOwnProperty(id))
		{
			conn.emit('error', 'No such broadcast');
			return;
		}

		conn.join(id);
		broadcast = id;

		conn.emit('success');

		// Send known ICE candidates
		if (activeBroadcasts[broadcast].offer)
		{
			conn.emit("message", {type: "offer", offer: activeBroadcasts[broadcast].offer});
		}
		for (var i = 0; i < activeBroadcasts[broadcast].candidates.length; i++)
		{
			conn.emit('message', {type: 'candidate', candidate: activeBroadcasts[broadcast].candidates[i]});
		}
	});

});