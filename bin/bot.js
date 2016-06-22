
'use strict';

var Bot = require('../lib/dogebot');

var token = "xoxb-49364486341-YCR4jVlx0hoT4rSNG5Ki67Jx";
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var bot = new Bot({
	token: token,
	dbPath: dbPath,
	name: name

});

bot.run();