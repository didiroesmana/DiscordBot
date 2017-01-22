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

module.exports = require('bookshelf')(knex);