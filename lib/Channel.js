'use strict';

var EventEmitter = require('events');
var Message      = require('./Message');

class Channel extends EventEmitter {
    static setGoodGameChat(goodgameChat) {
        Channel.chat = goodgameChat;
    }

    static fromJSON(jsonConfig) {
        return new Channel(jsonConfig.channel_id, jsonConfig.channel_name, 
                jsonConfig.clients_in_channel, jsonConfig.users_in_channel);
    }
    
    onJoin(connection) {
        var self = this;

        connection.on('message', function(messageJSON) {
            self.emit('message', Message.fromJSON(messageJSON));
        });

        connection.on('channel_counters', function(messageJSON) {
            self.usersCount = +messageJSON.clients_in_channel;
            self.authorizedUsersCount = +messageJSON.users_in_channel;
        });
    }

    constructor(id, name, usersCount, authorizedUsersCount) {
        super();

        this.id = id;
        this.name = name;
        this.usersCount = +usersCount;
        this.authorizedUsersCount = +authorizedUsersCount;
    }

}

module.exports = Channel;
