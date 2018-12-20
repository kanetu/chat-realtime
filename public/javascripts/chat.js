var messages = [];
var socket = io.connect('http://localhost:3000');
var tMessage = document.getElementById("text_message");
var sendButton = document.getElementById("btn_send");
var content = document.getElementById("content");




socket.on('message', function (socket) {
    if(messages['mainroom'] === undefined)
        messages['mainroom'] = [];
    console.log(socket);
    if(socket.flag !== undefined){
        if(socket.message && socket.flag === 'general-room') {
            messages['mainroom'].push(socket.username+": "+socket.message);
            var html1 = '';
            for(var i=0; i<messages['mainroom'].length; i++) {
                html1 += messages['mainroom'][i] + '<br />';
            }
            content.innerHTML = html1;
        } else {
            console.log("There is a problem:", socket);
        }
    }
    
});

socket.on('server-send-client-erorr-username', function(){
    alert('Username đã tồn tại');
});

socket.on('server-send-client-list-user', function(list){
    console.log(list);
    var html = '';
    for(var i=0; i<list.length; i++) {
        html += list[i] + '<br />';
    }
    $('#current_user').html(html);
});

socket.on('server-send-list-rooms', function(data){
    $('#room').html('');
    data.map(function(r){
        $('#room').append('<h4>'+r+'</h4>');
    });
})

socket.on('server-send-room-current', function(data){
    $('#current_room').append('<h5>'+data+'</h5>');
});

socket.on('server-send-message-user-in-room', function(socket){
    if(messages[socket.room] === undefined)
        messages[socket.room] = [];
    if(socket.message) {
        messages.push(socket.username+": "+socket.message);
        var html = '';
        for(var i=0; i<messages.length; i++) {
            html += messages[i] + '<br />';
        }
        $('#content2').html(html);
    } else {
        console.log("There is a problem:", socket);
    }
});
window.onclose = function(){
    socket.disconnect();
}

$('#btn_send').on('click', function() {
    var message = tMessage.value;
    socket.emit('send', message, flag='general-room');
});

$("#register").on("click", function(){
    socket.username = $('#name_person').val();
    socket.emit('client-send-username',{username: socket.username});
});

$('#new_room').on('click', function(){
    socket.emit('client-create-room', $('#room_name').val());
});

$('#btn_send2').on('click', function(){
    socket.emit('client-send-message-room', $('#text_message2').val(), socket.current_rooms);

})
