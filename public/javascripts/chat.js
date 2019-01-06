var messages = [];
var rooms = [];
var socket = io.connect('http://localhost:3000');

var nickname = "";



socket.on('message', function (socket) {

    if(messages['mainroom'] === undefined)
        messages['mainroom'] = [];
    console.log(socket);
    if(socket.flag !== undefined){
        if(socket.message) {
            messages['mainroom'].push(socket.username+": "+socket.message);
            var html1 = '';
            for(var i=0; i<messages['mainroom'].length; i++) {
                html1 += messages['mainroom'][i] + '<br />';
            }
            $("#mainroom").html(html1);
        } else {
            console.log("There is a problem:", socket);
        }
    }
    
});

socket.on('server-send-client-erorr-username', function(){
    alert('Username đã tồn tại');
});
socket.on('server-send-client-error-invite', function(){
    alert('Không thể mời! Không tồn tại username này!');

})
socket.on('server-send-client-list-user', function(list){
    let html = '';
    for(var i=0; i<list.length; i++) {
        html += '<li class="tablinks">'+list[i]+'<i class="online"></i></li>'
    }
    $('#current-user').html(html);
});

socket.on('server-send-list-rooms', function(list){
    $('#room').html('');
    list.map(function(r){
        let roomid = r.roomName;
        roomid = roomid.toLowerCase().split(' ').join('-');
        $('#room').append(`<li class="tablinks" onclick="joinRoom(\'${r.roomName}\')" ><i class="fas fa-home"></i> ${r.roomName}
            <span class="badge badge-success" id="user-stage-1-in-${roomid}">${r.countUser}</span></li>`);
    });
    
});

socket.on('server-send-user-in-room', function(data){
    let roomid = data.nameRoom;
    roomid = roomid.toLowerCase().split(' ').join('-');

    $(`#user-stage-1-in-${roomid}`).html(data.countUser);
    $(`#user-stage-2-in-${roomid}`).html(data.countUser);
});

socket.on('server-send-room-current', function(data){
    let roomid = data.nameRoom;
    roomid = roomid.toLowerCase().split(" ").join('-');

    if(document.getElementById(`lb-${roomid}`) === null){
        $('#current-room').append(`<li class="tablinks" id="lb-${roomid}" onclick="openCity(event, \'${roomid}\')" >
            <i class="fas fa-home"></i> ${data.nameRoom} <span class="badge badge-success" id="user-stage-2-in-${roomid}">1</span></li>`);
        

        let headRoom = `<div id="${roomid}" class="tabcontent" style="display:none" id="">
            <div class="row info-room">
            <div class="col-7">${data.nameRoom}</div>
            `;
        let bodyRoom = `
            </div>
            <div class="messages" id="messages-${roomid}">
            </div>
            <div class="controls">
            <input type="" class="form-control input-text-message" id="message-${roomid}">
            <button type="text" class="btn-send-message" id="btn-${roomid}"><i class="fas fa-paper-plane"></i></button>
            </div>
            </div>
        `;
        let toolbar = `
                <div class="col-5">
                <button class="btn btn-default" id="btn-invite-${roomid}" data-toggle="modal" data-target="#md-invite-${roomid}"> <i class="far fa-address-book" style="font-size:20px"></i> Mời bạn</button>
                <button class="btn btn-default" id="btn-out-${roomid}"> <i class="fas fa-sign-out-alt" style="font-size:20px"></i> </button> 
                </div>
            `;

        if(roomid === 'room-chat-chung'){
            toolbar = '';
        }

        $('#main-message').append(headRoom + toolbar + bodyRoom);

        $('#main').append(`
            <!-- To change the direction of the modal animation change .right class -->
            <div class="modal fade right" id="md-invite-${roomid}" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">

            <!-- Add class .modal-side and then add class .modal-top-right (or other classes from list above) to set a position to the modal -->
            <div class="modal-dialog modal-side modal-top-right" role="document">


            <div class="modal-content">
            <div class="modal-header">
            <h6 class="modal-title w-100" >Mời bạn vào phòng ${data.nameRoom}</h6>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>
            <div class="modal-body">
            <ul id="list-user-has-not-joined-${roomid}" class="list-user-has-not-joined">
            </ul>
            </div>
            </div>
            </div>
            </div>
            `);
        //Click active room when it was created
        document.getElementById(`lb-${roomid}`).click();

        //Get list of room were join
        rooms = data.arrRoomJoined;

        //Set click event for button send of each room
        $('#btn-'+roomid).on('click', function() {
            let message = $('#message-'+roomid).val();

            socket.emit('client-send-message-room', {message, room: data.nameRoom, time: getTime()});
            $('#message-'+roomid).val('');
        });
        
        //Auto clear and detect enter
        $('#message-'+roomid).on('keypress', function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13') {
                let message = $('#message-'+roomid).val();
                socket.emit('client-send-message-room', {message, room:data.nameRoom, time: getTime()});
                $(this).val('');
            }
        });

        //Button out room 
        $(`#btn-out-${roomid}`).on('click', function(){
            socket.emit('client-send-out-room',{outRoom: data.nameRoom});
        });

        //Button invite friend
        $(`#btn-invite-${roomid}`).on('click', function(){
            socket.emit('client-send-require-list-user-has-not-joined',{room: data.nameRoom});
        });
        
    }
});


socket.on('server-send-message-user-in-room', function(socket){
    console.log(socket);
    if(messages[socket.room] === undefined)
        messages[socket.room] = [];
    if(socket.message) {
        messages[socket.room].push(
            `
            <div class="message-data">
            <span class="message-data-name">${socket.username}</span>
            <span class="message-data-time">${socket.time}</span>
            </div>
            <div class="message my-message">
            ${socket.message}
            </div>
            `);
        var html = '';
        for(var i=0; i<messages[socket.room].length; i++) {
            html += messages[socket.room][i];
        }
        shortNameRoom = socket.room.toLowerCase().split(" ").join('-');
        $(`#messages-${shortNameRoom}`).html(html);
        //Auto scroll down
        let height = document.getElementById(`messages-${shortNameRoom}`);
        $('#messages-'+shortNameRoom).scrollTop(height.scrollHeight);
    } else {
        console.log("There is a problem:", socket);
    }
});

socket.on('server-send-list-user-has-not-joined', function(data){

    var hasnotJoined = data.allUser.filter(function(e) {
      return data.hasJoined.indexOf(e) == -1;
  });

    let html = "";
    
    hasnotJoined.forEach((name)=>{
        html+= `<li onclick="inviteFriend(\'${name}\',\'${data.room}\')"><i class="fas fa-plus"></i> ${name}</li>`
    });
    shortNameRoom = data.room.toLowerCase().split(" ").join('-');
    $(`#list-user-has-not-joined-${shortNameRoom}`).html(html);
    console.log(data.room);
});
socket.on('server-send-out-room-sucess', function(data){
    shortNameRoom = data.room.toLowerCase().split(" ").join('-');
    $(`#${shortNameRoom}`).remove();
    $(`#lb-${shortNameRoom}`).remove();
    document.getElementById('lb-room-chat-chung').click();
});
window.onclose = function(){
    socket.disconnect();
}

$(window).on('load',function(){
    $('#create-nickname-modal').modal('show');
});

socket.on('server-send-client-nickname-available-or-not', function(data){
    if(data.answer){
     $('#lb-error-create-nickname').html("Nick name này có thể sử dụng");
     $('#create-nickname').removeAttr('disabled');
 }else{
     $('#lb-error-create-nickname').html("Nick name này không thể sử dụng");
     $('#create-nickname').attr("disabled","disabled");
 }
});
$('#nickname').on('input', function() { 
    // get the current value of the input field.
    socket.emit('check-nickname', $(this).val());
});

$("#create-nickname").on("click", function(){
    socket.username = $('#nickname').val();
    socket.emit('client-send-username',{username: socket.username});
    $('#create-nickname-modal').modal('hide');
});

$('#create-room').on('click', function(){
    let typeRoom = document.getElementById('rd-public').checked? 'public':'private';
    if($('#room-name').val() === ''){
        $('#lb-error-create-room').html('Lỗi: chưa nhập tên phòng');
    }else{
        socket.emit('client-create-room', {nameRoom:$('#room-name').val(), typeRoom: typeRoom});
        $('#create-room-modal').modal('hide');
    }
});


function openCity(evt, cityName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}

function joinRoom(room){
    socket.emit('client-join-room', {nameRoom: room});
}

function inviteFriend(name, room){
    socket.emit('client-invite-client-to-room', {nickname: name, room});
}

function getTime() {
    let date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}