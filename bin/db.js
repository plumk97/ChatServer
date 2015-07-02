
var mongodb = require('mongodb');

var db_server = new mongodb.Server("127.0.0.1", 27017, {auto_reconnect : true});
var db = new mongodb.Db('MQ_Chat_Db',db_server, {safe : true});


/**
 * 数据库管理类
 * @constructor
 */
function DB () {

    /**
     * 打开数据库
     */
    this.openDB = function() {
        db.open(function (err, db) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("打开数据成功");

        });
    }


    /**
     * 连接到表
     * @param _name 表明
     * @param callback 返回 包含2个参数 err coll
     */
    this.collection = function (_name, callback) {

        if (!_name) {
            callback ('集合名为空');
        } else {
            db.collection (_name, {safe : true}, function (err, collection) {
                callback (err, collection);
            });
        }
    }
    /**
     * 查找数据
     * @param coll_name 集合名字
     * @param conditions 查找条件
     * @param callback 返回 包含2个参数 err  docs
     */
    this.findFromCollection = function (coll_name, conditions, callback) {

        if (!coll_name) {
            callback('集合名为空');
            return;
        }

        if (typeof  conditions === 'function') {
            callback = conditions;
            conditions = {};
        }

        db.collection (coll_name, {safe : true}, function (err, collection) {
            if (err) {
                callback(err);
                return;
            }

            collection.find(conditions).toArray(callback);

        });
    }

    /**
     * 插入数据到某个Collection
     * @param coll_name collection名字
     * @param object 数据内容
     * @param callback 包含2个参数 error result
     */
    this.insertToCollection = function (coll_name, object, callback) {

        if (!coll_name) {
            callback('集合名为空');
            return;
        }

        db.createCollection(coll_name.toString(), {safe : true}, function (err, coll) {

            if (err) {
                callback(err);
                return;
            }
            coll.insertOne(object, {safe : true}, callback);

        });

    }


    /**
     * 删除collection中的数据
     * @param coll_name collection 名字
     * @param conditions 条件 如果为空则全部删除
     * @param callback 回调方法 包含2个参数 error result
     */
    this.removeCollection = function (coll_name, conditions, callback) {

        if (typeof  conditions === 'function') {
            callback = conditions;
            conditions = null;
        }

        if (!coll_name) {
            callback('集合名为空');
            return;
        }
        db.collection (coll_name, {safe: true}, function (err, collection) {

                if (err)
                {
                    callback(err);
                    return;
                }

                // 删除指定条件数据
                collection.removeMany (conditions, callback);
        });


    }
}

// 集合名称
DB.prototype.coll_user = "coll_user";
DB.prototype.coll_message = 'coll_message';
DB.prototype.coll_message_offline = 'coll_message_offline';



module.exports = DB;
