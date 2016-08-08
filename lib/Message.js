'use strict';

var Client = require('./Client.js'); 

class Message {
    static fromJSON(jsonConfig) {
        var client = new Client(jsonConfig.user_id, jsonConfig.user_name, jsonConfig.mobile);
        var date = new Date(jsonConfig.timestamp);

        return new Message(jsonConfig.message_id, client, jsonConfig.channel_id, date, jsonConfig.parsed); 
    } 

    constructor(id, client, channelID, date, text) {
        this.id = id;
        this.client = client;
        this.channelID = channelID;
        this.date = date;
        this.text = text;
    }

    format(formatString) {
        return formatString
            .replace('%m', this.text)
            .replace('%n', this.client.name)
            .replace('%d', this.date.toLocaleDateString())
            .replace('%t', this.date.toLocaleTimeString());
    }
}

module.exports = Message;
