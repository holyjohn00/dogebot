'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var sqLite = require('sqlite3').verbose();
var bot = require('slackbots');
var ping = require('ping');
//var wolfram = require('wolfram-alpha').createClient("Q6KKHH-JY2H24G5AJ");
var knockknock = require('knock-knock-jokes')

var Bot = function Constructor(settings){
	this.settings = settings;
	this.settings.name = this.settings.name || 'dogebot';
	this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'db', 'dogebotDB.db');

	this.user = null;
	this.db = null;
};

util.inherits(Bot,bot);

Bot.prototype.run = function() {

	Bot.super_.call(this, this.settings);
	this.on('start',this._onStart);
	this.on('message', this._onMessage);

};

Bot.prototype._onStart = function(){
	
	this._loadBotUser();

	this._connectDb();
	this._firstRun();
};

Bot.prototype._onMessage = function(message){
	if(this._isChatMessage(message) && 
		this._isChannelConversation(message) && 
		this._isAskingChuckNorris(message)){
		this._returnChuckNorrisFacts(message);

	}
	if(this._isChatMessage(message) && 
		this._isChannelConversation(message) && 
		this._isAskingDogebot(message)){
		this._returnAnswer(message);
	}
	if(this._isChatMessage(message) && 
		this._isChannelConversation(message) && 
		this._isPingingForSite(message)){
		this._returnPing(message);

	}

	if(this._isChatMessage(message) && 
		this._isChannelConversation(message) && 
		this._isAskingJoke(message) &&
		!this._isFromBot(message)){
		console.log("reply joke");
		this._replyJoke(message);
	}
};

Bot.prototype._replyJoke = function (originalMessage){
	var self = this;
 

	var channelID = self._getChannelById(originalMessage.channel);
	self.postMessageToChannel(channelID.name,knockknock(),{as_user: true});

};

Bot.prototype._loadBotUser = function () {

	var self = this;
	this.user = this.users.filter(function (user){
		return user.name === self.name;
	})[0];
};


Bot.prototype._connectDb = function(){

	if(!fs.existsSync(this.dbPath)){
		console.error('DATABASE DOES NOT EXIST');
		process.exit(1);
	}
	else{
		this.db = new sqLite.Database(this.dbPath);
	}
};

Bot.prototype._firstRun = function() {
	var self = this;
	self.db.get('SELECT val FROM user WHERE username = "lastrun" LIMIT 1', function(err,record) {
		
		if(err){
			return console.error('DATABASE ERROR');
		}

		var thisTime = (new Date()).toJSON();

		if(!record){
			self._welcomeMessage();
			return self.db.run('INSERT INTO user(username,val) VALUES("lastrun",?)',thisTime);
		}

		self.db.run('UPDATE user SET val = ? WHERE username = "lastrun"',thisTime);
	});
};

Bot.prototype._welcomeMessage = function (){

	this.postMessageToChannel(this.channels[0].name, 'Hello this is DogeBot! ' + ' \n I can tell jokes. Just say \'Chuck Norris\' or ' + this.name + ' to invoke me!',{as_user:true});
};

Bot.prototype._isChatMessage = function(message){
	return message.type === 'message' && Boolean(message.text);
};

Bot.prototype._isChannelConversation = function(message){
	return typeof message.channel === 'string' && message.channel[0] === 'C';
};

Bot.prototype._isAskingJoke = function(message){
	var temp = JSON.stringify(message.text).split(" ");
	var forChatbot = temp[0].replace("\"","");

	console.log(message.text.toLowerCase().indexOf('tell a joke'));
	return forChatbot === '<@U1FAQEAA1>' && (message.text.toLowerCase().indexOf('tell a joke')> -1 || message.text.toLowerCase().indexOf(this.name) > -1);
};

Bot.prototype._isFromBot = function(message){
	return message.user === this.user.id;
};

Bot.prototype._getChannelById = function(channelID){
	return this.channels.filter(function (item){
		return item.id === channelID;

	})[0];
};

Bot.prototype._isAskingChuckNorris = function(message){
	return message.text.toLowerCase().indexOf('do you know chuck norris') > -1;
};

Bot.prototype._isPingingForSite = function(message){
	var words = JSON.stringify(message.text).split(" ");

	return words[0] === "\"is" && words[2] === 'up?\"';
};

Bot.prototype._isAskingDogebot = function(message){
	return message.text.toLowerCase().indexOf('what is') > -1;
};

Bot.prototype._returnPing = function(originalmessage){
	var self = this;
	var words = JSON.stringify(originalmessage.text).split(" ");
	console.log(words[1]);
	words[1] = words[1].replace('<','');
	words[1] = words[1].replace('>','');
	var address = words[1].split('|');
	var result = "";
    ping.sys.probe(address[1], function(isAlive){
       ping.promise.probe(address[1])
        .then(function (res) {
        	result = res.output;

        	var msg = isAlive ? 'host ' + address[1] + ' is alive' + result: 'host ' + address[1] + ' is dead';
        	var channelID = self._getChannelById(originalmessage.channel);
			self.postMessageToChannel(channelID.name,msg,{as_user: true});
	    });
        });
/*        result = result.replace('\\r', ' ');
        result = result.replace('\\n', ' ');*/
        console.log(result);
        

        
};

Bot.prototype._returnAnswer = function(message){
	var words = message.split(" ");
	var query = "";
	for(var i = 3;i<words.length;i++){
		query += words[i];
	}
	wolfram.query(query, function(err,result){
		if (err){
			return err;
		}
		var channelID = self._getChannelById(originalMessage.channel);
		self.postMessageToChannel(channelID.name,result,{as_user: true});
	});
};

Bot.prototype._returnChuckNorrisFacts = function(originalMessage){

	var self = this;
	self.db.get('SELECT id, joke FROM jokes ORDER BY RANDOM()', function (err, record){
		if(err){
			return console.error('Error in Database',err);
		}
		var channelID = self._getChannelById(originalMessage.channel);
		self.postMessageToChannel(channelID.name,'<@'+ originalMessage.user+ '>: ' + record.joke,{as_user: true});
	});
};

module.exports = Bot;







