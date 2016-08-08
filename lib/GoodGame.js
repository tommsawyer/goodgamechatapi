'use strict';

var Connection   = require('./Connection.js'),
    EventEmitter = require('events'),
    Channel      = require('./Channel.js'),
    API          = require('./API_Constants.js'),
    request      = require('request'),
    Client       = require('./Client');

const GOODGAME_GET_TOKEN_URL = 'http://goodgame.ru/ajax/chatlogin/';

class GoodGameChat extends EventEmitter {
    constructor() {
        super();

        this._connection = new Connection();
        Channel.setGoodGameChat(this);
    }

    connect(URL) {
        var self = this;

        self._connection.on('send_websocket_msg', function(msg) {
           self.emit('connection_send_msg', msg); 
        });

        self._connection.on('got_websocket_msg', function(msg) {
           self.emit('connection_got_msg', msg); 
        });

        self._connection.on('close', function(reason) {
           self.emit('connection_cosed', reason); 
        });

        self._connection.on('error', function(error) {
           self.emit('connection_error', error); 
        });

        return this._connection.connect(URL).then(function(serverInfo) {
            self.protocolVersion = serverInfo.protocolVersion;
            self.serverIdent     = serverInfo.serverIdent;

            return self; 
        });
    }

    authorize(login, password) {
        var self = this;

        return self._getToken(login, password).then(function(userInfo) {
            self.accessToken = userInfo.accessToken;

            return new Promise(function(resolve, reject) {
                self._send('auth', {
                    user_id: userInfo.userID,
                    token: self.accessToken
                });

                self._connection.once('success_auth', function(userInfo) {
                    resolve({
                        name: userInfo.user_name,
                        id: userInfo.user_id
                    }) 
                });
                
            });
        })

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

    _getToken(login, password) {
        return new Promise(function(resolve, reject) {
            request.post({
                url: GOODGAME_GET_TOKEN_URL,
                form: {
                    login: login,
                    password: password
                }
            }, function(err, headers, body) {
                if (err) return reject(err);

                var answer = JSON.parse(body);

                if (answer.result) {
                    resolve({
                        userID: answer.user_id,
                        accessToken: answer.token,
                    });
                } else {
                    reject(new Error(answer.response));
                }
            });
        });    

    }

    _send(type, data) {
        this._connection.send(type, data);
    }
}

module.exports = GoodGameChat;
