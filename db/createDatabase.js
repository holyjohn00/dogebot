'use strict';

var path = require('path');
var Async = require('async');
var request = require('request');
var progressBar = require('progress');
var sqlite3 = require('sqlite3').verbose();

var createDB = process.argv[2] || path.resolve(__dirname,'dogebotDB.db');
var db = new sqlite3.Database(createDB);

request('http://api.icndb.com/jokes/count', function(error, response, body) {
	if (!error  && response.statusCode === 200) {
		var cnt = JSON.parse(body).value;
		var i = 0;	
		var bar = new progressBar(':bar :current/:total', {total: cnt});


		db.serialize;
		db.run('CREATE TABLE IF NOT EXISTS jokes (id INTEGER PRIMARY KEY, joke TEXT)');
		db.run('CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, username TEXT, val TEXT DEFAULT NULL)');
		var jokesCount = 0;

		var test = function () {
			return cnt > jokesCount;
		};



		var fetchJoke = function(fetchDB){
			request('http://api.icndb.com/jokes/'+ (++i) + '?escape=javascript', function (err, response, body){
				if(err || response.statusCode !== 200){
					console.log(i,error, response.statusCode);
					return fetchDB(error || response.statusCode);
				}

				var result = null;
				try{
					result = JSON.parse(body).value;
				}catch(ex) {
					return fetchDB(null);
				}

				db.run('INSERT INTO jokes(joke) VALUES (?)', result.joke, function(err){
					if(err){
						return fetchDB(err);

					}

					bar.tick();
					jokesCount++;
					return fetchDB(null);
				});


			});
		};
		var onComplete = function(err){
			db.close();
				if(err){
				console.log('Error: ', err);
				process.exit(1);
			}
		};

		return Async.whilst(test,fetchJoke,onComplete);
	};
	
	console.log('Error');
	process.exit(1);
});

