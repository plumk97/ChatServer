
var mongodb = require('mongodb');

var db_server = new mongodb.Server("127.0.0.1", 27017, {auto_reconnect: true});
var db = new mongodb.Db('MQ_ChatDb', db_server, {safe : true});


/**
 * 数据库单例
 * @type {{name}}
 */
var sharedDb = function () {


    return {

        name : ''

    };
}()

/**
 * 数据库管理
 * @constructor
 */

function DB () {





}

module.exports = DB;
