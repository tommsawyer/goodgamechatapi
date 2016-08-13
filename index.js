var GoodGameChat = require('./lib/GoodGame.js');

var chat = new GoodGameChat();

 chat.on('connection_send_msg', function(msg) {
     console.log('connection_send_msg');
     console.log(msg);
 });

 chat.on('connection_got_msg', function(msg) {
     console.log('connection_got_msg');
     console.log(msg);
 });

chat.connect().then(function() {  
    chat.authorize('','').then(function(user){
        chat.getChannels(0, 5).then(function(channels) {
            return channels;
        }).then(function(channels) {
            chat.joinChannel(channels[3]).then(function(channel) {
                return channel;
            }).then(function(channel) {
                chat.getUsersInChannel(channel.id).then(function(users) {
                    return users;
                }).then(function(users) {
                    chat.addToIgnoreList(users[0].id).then(function(ignoreList) {
                        console.log("ignoreList");
                        console.log(ignoreList);
                        return ignoreList;
                    }).catch(function(err) {
                        console.log("ERROR");
                        console.log(err);
                    });      
                });  
            });
        });            
    });
});
