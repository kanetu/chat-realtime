module.exports = function(io){

	var username_list = [];

	var users = {};

	function getUsers(){
		let arr_user = [];
		for(var name in users) {
			if(users[name]) {
				arr_user.push(name);  
			}
		}
		return arr_user;
	}

	function findRooms() {
		var availableRooms = [];
		var rooms = io.sockets.adapter.rooms;
		if (rooms) {
			for (var room in rooms) {
				if (rooms[room].hasOwnProperty('whomade')) {
					availableRooms.push(room);
				}
			}
		}
		return availableRooms;
	}

	io.sockets.on('connection', function (socket) {
		console.log(socket.adapter.rooms);
		socket.emit('message', { username:"Admin",message: 'welcome to the chat', flag:'general-room' });

		socket.on('send', function (message, flag) {
			io.sockets.emit('message', {username: socket.nickname, message, flag});
		});
		socket.on('client-send-username', function(data){
			console.log(username_list);
			if(getUsers().indexOf(data.username)>=0){
				socket.emit('server-send-client-erorr-username');
			}else{
				//Set username for socket
				socket.nickname = data.username;
				users[data.username] = socket;
				//Send list of user for clients
				io.sockets.emit('server-send-client-list-user', getUsers());
			}
		});


		socket.on('client-create-room',function(data){
			socket.join(data);
			socket.adapter.rooms[data].whomade = 'client-create-room';
			socket.current_rooms = data;
			console.log(socket.adapter.rooms);
			var arr = [];
			for( r in socket.adapter.rooms ){
				arr.push(r);
			}

			//Server send list rooms to clients
			io.sockets.emit('server-send-list-rooms',findRooms());
			//Server send current room
			socket.emit('server-send-room-current', data);
		});

		socket.on('client-send-message-room', function(message, room){
			console.log('data='+message);
			io.to(socket.current_rooms).emit('server-send-message-user-in-room',{username: socket.nickname, message, room});
		});
		socket.on('disconnect', function(){
			//Remove socket from users[] 
			delete users[socket.nickname];
			//Update user list
			io.sockets.emit('server-send-client-list-user', getUsers());
		});
	});
}

// socket.broadcast.emit() just send all client but not sender 
// io.sockets.emit() send all client and sender
// socket.emit() just sender with server