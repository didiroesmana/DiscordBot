var User = require('../User/user');

var bookshelf = require('../../lib/bookshelf');
var ModelBase = require('bookshelf-modelbase')(bookshelf);
var sync = require('synchronize');
try{
	var Config = require("../../Config");
} catch(e) {
    console.log("Couldn't load Config.json with error: " + e);
}

var exports = module.exports = {};
var started = false;
var loaded_question = [];
var current_question = false;
var current_fiber = false;
var answered = false;
var deferred = false;
var is_deferred = false;
var current_answers = [];
var answered_counter =0;
var current_trivia_users=[];

module.exports.TriviaQuestion = TriviaQuestion;
module.exports.TriviaAnswers = TriviaAnswers;
module.exports.getLoadedQuestion = getLoadedQuestion;
module.exports.isStarted = isStarted;
module.exports.processChat = processChat;


var TriviaQuestion = ModelBase.extend({
	tableName: 'trivia_questions',
	answered:false,
	shouldDeffer: false,
	answers: function(cb) {
		return this.hasMany(TriviaAnswers) 
	},
	user: function(cb){
		return this.hasOne(User.User);
	},
	isAnswer: function(string) {
		return this.answers(function(answers){
			str = '%'+string.toLowerCase()+'%';
			answers.query('where','answer','LIKE',str);
		});
	}
});

var TriviaAnswers = ModelBase.extend({
	tableName: 'trivia_answers',
	question: function(cb) {
		return this.hasOne(TriviaQuestion) 
	}
});

var Questions = bookshelf.Collection.extend({
	model: TriviaQuestion
});

function isStarted(){
	return started;
}

/**
 * Get Question
 * @return Array of TriviaQuestion [description]
 */
function getLoadedQuestion(){
	return loaded_question;
}

function getTriviaStatusLabel(){
	return isStarted()? 'sedang berjalan' : 'berhenti';
}

function processChat(msg, user){
	// if (current_question.isAnswer(msg.content)) {
		var index_answer = current_answers.indexOf(msg.content.toLowerCase());
		if ((index_answer >= 0) && (answered_counter > 0)) {
			current_question.answers().query(function(qb){qb.where('answer','=',msg.content)}).fetchOne().then(function(data){
				current_answers.splice(index_answer, 1);
				answered_counter--;
				if (data != null && data) {
					msg.channel.sendMessage(msg.author+" berhasil menjawab pertanyaan.\nMendapatkan point:"+data.get('point')).then((message => message.delete(5000)));
					try	{
						if (current_question.shouldDeffer && (answered_counter == 0)) {
							deferred();
							current_question.shouldDeffer = false;
						}
						if (current_trivia_users[msg.author.username] !== undefined) {
							current_trivia_users[msg.author.username] += data.get('point');
						} else {
							current_trivia_users[msg.author.username] = data.get('point');
						}
						current_question.answered = true;
					} catch(e) {

					}
					User.getDiscordUser(msg.author, function(user){
						user.addTriviaPoint(1);
						user.addPoint(data.get('point'));
					});
					
				}
				// } else {
				// 	msg.channel.sendMessage("cie "+msg.author+" salah jawab, cieee.\n").then((message => message.delete(1000)));
				// }
			});
		}
		// }).catch(function(error){
		// 	console.log("error"+error);
		// });
	// } else {
		// console.log(current_question.isAnswer(msg.content)).then((e => console.log(e)));
	// }
}

function setGameQuestion(first,model, msg, cb) {
	current_question = model;
	current_answers = [];
	answered_counter =0;
	model.answers().fetch().then(function(a){
		a.forEach(function(b){
			current_answers.push(b.get('answer').toLowerCase());
		});
		answered_counter= current_answers.length;
		console.log(current_answers, answered_counter);

	}).catch((e => console.log(e)));

	var additional = first ? "pertanyaan selanjutnya\n":"";
	var pert = "```diff\n";
	if (first) {
		msg.channel.sendMessage('Memulai pertanyaan selanjutnya dalam 5 detik').then((message => message.delete(5000)));
		setTimeout(function(){
			pert +=additional+"+ "+current_question.get('question')+" \n- point : "+current_question.get('total_point')+"";
			pert +="\n```";
			msg.channel.sendMessage(pert).then((message => message.delete(60000)));
		},5000);
	} else {
		pert +=additional+"+ "+current_question.get('question')+" \n- point : "+current_question.get('total_point')+"";
		pert +="\n```";
		msg.channel.sendMessage(pert).then((message => message.delete(60000)));
	}
	
	setTimeout(function(){
		setTimeout(function(){
			if (!model.answered) {
				msg.channel.sendMessage("Waktu habis!!!").then((message => message.delete(3000)));
			} else {

			}
			try	{
					model.answered=true;
					if (model.shouldDeffer) {
						deferred();
						model.shouldDeffer=false;
					}
				}catch(e) {

				}

		},5000);
	},10000);

}

function startTriviaGame(models,msg){
	current_trivia_users=[];
	sync.fiber(function(){
		for (var i = models.length - 1; i >= 0; i--) {
			deferred = sync.defers();
			is_deferred = true;
			var isFirst = i == models.length -1;
			models[i].answered=false;
			models[i].shouldDeffer=true;
			var model = sync.await(setGameQuestion(!isFirst,models[i],msg,deferred));
			
		};
		started = false;
		msg.channel.sendMessage("**Trivia selesai...**").then((message => message.delete(15000)));
		// printTriviaSession(function(str){msg.channel.sendMessage(str)});
		
		current_trivia_users=[];
	});
}

function printTriviaSession(cb){
	// var str ="============================\n";
	//     str+="Username              Point \n";
	// var arr_usr = current_trivia_users.sort();
	// var len = arr_usr.slice();
	// var max = arr_usr.length;
	// var count = 0;
	// Object.keys(arr_usr).forEach(function(username) {
	//   var point = arr_usr[username];
	//   str+=username+"                "+point+"\n";
	//   count++;
	// 	console.log(arr_usr,username,point, count, max,len.length, len);
	// 	if (count === max) {
	// 		console.log(str);
 //    	return cb(str);
	//   }
	// });
	// if (count === 0 && max ===0) {
	// 	return cb(str);
	// }
}

function addQuestionToGame(total,level,msg){
	// Questions.shuffle().take(total).get().then((questions)=>{
	// 	console.log(questions);
	// });
	bookshelf.plugin('pagination');
	TriviaQuestion.query(function (qb){
		qb.where('status','=','1');
		qb.where('level','=',level);
		qb.orderByRaw('rand()');
	}).fetchPage({pageSize:total,withRelated: ['answers']}).then(function(results){
		if (results.length >= 1) {
			started = true;
			msg.channel.sendMessage("Memulai trivia dengan "+total+" pertanyaan").then((message => message.delete(1000)));
			startTriviaGame(results.models,msg);
		} else {
			return msg.channel.sendMessage("Pertanyaan Trivia untuk level ini tidak tersedia").then((message => message.delete(1000)));
		}
	});
}

exports.commands = [
	"trivia",
	"atq",
	"ata",
	"ate"
]

exports.trivia = {
	usage:"<jumlah> <level<1|2|3|>>",
	description:"description",
	process: function(bot, msg, suffix) {
		var args = suffix.split(" ");
		var total = args[0]?args[0]:10;
		var arrLevel = ["1","2","3"];
		var level = args[1]?((arrLevel.indexOf(args[1])>=0)?args[1]:1):1;

		if (isStarted() === true) {
			msg.channel.sendMessage(current_question.get('question')+" \ndengan total point = "+current_question.get('total_point')).then((message => message.delete(5000)));
			return msg.channel.sendMessage("Trivia sedang berjalan cyin~").then((message => message.delete(1000)));
		} else {
			return addQuestionToGame(total,level,msg);
		}
	}
}

exports.atq = {
	usage:"<level> <pertanyaan>",
	description: "menambahkan pertanyaan trivia",
	process: function(bot, msg, suffix) {
		var args = suffix.split(" ");
		var arrLevel = ["1","2","3"];
		var level = arrLevel.indexOf(args.shift());
		if (level >= 0) {
			level++;
		} else {
			return msg.author.sendMessage('Level pertanyaan salah');
		}

		var pertanyaan = args.join(" ").replace("  "," ");
		if (pertanyaan === undefined || (pertanyaan === "") || (pertanyaan === " ")) {
			return msg.author.sendMessage('Harap masukkan pertanyaan');
		}

		User.getDiscordUser(msg.author, function(user){
			new TriviaQuestion({
				question: pertanyaan,
				level:level,
				added_by: user.get('id'),
				status: 0
			}).save().then(function(model){
				user.putQueue("trivia_question", model);
				user.setLastCommand("atq");
				msg.author.sendMessage('pertanyaan \n'+pertanyaan+"\ntelah sukses di tambahkan, silahkan menambahkan jawaban dengan mengetik \n"+Config.commandPrefix+"ata <point> <jawaban>");
			}).catch(function(err){
				console.log(err);
				msg.author.sendMessage("gagal menambahkan pertanyaan");
			});
		});
	}
}

exports.ata = {
	usage:"<poin> <jawaban>",
	description:"menambahkan jawaban dari pertanyaan sebelumnya",
	process: function(bot, msg, suffix) {
		var args = suffix.split(" ");
		var poin = args.shift();

		var jawaban = args.join(" ").replace("  "," ");
		if (jawaban === undefined || (jawaban === "") || (jawaban === " ")) {
			return msg.author.sendMessage('Harap masukkan jawaban');
		}

		User.getDiscordUser(msg.author, function(user){
			user.getLastCommand(function(cmd){
				if ( cmd === "atq") {
					user.getQueue("trivia_question", function(question){
						if ((question !== undefined) && question) {
							new TriviaAnswers({
								answer: jawaban,
								point:poin,
								added_by: user.get('id'),
								trivia_question_id: question.id
							}).save().then(function(model){
								msg.author.sendMessage('jawaban \n'+jawaban+"\ntelah sukses di tambahkan, untuk menambahkan jawaban lain ketik\n"+Config.commandPrefix+"ata <point> <jawaban>\natau ketik"+Config.commandPrefix+"ate untuk menyudahi memasukan jawaban");
							}).catch(function(err){
								msg.author.sendMessage("gagal menambahkan jawaban");
							});
							console.log("jeh gak ada");
						}
						console.log(question);
					});
					console.log("bah");
				} else {
					msg.author.sendMessage("ngapain sob? "+poin+jawaban);
				}
			});
		});
	}
}

exports.ate = {
	usage:"just type it",
	description:"menyudahi menambahkan jawaban",
	process: function(bot, msg, suffix) {
		User.getDiscordUser(msg.author, function(user){
			// user.putQueue("trivia_question", false);
			user.getLastCommand(function(cmd){
				if ( cmd === "atq") {
					var total = 0;
					user.getQueue("trivia_question", function(question){
						new TriviaQuestion({id: question.id})
						.save({status: 1}, {patch: true}).then(function(model){
							model.answers().fetch().then(function(a){
								a.forEach(function(b){
									total += b.get('point');
								});
								new TriviaQuestion({id: question.id})
								.save({total_point: total}, {patch: true}).then(function(c){
									user.setLastCommand("");
									user.putQueue("",false);
									msg.author.sendMessage("Selesai menambahkan trivia");
								});
							});
						});
					});
				} else {
					msg.author.sendMessage("Anda belum menambahkan pertanyaan sebelumnya");
				}
			});
		});

	}
}