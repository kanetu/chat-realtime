
module.exports = function(io){

	var users = [];

	//Hàm lấy nickname của tất cả người dùng kết nối đến
	function getUsers(){
		let arr_user = [];
		for(var name in users) {
			if(users[name]) {
				arr_user.push(name);  
			}
		}
		return arr_user;
	}
	//Hàm lấy thời gian theo server trả về định dạng hh:mm am/pm
	function getTime() {

	    let date = new Date();
	    let offset = '+7';

	    utc = date.getTime() + (date.getTimezoneOffset() * 60000);
	    nd = new Date(utc + (3600000 * offset));

	    var hours = nd.getHours();
	    var minutes = nd.getMinutes();
	    var ampm = hours >= 12 ? 'PM' : 'AM';
	    hours = hours % 12;
	    hours = hours ? hours : 12; // the hour '0' should be '12'
	    minutes = minutes < 10 ? '0'+minutes : minutes;
	    var strTime = hours + ':' + minutes + ' ' + ampm;
	    return strTime;
	}
	//Hàm lấy danh sách phòng hiện có ngoại trừ những phòng private
	function getRooms() {
		var availableRooms = [];
		var rooms = io.sockets.adapter.rooms;
		if (rooms) {
			for (var room in rooms) {
				if (rooms[room].hasOwnProperty('status')) {
					if( rooms[room].status === 'public' ||  rooms[room].status === 'serverInit')
						availableRooms.push({roomName: room, countUser: rooms[room].length});
				}
			}
		}
		return availableRooms;
	}
	
	//Hàm khởi tạo phòng chat chung khi client kết nối tới
	function initMainRoom(socket){
		let nameMainRoom = 'Room Chat Chung';
		//This function extend event 'client-create-room'
		socket.join(nameMainRoom);
		socket.adapter.rooms[nameMainRoom].status = 'serverInit';
		socket.current_rooms = nameMainRoom;
		var arrRoomJoined = [];
		for( r in socket.adapter.rooms ){
			if(socket.adapter.rooms[r].whomade !== undefined)
				arrRoomJoined.push(r);
		}


		//Server send list rooms to clients
		io.sockets.emit('server-send-list-rooms',getRooms());
		//Server send current room
		socket.emit('server-send-room-current', {nameRoom: nameMainRoom, arrRoomJoined: arrRoomJoined, status: 'serverInit', userInRoom: getUsers()});
		io.sockets.emit('server-send-user-in-room', {nameRoom: nameMainRoom, countUser: socket.adapter.rooms[nameMainRoom].length});


	}


	//Server lắng nghe các kết nối từ client
	io.sockets.on('connection', function (socket) {

		
		//Init main room
		initMainRoom(socket);

		//Chờ sự kiện kiểm tra nickname từ client 
		socket.on('check-nickname', function(nickname){
			if(getUsers().indexOf(nickname)>=0 || nickname.trim() === ''){
				socket.emit('server-send-client-nickname-available-or-not',{answer: false});
			}else{
				socket.emit('server-send-client-nickname-available-or-not',{answer: true});
			}
		});

		//Chờ sự kiện client gửi tin nhắn vào room cố định
		//Server đóng vai trò là trung gian
		socket.on('client-send-message-room', function (data) {
			io.to(data.room).emit('server-send-message-user-in-room',{username: socket.nickname, message: data.message, room: data.room, time: getTime()});
		});

		//Chờ sự kiện client gửi nickname đến server
		//Sự kiện này đã được kiểm tra nickname hợp lệ 
		socket.on('client-send-username', function(data){
			if(getUsers().indexOf(data.username)>=0){
				//Nếu có sai xót server sẽ phát sự kiện lỗi xin nickname đến client
				socket.emit('server-send-client-erorr-username');
			}else{
				//Set username for socket
				socket.nickname = data.username;
				users[data.username] = socket;
				//Send list of user for clients
				//Server phát sự kiện gửi danh sách nickname đến client 
				io.sockets.emit('server-send-client-list-user', getUsers());
			}
		});


		//Chờ sự kiện client tạo mới phòng chat 
		socket.on('client-create-room',function(data){
			

			//If this room is defined we don't need to set status again
			if(typeof socket.adapter.rooms[data.nameRoom] === 'undefined'){
				socket.join(data.nameRoom);
				socket.adapter.rooms[data.nameRoom].status = data.typeRoom;
				socket.current_rooms = data.nameRoom;
				var arrRoomJoined = [];
				for( r in socket.adapter.rooms ){
					if(socket.adapter.rooms[r].whomade !== undefined)
						arrRoomJoined.push(r);
				}
				//Server send current room
				socket.emit('server-send-room-current', {nameRoom: data.nameRoom, arrRoomJoined: arrRoomJoined, status: data.typeRoom, userInRoom: getUsers()});
				//Server send list rooms to clients
				io.sockets.emit('server-send-list-rooms',getRooms());
				//Server send count of user in room
				io.sockets.emit('server-send-user-in-room', {nameRoom: data.nameRoom, countUser: socket.adapter.rooms[data.nameRoom].length});
			}
			
			
			
		});

		//Chờ sự kiện client tham gia vào một phòng cụ thể
		socket.on('client-join-room', function(data){
			socket.join(data.nameRoom);
			var arrRoomJoined = [];
			for( r in socket.adapter.rooms ){
				if(socket.adapter.rooms[r].whomade !== undefined)
					arrRoomJoined.push(r);
			}
			//Server send current room
			socket.emit('server-send-room-current', {nameRoom: data.nameRoom, arrRoomJoined: arrRoomJoined, status: socket.adapter.rooms[data.nameRoom].status, userInRoom: getUsers()});
			//Server send list rooms to clients
			io.sockets.emit('server-send-list-rooms',getRooms());
			//Server send count of user in room
			io.sockets.emit('server-send-user-in-room', {nameRoom: data.nameRoom, countUser: socket.adapter.rooms[data.nameRoom].length});
		})

		//Chờ sự kiện client mời client khác vào phòng
		socket.on('client-invite-client-to-room', function(data){
			
			if(users[data.nickname] !== undefined){
				users[data.nickname].join(data.room);
			}else{
				socket.emit('server-send-client-error-invite');
				return false;
			}

			var arrRoomJoined = [];
			for( r in socket.adapter.rooms ){
				if(socket.adapter.rooms[r].whomade !== undefined)
					arrRoomJoined.push(r);
			}
			//Server send list rooms to clients
			io.sockets.emit('server-send-list-rooms',getRooms());
			//Server send current room
			users[data.nickname].emit('server-send-room-current', {nameRoom: data.room, arrRoomJoined: arrRoomJoined});
			//Server send count of user in room
			io.sockets.emit('server-send-user-in-room', {nameRoom: data.room, countUser: socket.adapter.rooms[data.room].length});
		});

		//Chờ sự kiện client ra khỏi phòng
		socket.on('client-send-out-room', function(data){
			
			socket.leave(data.outRoom);
			socket.emit('server-send-out-room-sucess',{room: data.outRoom});
			//Server send list rooms to clients
			io.sockets.emit('server-send-list-rooms',getRooms());
			//Server send count of user in room
			if(socket.adapter.rooms[data.outRoom] !== undefined){
				io.to(data.outRoom).emit('server-send-user-in-room', {nameRoom: data.outRoom, countUser: socket.adapter.rooms[data.outRoom].length});
			}
		});

		//Chờ sự kiện client gửi yêu cầu lấy danh sách những client chưa tham gia
		socket.on('client-send-require-list-user-has-not-joined', function(data){
			io.in(data.room).clients((err , clients) => {
				let listUser = [];
			    clients.forEach(function(client) {
			    	for(let user in users){
						if(users[user].id === client){
							listUser.push(users[user].nickname);
						}
					}
				});
				socket.emit('server-send-list-user-has-not-joined', {room: data.room, allUser: getUsers(), hasJoined:listUser});
			});
			
			
		});

		//Chờ sự kiện ngắt kết nối từ client
		socket.on('disconnect', function(){
			
			
			//Server send list rooms to clients
			io.sockets.emit('server-send-list-rooms',getRooms());
			//Server send count of user in rooms
			for( room in socket.adapter.rooms){
				io.sockets.emit('server-send-user-in-room', {nameRoom: room, countUser: socket.adapter.rooms[room].length});
			}
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