var request = require("request");
var Store = require("jfs");
var Decimal = require('decimal');

var db = new Store("data",{type:"memory"});

var dcUser = require("../User/user.js");

try{
	var Config = require("../../Config.json");
} catch(e) {
    console.log("Couldn't load Config.json with error: " + e);
}

var urlApi = Config.urlApi;
var authKey = Config.authKeyApi;


exports.commands = [
	"whereis",
	"whodrops",
	"wmi",
	"wii",
	"mapinfo",
	"mapi",
	"pilih"
];

var badWords = [
	"jodoh",
	"pacar",
	"mantan"
];

exports.whereis = {
	usage:"nama monster",
	description: "memberikan info letak posisi monster",
	process: function(bot, msg, suffix) {
		if (suffix.length < 3) {
			return msg.channel.sendMessage("Minimal 3 karakter kak").then((message => message.delete(5000)));
		}

		if (badWords.indexOf(suffix.toLowerCase()) >= 0 ) {
			return msg.channel.sendMessage(msg.author.toString()+" Bukan biro jodoh kak :(");
		}

		var namaMonster = suffix;
		dcUser.getDiscordUser(msg.author, function(user) {
			searchMonster(namaMonster, function(map){
				if (map != false) {
					user.setLastCommand("whereis");
					user.putQueue("whereis", map);
					parseArray(map, function(index, data){return "\n"+Config.commandPrefix+"pilih "+index+" => "+data['Name'];}, function(str){
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
		dcUser.getDiscordUser(msg.author, function(user) {
			parseWii(msg, user, suffix);
		});
	}
}

exports.pilih = {
	usage: "index",
	description: "Memilih dari hasil perintah sebelumnya ",
	process: function(bot, msg, suffix) {
		dcUser.getDiscordUser(msg.author, function(user) {
			user.getLastCommand(function(cmd){
				if (cmd == "whodrops") {
					parseWii(msg, user, suffix);
				} else if (cmd == "whereis") {
					parseWmi(msg, user, suffix);
				} else if (cmd == "mapinfo") {
					parseMapi(msg, user, suffix);
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
			return msg.channel.sendMessage("Minimal 3 karakter kak").then((message => message.delete(5000)));
		}

		if (badWords.indexOf(suffix.toLowerCase()) >= 0 ) {
			return msg.channel.sendMessage(msg.author.toString()+" Bukan biro jodoh kak :(");
		}

		var namaItem = suffix;
		dcUser.getDiscordUser(msg.author, function(user) {
			searchItem(namaItem, function(itemlist){
				if (itemlist != false) {
						user.setLastCommand("whodrops");
						user.putQueue("whodrops", itemlist);
						parseArray(itemlist, function(index, data){return "\n"+Config.commandPrefix+"pilih "+index+" => "+data['DisplayName'];}, function(str){
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
		dcUser.getDiscordUser(msg.author, function(user) {
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
						msg.channel.sendMessage(msg.author.toString()+' Item ' + data[suffix]["DisplayName"] + ' ada di monster \n'+map+ 'untuk keterangan lebih lanjut bisa klik \nhttps://db.idrowiki.org/klasik/item/'+encodeURI(data[suffix]["id"])).then((message => message.delete(60000)));
					} else {
						msg.channel.sendMessage(msg.author.toString()+' Item ' + data[suffix]["DisplayName"] + ' tidak di drop cyin~' ).then((message => message.delete(5000)));
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
						msg.channel.sendMessage(msg.author.toString()+' Monster ' + data[suffix]["Name"] + ' ada di map \n'+map+ 'untuk keterangan lebih lanjut bisa klik https://db.idrowiki.org/klasik/monster/'+encodeURI(data[suffix]["ID"])).then((message => message.delete(60000)));
					} else {
						msg.channel.sendMessage(msg.author.toString()+' Monster ' + data[suffix]["Name"] + ' tidak spawn' ).then((message => message.delete(5000)));
					}
				});
			}

		}
	});
}

///////// Map Info /////////
exports.mapinfo = {
	usage:"nama map",
	description: "memberikan info monster pada map",
	process: function(bot, msg, suffix) {
		if (suffix.length < 3) {
			return msg.channel.sendMessage("Minimal 3 karakter kak").then((message => message.delete(5000)));
		}

		if (badWords.indexOf(suffix.toLowerCase()) >= 0 ) {
			return msg.channel.sendMessage(msg.author.toString()+" Bukan biro jodoh kak :(");
		}

		var namaMap = suffix;
		dcUser.getDiscordUser(msg.author, function(user) {
			searchMap(namaMap, function(map){
				if (map != false) {
					user.setLastCommand("mapinfo");
					user.putQueue("mapinfo", map);
					parseArray(map, function(index, data){return "\n"+Config.commandPrefix+"pilih "+index+" => "+data['name'];}, function(str){
						msg.channel.sendMessage(msg.author.toString()+ ' List map berdasarkan keyword ' + namaMap + ' '+str+ '\nuntuk keterangan lebih lanjut bisa klik \nhttps://db.idrowiki.org/klasik/map/search/name/'+encodeURI(namaMap)).then((message => message.delete(60000)));
					});
				} else {
					msg.channel.sendMessage( msg.author.toString()+' Map ' + namaMap + ' tidak ditemukan' );
				}
				user.putQueue("mapinfo", map);
			});

		});
	}
}

exports.mapi = {
	usage: "index sebelumnya dari hasil "+Config.commandPrefix+"mapinfo",
	description: "Info nama map",
	process: function(bot, msg, suffix) {
		dcUser.getDiscordUser(msg.author, function(user) {
			parseMapi(msg, user, suffix);
		});
	}
}

function parseMapi(msg, user, suffix) {
	user.getQueue("mapinfo", function(data){
		if (data != undefined && data) {
			var mon = data[suffix];
			if (mon != undefined) {
				searchMapList(data[suffix]["name"], function(map){
					if (map != false) {
						msg.channel.sendMessage(msg.author.toString()+' Monster pada map ' + data[suffix]["desc"] + ' (' + data[suffix]["name"]+ '): \n'+map+ 'untuk keterangan lebih lanjut bisa klik \nhttps://db.idrowiki.org/klasik/map/'+encodeURI(data[suffix]["name"])).then((message => message.delete(60000)));
					} else {
						msg.channel.sendMessage(msg.author.toString()+' Tidak ada monster pada map ' + data[suffix]["name"] ).then((message => message.delete(5000)));
					}
				});
			}

		}
	});
}

function searchMapList(id, cb) {
	callDbApi("map_info", id, function(error, response, body) {
		if (error) throw new Error(error);

		res = JSON.parse(body);
		// get first macthed name
		var mobList = "```\n";
		if (res.moblist !== undefined && res.moblist) {
			for (var i = 0; i < res.moblist.length; i++) {
				var moblist = res.moblist[i];
				mobList += moblist['Name'] + " (" + moblist['spawnData']['count'] + " | Lv. "+moblist['LV']+" | HP. "+moblist['HP']+" | EXP. "+moblist['EXP']+" | JEXP. "+moblist['EXP']+")\n";
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

function searchMap(nama, cb) {
	callDbApi("map_search", nama, function (error, response, body) {
		if (error) throw new Error(error);

		res = JSON.parse(body);
		// get first macthed name
		if (res.found >= 1) {
			return cb(res.maplist);
		}

		cb(false);
	});
}
///////// Map Info *end* /////////

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
				var droprate = Decimal.div(moblist['rate'], '100.00').toNumber();
				mobList += moblist['Name'] + " (" + droprate + "%)\n";
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


