'use strict';

var Connection   = require('./Connection.js'),
    EventEmitter = require('events'),
    Channel      = require('./Channel.js'),
    API          = require('./API_Constants.js'),
    request      = require('request'),
    Client       = require('./Client'),
    RequestsQueue = require('./RequestsQueue');

const GOODGAME_GET_TOKEN_URL = 'http://goodgame.ru/ajax/chatlogin/';

class GoodGameChat extends EventEmitter {
    constructor() {
        super();

        this.currentUser = null;
        this.currentChannels = [];
        this.ignoreList = [];
        this._connection = new Connection();
        this.queue = new RequestsQueue(this._connection);
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

            var request = self.queue.send(API.AUTH, {
                user_id: userInfo.userID,
                token: self.accessToken
            }, API.ACCEPT_CREDS);

            return request
            .then(function(userInfo) {
                var currentUser = new Client(userInfo.user_id, userInfo.user_name, userInfo.isMobile);
                self.currentUser = currentUser;
                return currentUser;
            })
            .then(function(user) {
                return self.getIgnoreList().then(function(ignoreList) {
                    self.ignoreList = ignoreList;
                    return self.currentUser;
                });  
            });
        });
    }

    getChannels(start, count) {
        var self = this;

        start = start || 0;
        count = count || 50;

        var request = self.queue.send(API.GET_CHANNELS, {
            start: start,
            count: count
        }, API.CHANNELS);

        return request.then(function(channelsJSON) {
            return channelsJSON.channels.map((channelJSON, index) => { return Channel.fromJSON(channelJSON); });
        });

    }

    joinChannel(channel, isHidden) {
        var self = this;

        var id = channel.id || channel; 

        var request = self.queue.send(API.JOIN_CHANNEL, {
            channel_id: id,
            isHidden: isHidden || false
        }, API.JOINED_TO_CHANNEL);

        return request.then(function(channelInfo) {
            var channel = Channel.fromJSON(channelInfo); 
            self.currentChannels.push(channel);
            channel.onJoin(self._connection);
            return channel;
        });
    }

    getUsersInChannel(id) {
        var self = this;

        var request = self.queue.send(API.GET_USERS, {
            channel_id: id 
        }, API.USERS);
        
        return request.then(function(usersInfo) {
            var users = usersInfo.users.map(function(user) {
                return new Client(user.id, user.name, user.isMobile);
            });
            return users; 
        });
    }

    getIgnoreList() {
        var self = this;

        var request = self.queue.send(API.GET_IGNORE_LIST, {}, API.IGNORE_LIST);

        return request.then(function(ignoreData) {
           ignoreData.users.map(function(user) {
               self.ignoreList.push(new Client(user.id, user.name));
           });
           return self.ignoreList;
        });
    }

    addToIgnoreList(id) {
        var self = this;
        var request = self.queue.send(API.ADD_TO_IGNORE_LIST, {
            user_id: +id
        }, API.ADDED_TO_IGNORE_LIST);
        return request.then(function(ignoreData) {
            var newUsersInIgnoreList = ignoreData.users.filter(function(obtainedUser) {
                return !self.ignoreList.some(function(existUser) {
                    return existUser.id != obtainedUser.id;
                });
            });
            newUsersInIgnoreList.forEach(function(newUser) {
                self.ignoreList.push(new Client(newUser.id, newUser.name));
            }); 
            return self.ignoreList;     
        });
    }

    removeFromIgnoreList(id) {
        var self = this;
        var request = self.queue.send(API.REMOVE_FROM_IGNORE_LIST, {
            user_id: +id
        }, API.REMOVED_FROM_IGNORE_LIST);

        return request.then(function(ignoreData) {
            self.ignoreList = self.ignoreList.filter(function(existUser) {
                return ignoreData.users.some(function(obtainedUser) {
                    return existUser.id == obtainedUser.id;
                });
            });
            return self.ignoreList;
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
