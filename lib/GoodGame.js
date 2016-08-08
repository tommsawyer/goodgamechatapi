'use strict';

var Connection = require('./Connection.js');
var Channel    = require('./Channel.js');
var API = require('./API_Constants.js');

class GoodGameChat {
    constructor() {
        this._connection = new Connection();
        Channel.setGoodGameChat(this);
    }

    connect(URL) {
        var self = this;

        return this._connection.connect(URL).then(function(serverInfo) {
            self.protocolVersion = serverInfo.protocolVersion;
            self.serverIdent     = serverInfo.serverIdent;

            return self; 
        });
    }

    getChannels(start, count) {
        var self = this;

        start = start || 0;
        count = count || 50;

        self._send(API.GET_CHANNELS, {
            start: start,
            count: count
        });

        return new Promise(function(resolve, reject) {
            self._connection.once(API.CHANNELS, function(channelsJSON) {
                resolve(channelsJSON.channels.map((channelJSON, index) => { return Channel.fromJSON(channelJSON); }));
            });
        });
    }

    joinChannel(channel, isHidden) {
        var self = this;

        var id = channel.id || channel; 

        self._send(API.JOIN_CHANNEL, {
            channel_id: id,
            isHidden: isHidden || false
        });

        return new Promise(function(resolve, reject) {
            self._connection.once(API.JOINED_TO_CHANNEL, function(channelInfo) {
                var channel = Channel.fromJSON(channelInfo); 
                self.currentChannel = channel;
                channel.onJoin(self._connection);
                resolve(channel);
            });
        });  

    }

    _onMessage(message) {

    }

    _send(type, data) {
        this._connection.send(type, data);
    }
}

module.exports = GoodGameChat;
