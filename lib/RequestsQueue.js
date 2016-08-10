'use strict';

class Request {
    constructor(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
    }
}

class RequestsQueue {
    constructor(connection) {
        this.requestsQueue = [];
        this.connection = connection;

        this.connection.on('error', this.rejectFirst.bind(this));
    } 

    send(type, data, answerType) {
        var self = this;


        if (!answerType) {
            this.connection.send(type, data);
            return Promise.resolve();
        } 

        return new Promise(function(resolve, reject) {
            var request = new Request(resolve, reject);
            self.requestsQueue.push(request);
            self.connection.send(type, data);
            
            self.waitForEvent(answerType).then(function(result) {
                self.resolveFirst(result);
            });
        });
    }

    resolveFirst(data) {
        var request = this.requestsQueue.shift();
        request.resolve(data);
    }

    rejectFirst(error) {
        var request = this.requestsQueue.shift();
        request.reject(error);
    }

    waitForEvent(eventName) {
        var self = this;
        return new Promise(function(resolve) {
            self.connection.once(eventName, resolve);
        });
    }
}

module.exports = RequestsQueue;
