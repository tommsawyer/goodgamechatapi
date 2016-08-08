var GoodGameChat = require('./lib/GoodGame.js');

var chat = new GoodGameChat();

chat.connect().then(function() {
    chat.getChannels(0, 50).then(function(channels) {
        chat.joinChannel(channels[3]).then(function(channel) {
            console.log('Joined to: ' + channel.name);

            channel.on('message', function(message) {
                console.log(message.format('%t %n: %m'));
            });

        })
    });
})
