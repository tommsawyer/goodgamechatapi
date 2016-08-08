'use strict';

var WebSocketClient = require('websocket').client,
    EventEmitter    = require('events');

const GOODGAME_CHAT_URL = 'ws://chat.goodgame.ru:8081/chat/websocket';

class Connection extends EventEmitter {
    constructor() {
        super();
        this._client = new WebSocketClient();
    }

    connect(URL) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self._client.connect(URL || GOODGAME_CHAT_URL);
            self._client.on('connect', function(connection) {
                self._connection = connection;

                self._connection.on('message', function(message) {
                    var parsedMessage = JSON.parse(message.utf8Data);

                    self.emit('got_websocket_msg', JSON.stringify(parsedMessage));

                    if (parsedMessage.type === 'welcome') {
                        resolve(parsedMessage.data);
                    } else {
                        self.emit(parsedMessage.type, parsedMessage.data);
                    }
                    
                });

                self._connection.on('error', function(error) {
                    self.emit('error', error);
                });

                self._connection.on('close', function(reason) {
                    self.emit('close', reason);
                });
            });
        });
    }

    send(type, data) {
        if (!this.isActive()) {
            throw new Error('connection isn\'t opened. Cannot send message');
        }

        this.emit('send_websocket_msg', JSON.stringify({type: type, data: data}));

        this._connection.sendUTF(JSON.stringify({
            type: type,
            data: data
        }));
    }

    isActive() {
        return this._connection.connected;
    }
}

module.exports = Connection;
