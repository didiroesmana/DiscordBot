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

var urlApi = Config.fjb_urlApi;
var authKey = Config.fjb_authKeyApi;

var exports = module.exports = {};
module.exports.processCJBScroll = processCJBScroll;
var CJBScroll_pattern = /^(J|WTS|WTJ|S|B|WTB)(>|:|=)(.*)/i;

/*
 * FJB Scroll
 * Server: 0 Chaos, 1 Loki, 2 Midgard, 3 Asgard, 4 Valhalla
 */
function processCJBScroll(msg, user, server) {
	var patt = new RegExp(CJBScroll_pattern);
	var res = patt.test(msg.content);
	if (res == true) {

		// TODO: More filtering
		var esc_msg = msg.content.replace(/[\\\"]/g, "\\$&");
		esc_msg = esc_msg.replace(/(\r|\n)/g,"<br />");

		callCJBApi(msg.author.id, msg.author.username, esc_msg, server, function (error, response, body) {
			if (error) throw new Error(error);

			res = JSON.parse(body);
			if (res != undefined && res.list == true) {
				console.log("Added");
				return true;
			}

			//cb(false);
		});
	}
}

function callCJBApi(userid, username, msg, server, cb) {
	var options = {
		method: 'POST',
		url: urlApi,
		headers: {
			'content-type': 'application/form-data'
		},
		form: {
			data: '{"API_Key": "'+authKey+'","API_Req": "fjb_scrolls", "server" : "'+server+'", "userid" : "'+userid+'", "username" : "'+username+'", "msg" : "'+msg+'"}'
		}
	};

	return request(options, function (error, response, body) {
		return cb(error, response, body);
	});
}
