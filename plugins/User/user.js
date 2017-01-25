var Store = require("jfs");

var db = new Store("userData");
var serialize = require('node-serialize');
var bookshelf = require('../../lib/bookshelf');

var exports = module.exports = {};

module.exports.getDiscordUser = getDiscordUser;
module.exports.User = User;

exports.commands = [
	"point"
]

exports.point = {
	usage: "just type it",
	description: "ulalala",
	process: function(bot, msg, suffix) {
		getDiscordUser(msg.author,function(user){
			user.getPoint(function(point){
				return msg.channel.sendMessage(msg.author.toString()+" memiliki "+ point +" point").then((message => message.delete(5000)));;
			});
		});
	}
}

exports.pranks = {
	usage: "just type it",
	description: "ulalalala",
	process: function(bot, msg, suffix) {

	}
}

var User = bookshelf.Model.extend({
	tableName: 'users',
  	getLastRequest: function() {
		return this.get('last_request');
	},

	getQueue : function(key, cb) {
		return cb(JSON.parse(this.get('queue')));
	},

	putQueue : function(key, data) {
		this.set('queue',JSON.stringify(data));
		this.save();
	},

	addPoint : function(point){
		point = typeof point !== 'undefined' ? point : 1;
		this.set('point', (this.get('point')+1));
		this.save();
	},

	addTriviaPoint : function(point){
		point = typeof point !== 'undefined' ? point : 1;
		this.set('trivia_point', (this.get('trivia_point')+1));
		this.save();
	},

	deductPoint : function(point){
		point = typeof point !== 'undefined' ? point : 1;
		this.set('point', (this.get('point')-1));
		this.save();
	},

	getPoint : function(cb) {
		return cb(this.get("point"));
	},

	setLastCommand : function(str) {
		this.set("last_command", str);
	},

	getLastCommand : function(cb) {
		return cb(this.get("last_command"));
	},

	getUsername: function(){
		return this.get('username');
	},

	putUsername: function(username){
		this.set('username', username);
		this.save();
	}
});

function getDiscordUser(user, cb) {
	User.forge({id: user.id}).fetch().then(function(usr) {  
		if (usr == null) {
			return User.forge({id: user.id}).save({id: user.id, point:0},{method: 'insert'}).then(function(u){
				return cb(u);
			}).catch(function(err){
				console.log(err);
			});
		}
		
		if (usr.getUsername() == null){
			usr.putUsername(user.username);
		}
	    return cb(usr);
	}).catch(function(e){
		
	});
}
