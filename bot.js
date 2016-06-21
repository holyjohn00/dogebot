'use strict';

var Bot = require('../lib/dogebot');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var bot = new Bot({
	token: token,
	dbPath: dbPath,
	name: name

});

bot.run();