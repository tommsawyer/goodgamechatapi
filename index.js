var GoodGameChat = require('./lib/GoodGame.js');

var chat = new GoodGameChat();

/*chat.on('connection_send_msg', function(msg) {
    console.log('connection_send_msg');
    console.log(msg);
});

chat.on('connection_got_msg', function(msg) {
    console.log('connection_got_msg');
    console.log(msg);
});*/
chat.connect().then(function() {  
    chat.getChannels(0, 50).then(function(channels) {
        chat.joinChannel(channels[3]).then(function(channel) {
            console.log('Joined to: ' + channel.name);
            console.log("Users in channel " + channel.id);
            chat.getUsersInChannel(channel.id).then(function(users) {
                console.log(users);
            });       
        });
    });
});
