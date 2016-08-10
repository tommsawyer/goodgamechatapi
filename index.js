var GoodGameChat = require('./lib/GoodGame.js');

var chat = new GoodGameChat();

// chat.on('connection_send_msg', function(msg) {
//     console.log('connection_send_msg');
//     console.log(msg);
// });

// chat.on('connection_got_msg', function(msg) {
//     console.log('connection_got_msg');
//     console.log(msg);
// });

chat.connect().then(function() {  
    chat.getChannels(0, 50).then(function(channels) {
        console.log('resolved succefuly! channels: ');
        return channels;
    })
    .then(function(channels) {
        chat.joinChannel('some_uncorrect_channel_id').catch(function(error) {
            console.log(error);
        })

        chat.joinChannel(123123124124124).catch(function(error) {
            console.log(error);
        })
    })
});
