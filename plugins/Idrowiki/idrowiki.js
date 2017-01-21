var request = require("request");

try{
	var Config = require("../../Config.json");
} catch(e) {
    console.log("Couldn't load Config.json with error: " + e);
}

var urlApi = Config.urlApi;
var authKey = Config.authKeyApi;

exports.commands = [
	"whereis",
	"whodrops"
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
		if (suffix.length < 4) {
			return msg.author.sendMessage("Minimal 3 karakter");
		}

		if (badWords.indexOf(suffix.toLowerCase()) >= 0 ) {
			return msg.channel.sendMessage("Bukan biro jodoh kak :(");
		}

		var namaMonster = suffix;
		searchMonster(namaMonster, function(map){
			if (map != false) {
				msg.channel.sendMessage( 'Monster ' + namaMonster + ' ada di map \n'+map+ 'untuk keterangan lebih lanjut bisa klik https://db.idrowiki.org/klasik/monster/'+namaMonster);
			} else {
				msg.channel.sendMessage( 'Monster ' + namaMonster + ' tidak ditemukan' );
			}
		});
		
	}
}

exports.whodrops = {
	usage:"nama item",
	description: "memberikan info item",
	process: function(bot, msg, suffix) {
		if (suffix.length < 4) {
			return msg.author.sendMessage("Minimal 3 karakter");
		}
		
		if (badWords.indexOf(suffix.toLowerCase()) >= 0 ) {
			return msg.channel.sendMessage("Bukan biro jodoh kak :(");
		}

		var namaItem = suffix;
		searchItem(namaItem, function(monster){
			if (monster != false) {
				msg.channel.sendMessage( 'Item ' + namaItem + ' ada di monster \n'+monster+ 'untuk keterangan lebih lanjut bisa klik https://db.idrowiki.org/klasik/item/'+namaItem);
			} else {
				msg.channel.sendMessage( 'Maaf ' + namaItem + ' tidak ditemukan' );
			}
		});
		
	}
}

function monsterMaplist(id, cb) {
	var options = { 
		method: 'POST',
		url: urlApi,
		headers: {
			'content-type': 'application/x-www-form-urlencoded' 
		},
		form: { 
			data: '{"API_Key": "'+authKey+'","API_Req":"monster_maplist", "keyword" : "'+id+'"}' 
		} 
	};

	console.log("monster id "+id);
	request(options, function (error, response, body) {
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		var mapList = "";
		if (res.map !== undefined) {
			for (var i = 0; i < res.map.length; i++) {
				var map = res.map[i];
				mapList += map['name'] + " ("+map['count']+")\n";
				if (i > 4) {
					break;
				}
			}
			return cb(mapList);
		} else {
			console.log('gak ada :(');
		}

		return cb(false);
	});
}

function searchMonster(nama, cb) {
	var options = { 
		method: 'POST',
		url: urlApi,
		headers: {
			'content-type': 'application/x-www-form-urlencoded' 
		},
		form: { 
			data: '{"API_Key": "'+authKey+'","API_Req":"monster_search", "keyword" : "'+nama+'"}' 
		} 
	};

	request(options, function (error, response, body) {
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		if (res.found > 1) {
			for (var i = 0; i < res.moblist.length; i++) {
				var mob = res.moblist[i];
				if (mob.iROName.toLowerCase().indexOf(nama.toLowerCase()) >= 0) {
					return monsterMaplist(mob.ID, function(map){
						return cb(map);
					});
				}
			}
		} else if (res.found == 1) {
			return monsterMaplist(res.moblist[0], function(map){
				return cb(map);
			});
		}

		cb(false);
	});
}


function searchItem(nama, cb) {
	var options = { 
		method: 'POST',
		url: urlApi,
		headers: {
			'content-type': 'application/x-www-form-urlencoded' 
		},
		form: { 
			data: '{"API_Key": "'+authKey+'","API_Req":"item_search", "keyword" : "'+nama+'"}' 
		} 
	};

	request(options, function (error, response, body) {
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		if (res.found > 1) {
			for (var i = 0; i < res.itemlist.length; i++) {
				var item = res.itemlist[i];
				if (item.displayname.toLowerCase().indexOf(nama.toLowerCase()) >= 0) {
					return searchItemList(item.id, function(item){
						return cb(item);
					});
				}
			}
		} else if (res.found == 1) {
			return searchItemList(res.itemlist[0].id, function(item){
				return cb(item);
			});
		}

		cb(false);
	});
}

function searchItemList(id, cb) {
	var options = { 
		method: 'POST',
		url: urlApi,
		headers: {
			'content-type': 'application/x-www-form-urlencoded' 
		},
		form: { 
			data: '{"API_Key": "'+authKey+'","API_Req":"item_droplist", "keyword" : "'+id+'"}' 
		} 
	};

	request(options, function (error, response, body) {
		if (error) throw new Error(error);
		
		res = JSON.parse(body);
		// get first macthed name
		var mobList = "";

		if (res.moblist !== undefined) {
			for (var i = 0; i < res.moblist.length; i++) {
				var moblist = res.moblist[i];
				mobList += moblist['name'] + "\n";
				if (i > 4) {
					break;
				}
			}
			return cb(mobList);
		} else {
			console.log('gak ada :( '+ id);
		}

		return cb(false);
	});
}