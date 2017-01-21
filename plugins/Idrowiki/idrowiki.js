var request = require("request");
var Store = require("jfs");

var db = new Store("data",{type:"memory"});

try{
	var Config = require("../../Config.json");
} catch(e) {
    console.log("Couldn't load Config.json with error: " + e);
}

var urlApi = Config.urlApi;
var authKey = Config.authKeyApi;
var discordUser = DiscordUser.prototype;

exports.commands = [
	"whereis",
	"whodrops",
	"anu",
	"wmi",
	"wii",
	"pilih"
];

var badWords = [
	"jodoh",
	"pacar",
	"mantan"
];

exports.anu = {
	usage: "anu",
	description: "anu",
	process: function(bot, msg, suffix) {
		getDiscordUser(msg.author, function(user) {
			console.log(user);
		});
	}
}

exports.whereis = {
	usage:"nama monster",
	description: "memberikan info letak posisi monster",
	process: function(bot, msg, suffix) {
		if (suffix.length < 3) {
			return msg.channel.sendMessage("Minimal 3 karakter coi").then((message => message.delete(5000)));
		}

		if (badWords.indexOf(suffix.toLowerCase()) >= 0 ) {
			return msg.channel.sendMessage(msg.author.toString()+" Bukan biro jodoh kak :(");
		}

		var namaMonster = suffix;
		getDiscordUser(msg.author, function(user) {
			searchMonster(namaMonster, function(map){
				if (map != false) {
					user.putQueue("whereis", map);
					user.setLastCommand("whereis");
					parseArray(map, function(index, data){return "\n"+Config.commandPrefix+"wmi "+index+" => "+data['kROName'];}, function(str){
						msg.channel.sendMessage(msg.author.toString()+ ' List monster berdasarkan keyword ' + namaMonster + ' '+str+ '\nuntuk keterangan lebih lanjut bisa klik \nhttps://db.idrowiki.org/klasik/monster/search/name/'+encodeURI(namaMonster)).then((message => message.delete(60000)));
					});					
				} else {
					msg.channel.sendMessage( msg.author.toString()+' Monster ' + namaMonster + ' tidak ditemukan' );
				}
				user.putQueue("whereis", map);
			});

		});
	}
}

exports.wii = {
	usage: "index sebelumnya dari hasil "+Config.commandPrefix+"whodrops",
	description: "Info drop item",
	process: function(bot, msg, suffix) {
		getDiscordUser(msg.author, function(user) {
			parseWii(msg, user, suffix);
		});
	}
}

exports.pilih = {
	usage: "index",
	description: "Memilih dari hasil perintah sebelumnya ",
	process: function(bot, msg, suffix) {
		getDiscordUser(msg.author, function(user) {
			user.getLastCommand(function(cmd){
				if (cmd == "whodrops") {
					parseWii(msg, user, suffix);
				} else if (cmd == "whereis") {
					parseWmi(msg, user, suffix);
				}
			});
		});
	}
}

exports.whodrops = {
	usage:"nama item",
	description: "memberikan info item",
	process: function(bot, msg, suffix) {
		if (suffix.length < 3) {
			return msg.channel.sendMessage("Minimal 3 karakter coi").then((message => message.delete(5000)));
		}
		
		if (badWords.indexOf(suffix.toLowerCase()) >= 0 ) {
			return msg.channel.sendMessage(msg.author.toString()+" Bukan biro jodoh kak :(");
		}

		var namaItem = suffix;
		getDiscordUser(msg.author, function(user) {
			searchItem(namaItem, function(itemlist){
				if (itemlist != false) {
						user.putQueue("whodrops", itemlist);
						user.setLastCommand("whodrops");
						parseArray(itemlist, function(index, data){return "\n"+Config.commandPrefix+"wii "+index+" => "+data['displayname'];}, function(str){
							msg.channel.sendMessage(msg.author.toString()+ ' List Item berdasarkan keyword ' + namaItem + ' '+str+ '\nuntuk keterangan lebih lanjut bisa klik \nhttps://db.idrowiki.org/klasik/item/search/name/'+encodeURI(namaItem)).then((message => message.delete(60000)));
						});					
					} else {
						msg.channel.sendMessage( msg.author.toString()+' Item ' + namaItem + ' tidak di temukan say :(' ).then((message => message.delete(5000)));
					}
					user.putQueue("whodrops", itemlist);
			});
		});
	}
}

exports.wmi = {
	usage: "index sebelumnya dari hasil "+Config.commandPrefix+"whereis",
	description: "Info monster",
	process: function(bot, msg, suffix) {
		getDiscordUser(msg.author, function(user) {
			parseWmi(msg, user ,suffix);
		});
	}
}

function parseWii(msg, user, suffix) {
	user.getQueue("whodrops", function(data){
		if (data != undefined && data) {
			var mon = data[suffix];
			if (mon != undefined) {
				searchItemList(data[suffix]["id"], function(map){
					if (map != false) {
						msg.channel.sendMessage(msg.author.toString()+' Item ' + data[suffix]["displayname"] + ' ada di map \n'+map+ 'untuk keterangan lebih lanjut bisa klik \nhttps://db.idrowiki.org/klasik/item/search/name/'+encodeURI(data[suffix]["displayname"])).then((message => message.delete(60000)));
					} else {
						msg.channel.sendMessage(msg.author.toString()+' Item ' + data[suffix]["displayname"] + ' tidak di drop cyin~' ).then((message => message.delete(5000)));
					}
				});
			}
			
		}
	});
}

function parseWmi(msg, user, suffix) {
	user.getQueue("whereis", function(data){
		if (data != undefined && data) {
			var mon = data[suffix];
			if (mon != undefined) {
				monsterMaplist(data[suffix]["ID"], function(map){
					if (map != false) {
						msg.channel.sendMessage(msg.author.toString()+' Monster ' + data[suffix]["kROName"] + ' ada di map \n'+map+ 'untuk keterangan lebih lanjut bisa klik https://db.idrowiki.org/klasik/monster/'+encodeURI(data[suffix]["ID"])).then((message => message.delete(60000)));
					} else {
						msg.channel.sendMessage(msg.author.toString()+' Monster ' + data[suffix]["kROName"] + ' tidak ditemukan' );
					}
				});
			}
			
		}
	});
}

//
// Parse Array to String
function parseArray(data, format, cb) {
	var to_string = "```";
	for (var i = 0; i < data.length; i++) {
		var dat = data[i];
		to_string += format(i,dat);
	};
	to_string += "```";
	return cb(to_string);
}

function monsterMaplist(id, cb) {
	callDbApi("monster_maplist", id , function (error, response, body) {
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		var mapList = "```\n";
		if (res.map !== undefined && res.map) {
			for (var i = 0; i < res.map.length; i++) {
				var map = res.map[i];
				mapList += map['name'] + "("+map['count']+")\n";
				if (i > 4) {
					break;
				}
			}
			mapList += "```";
			return cb(mapList);
		} else {
			console.log('gak ada :(');
		}

		return cb(false);
	});
}

function searchMonster(nama, cb) {
	callDbApi("monster_search", nama, function (error, response, body) {
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		if (res.found >= 1) {
			return cb(res.moblist);
		}

		cb(false);
	});
}

function searchItem(nama, cb) {
	callDbApi("item_search", nama, function(error, response, body){
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		if (res.found >= 1) {
			return cb(res.itemlist);	
		}

		cb(false);
	})
}

function searchItemList(id, cb) {
	callDbApi("item_droplist", id, function(error, response, body) {
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		var mobList = "```\n";
		if (res.moblist !== undefined && res.moblist) {
			for (var i = 0; i < res.moblist.length; i++) {
				var moblist = res.moblist[i];
				mobList += moblist['iROName'] + "\n";
				if (i > 4) {
					break;
				}
			}
			mobList += "```\n";
			return cb(mobList);
		} else {
			console.log('gak ada :( '+ id);
		}

		return cb(false);
	});
}

function DiscordUser(user) {
	this._id = user.id;
	this.queue = [];
	this._lastCommand = "";
	this.getLastRequest = function() {
		return this._lastRequest;
	}

	this.getQueue = function(key, cb) {
		cb(this.queue[key]);
	}

	this.putQueue = function(key, data) {
		this.queue[key] = data;
		this.save();
	}

	this.save = function() {
		db.save(this._id, this, function(err){
		 
		});
	}

	this.setLastCommand = function(str) {
		this._lastCommand = str;
	}

	this.getLastCommand = function(cb) {
		return cb(this._lastCommand);
	}
}

function getDiscordUser(user, cb) {
	db.get(user.id, function(err, obj){
		var usrDiscord;
		if (!obj) {
			usrDiscord = new DiscordUser(user);
			usrDiscord.save();
		} else {
			usrDiscord = obj;
		}
		return cb(usrDiscord);
	});
}

function callDbApi(type, keyword, cb) {
	var options = { 
		method: 'POST',
		url: urlApi,
		headers: {
			'content-type': 'application/x-www-form-urlencoded' 
		},
		form: { 
			data: '{"API_Key": "'+authKey+'","API_Req":"'+type+'", "keyword" : "'+keyword+'"}' 
		} 
	};

	return request(options, function (error, response, body) {
		return cb(error, response, body);
	});
}

