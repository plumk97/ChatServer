var fs = require('fs');
var util = require('util');
var formidable = require("formidable");
var interfaces = require('os').networkInterfaces();
var url = require('url');

var sharp = require('sharp');


/**
 * 处理请求类
 *
 */
function handle_http () {



    var req, res, db, succeedCallback, pathname, parameter;

    var dict = {code : 1, data : {}, msg : ""};

    this.setRequest = function (_request) {
        req = _request;
    }
    this.setRespone = function (_respone) {
        res = _respone;
    }
    this.setDB = function (_db) {
        db = _db;
    }
    this.setSucceedCallback = function (callback) {
        succeedCallback = callback;
    }
    this.setPathname = function (_pathname) {
        pathname = _pathname;

        start();
    }


    function start () {


        if (req.method == 'GET') {

            parameter = url.parse(req.url, true).query;
            pathname();
        } else {
            var form = new formidable.IncomingForm();
            form.parse(req, function (error, fields, files) {

                parameter = fields;
                pathname();
            });
        }
    }

    this.chatList = function () {

        db.collection (db.coll_user, function (error, collection) {
            if (error != null) {
                dict.msg = error.toString();
                dict.code = 0;
                succeedCallback(dict);
            } else {
                collection.find({}, {sort: {'_id': -1}, limit: 1, skip:0}).toArray(function (err, dos) {
                    if (err) {
                        dict.code = 0;
                        dict.msg = err.toString();
                    } else {
                        dict.data = dos;
                    }

                    succeedCallback(dict);
                });
            }

        });
    }


    this.allUser = function () {

        db.findFromCollection(db.coll_user, {}, function (err, result) {

            if (err) {
                dict.code = 0;
                dict.msg = err.toString();
            } else {
                dict.data = result;
            }

            succeedCallback(dict);

        });

    }


    this.addPhoto = function () {

        this.upload();

    }

    /**
     * 上传图片
     */
    this.upload = function () {

        var form = new formidable.IncomingForm();
        form.parse(req, function (error, fields, files) {

            if (error) {
                dict[code] = 0;
                dict[msg] = error.toString();
                succeedCallback(dict);
            } else {

                if (!files.file) {

                    dict.code = 0;
                    dict.msg = '没有图片';

                    succeedCallback(dict);
                    return
                }
                var name = files.file.path.split('/');
                name = 'bin/image/' + name[name.length - 1] + '.jpg';

                fs.rename(files.file.path, name, function (error) {

                    if (error) {

                        dict[code] = 0;
                        dict[msg] = error.toString();
                        succeedCallback(dict);
                    } else {

                    }
                });
            }
        });


    }

}

module.exports = handle_http;
