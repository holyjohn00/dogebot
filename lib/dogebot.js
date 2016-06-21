'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var sqLite = require('sqlite3').verbose();
var bot = require('slackbots');
var ping = require('ping');
var wolfram = require('wolfram-alpha').createClient("Q6KKHH-JY2H24G5AJ");
var automeme = require('automeme');

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
	
	if(this._isAskingChuckNorris()){
		this._returnChuckNorrisFacts(message);

	}
	if(this._isAskingDogebot()){
		this._returnAnswer(message);
	}
	if(this._isPingingForSite(message)){
		this._returnPing(message);

	}

	if(this._isChatMessage(message) && 
		this._isChannelConversation(message) && 
		this._isAskingJoke(message) &&
		!this._isFromBot(message)){
		this._replyJoke(message);
	}
};

Bot.prototype._replyJoke = function (originalMessage){
	var self = this;
 
	automeme.getMeme(function(err, meme) {
	  if (err) return console.error(err);
	  var channelID = self._getChannelById(originalMessage.channelID);
		self.postMessageToChannel(channelID.name,meme,{as_user: true});
	});
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
	return message.text.toLowerCase().indexOf('@dogebot tell a joke')> -1 || message.text.toLowerCase().indexOf(this.name) > -1;
};

Bot.prototype._isFromBot = function(message){
	return message.user === this.user.id;
};

Bot.prototype._getChannelById = function(channelID){
	return this.channels.filter(function (item){
		return item.id === channelID;

	})[0];
};

Bot.prototype._isAskingChuckNorris = function(){
	return message.text.toLowerCase().indexOf('do you know chuck norris') > -1;
};

Bot.prototype._isPingingForSite = function(message){
	var words = message.split(" ");

	return words[0] === "is";
};

Bot.prototype._isAskingDogebot = function(){
	return message.text.toLowerCase().indexOf('@dogebot, what is') > -1;
};

Bot.prototype._returnPing = function(message){
	var words = message.split(" ");
	var channelID = self._getChannelById(originalMessage.channelID);
	self.postMessageToChannel(channel.name,ping.promise.probe(words[1]),{as_user: true});

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
		var channelID = self._getChannelById(originalMessage.channelID);
		self.postMessageToChannel(channelID.name,result,{as_user: true});
	});
};

Bot.prototype._returnChuckNorrisFacts = function(originalMessage){

	var self = this;
	self.db.get('SELECT id, joke FROM jokes ORDER BY RANDOM() LIMIT 1', function (err, record){
		if(err){
			return console.error('Error in Database',err);
		}

		var channelID = self._getChannelById(originalMessage.channelID);
		self.postMessageToChannel(channelID.name,record.joke,{as_user: true});
	});
};

module.exports = Bot;






