var Config = require('../config.json');

var knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : Config.db.host,
    user     : Config.db.user,
    password : Config.db.password,
    database : Config.db.name,
    charset  : 'utf8'
  }
});

var bookshelf = require('bookshelf')(knex);
bookshelf.init = function(){
	knex.schema.createTableIfNotExists('trivia_questions', function (table) {
	  table.increments();
	  table.string('question', 1000);
	  table.integer('total_point');
	  table.integer('level');
	  table.string('added_by').notNullable();
	  table.foreign('added_by').references('users.id');
	  table.integer('status',1);
	  table.timestamps();
	}).then(function(res){

	}).catch(function(err){
		console.log(err);
	});

	knex.schema.createTableIfNotExists('trivia_answers', function (table) {
	  table.increments();
	  table.string('answer');
	  table.integer('question_id',10).unsigned();
	  table.foreign('question_id').references('trivia_questions.id');
	  table.integer('point');
	  table.string('added_by').notNullable();
	  table.timestamps();
	  table.foreign('added_by').references('users.id');
	}).then(function(res){
		
	}).catch(function(err){
		console.log(err);
	});

	
}

module.exports = bookshelf;