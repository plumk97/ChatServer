
var datagram = require('./datagram.js');
var fs = require('fs');
var sharp = require('sharp');
var crypto = require ('crypto');


function handle_socket () {

    var socket, parameter, db, clients;
    var dict = {code : 1, data : {}, msg : "",action : 0};

    this.setSocket = function (_socket) {   socket = _socket;   }
    this.setParameter = function (_parameter) {     parameter = _parameter; }
    this.setDB = function (_db) {   db = _db;   }
    this.dict = function () {   return dict;    }
    this.setClients = function (_clients) {     clients = _clients;     }


    /**
     * 返回数据给客户端
     * @param data 数据
     */
    function send(data) {   datagram.send(socket, data);    }


    /**
     * 注册接口
     */
    this.action9 = function () {
        process.nextTick(function () {
            var username = parameter['username'];
            var password = parameter['password'];

            if (!username) {
                dict.code = 0;
                dict.msg = "用户名为空";
                send(dict)
            } else {

                // 查找数据里面是否存在这个用户名
                db.findFromCollection(db.coll_user,{'username' : username}, function (err, result) {
                    if (result.length > 0) {
                        dict.code = 0;
                        dict.msg = "用户名已经存在";
                        send(dict);
                    } else if (!password) {
                        dict.code = 0;
                        dict.msg = "密码为空";
                        send (dict);
                    } else {

                        // 插入数据库
                        db.insertToCollection(db.coll_user, parameter, function (err, result) {

                            if (err) {
                                dict.code = 0;
                                dict.msg = err.toString();
                                send (dict);
                            } else {

                                dict.data = result.ops[0];
                                send(dict);
                            }

                        });

                    }

                });

            }
        });


    }


    /**
     * 登录接口
     */
    this.action10 = function () {

        process.nextTick(function () {
            var username = parameter['username'];
            var password = parameter['password'];
            if (!username) {
                dict.code = 0;
                dict.msg = "用户名为空";
                send(dict);

            } else if (!password){
                dict.code = 0;
                dict.msg = "密码为空";
                send(dict);
            } else {

                clients.find (username, function (sock) {
                    // 是否已经登录
                    if (sock) {

                        var dict1 = JSON.parse(JSON.stringify( dict ));
                        dict1.action = 19;
                        datagram.send(sock, dict1);
                        clearSocket(sock);
                    }
                    // 效验用户名密码
                    db.findFromCollection(db.coll_user,{'username' : username,'password' : password}, function (err, result) {
                        if (result.length > 0) {
                            dict.data = result[0];

                            // 为socket 设置username 属性 用于标识
                            socket.username = username;
                        } else {
                            dict.code = 0;
                            dict.msg = "用户名或密码错误";
                        }
                        send(dict);

                        if (socket.username) {
                            // 查找这个账号的离线消息并发送给客户
                            db.findFromCollection(db.coll_message_offline, {'to' : socket.username}, function (err, result) {

                                if (result.length > 0) {
                                    var tmpDict = dict;
                                    tmpDict.action = 14;
                                    tmpDict.data.list = result;
                                    tmpDict.code = 1;
                                    tmpDict.msg = "";
                                    datagram.send(socket, tmpDict);
                                }
                                db.removeCollection(db.coll_message_offline, {'to' : socket.username}, function (err, result) {
                                    if (err) {
                                        console.log('删除离线消息失败' + err.toString());
                                    }
                                });

                            });
                        }
                    });
                });

            }
        });

    }

    /**
     * 发送消息
     */
    this.action11 = function () {

        process.nextTick(function () {



            var curSessionId = createSessionId(parameter['from'], parameter['to']);
            // 创建信息保存进数据库

            var message = {};
            message.from = parameter['from'];
            message.to = parameter['to'];
            message.type = parameter['type'];
            message.messageId = parameter['messageId'];
            message.time = message.messageId;
            message.sessionId = curSessionId;

            var dict1 = {code : 1, data : {'messageId' : message.messageId}, msg : "ok",action : 11};
            switch ( message.type) {
                case 0 :
                {

                    message.content = parameter['content'];
                    sendMessageToObject(message);
                    insertMessageToDB(message);

                    send(dict1);

                }
                    break;
                case 1 :
                {
                    // 获取图片buffer
                    var buffer = new Buffer(parameter['image'], 'base64');

                    // 生成图片名字
                    var md5 = crypto.createHash('md5');
                    md5.update((new Date()).toString());
                    var fileName = md5.digest('hex').toString() + '.jpg';

                    // 写出图片到本地
                    fs.writeFile('./image/' + fileName, buffer, function (err) {
                        if (err) {
                            dict1.code = 0;
                            dict1.msg = err.toString();
                            send(dict1);
                        } else {
                            // 生成图片缩略图
                            var thumbnail = new sharp('./image/' + fileName);
                            thumbnail.metadata(function (err, mData) {
                                if (err) {
                                    dict1.code = 0;
                                    dict1.msg = err.toString();
                                    send(dict1);
                                } else {

                                    var angle = 0;

                                    switch (mData.orientation) {
                                        case 6 :
                                            angle = 90;
                                            break;
                                        case 3 :
                                            angle = 180;
                                            break;
                                        case 8 :
                                            angle = 270;
                                            break;
                                    }

                                    var width = mData.width;
                                    var height = mData.height;

                                    if (angle == 90 || angle == 270) {
                                        height = mData.width;
                                        width = mData.height;
                                    }
                                    var maxValue = MAX(width, height);

                                    if (width > 150) {
                                        width *= 150 / maxValue;
                                    }
                                    if (height > 150) {
                                        height *= 150 / maxValue;
                                    }

                                    width = MAX(width, 100);
                                    height = MAX(height, 60);

                                    thumbnail.resize(parseInt(width), parseInt(height)).rotate(angle).toFile('./image/t_' + fileName, function (err) {
                                        if (err) {
                                            dict1.code = 0;
                                            dict1.msg = err.toString();
                                            send(dict1);
                                        } else {

                                            // 发送信息给对方
                                            message.remotePath = 'bin/image/' + fileName;
                                            message.thumbnailPath = 'bin/image/t_' + fileName;
                                            message.imageWidth = width;
                                            message.imageHeight = height;

                                            sendMessageToObject(message);
                                            insertMessageToDB(message);

                                            // 返回信息给发送方

                                            send(dict1);
                                        }
                                    });
                                }


                            });
                        }



                    });



                }
                    break;
                case 2 :
                {
                    message.locationName = parameter['locationName'];
                    message.latitude = parameter['latitude'];
                    message.longitude = parameter['longitude'];
                    sendMessageToObject(message);
                    insertMessageToDB(message);
                    send(dict1);
                }
                    break;

                case 3 :
                {
                    // 获取语音buffer
                    var buffer = new Buffer(parameter['audioData'],'base64');

                    // 生成语音
                    var md5 = crypto.createHash('md5');
                    md5.update((new Date()).toString());
                    var fileName = md5.digest('hex').toString() + '.amr';
                    // 写出语音到本地
                    fs.writeFile('./audio/' + fileName, buffer, function (err) {

                        if (err) {
                            dict1.code = 0;
                            dict1.msg = err.toString();
                        } else {
                            message.audioRemote = 'bin/audio/' + fileName;
                            message.audipPlayTime = parameter['audioPlayTime'];

                            sendMessageToObject(message);
                            insertMessageToDB(message);

                            send(dict1);
                        }
                    });
                }
                    break;
            }




        });

    }


    /**
     * 插入信息到数据库
     * @param message 信息对象
     */
    function insertMessageToDB (message) {

        db.insertToCollection(db.coll_message, message, function (err, result) {
            if (err)
            {
                console.log('保存聊天失败->' + err.toString());
            } else {
                var sessionId = createSessionId(message.to, message.from);
                var new_message = JSON.parse(JSON.stringify( message ));
                new_message.sessionId = sessionId;

                db.insertToCollection(db.coll_message, new_message, function (err, result) {
                    if (err)
                    {
                        console.log('保存聊天失败->' + err.toString());
                    }
                });
            }
        });


    }

    /**
     * 发送信息给对方
     * @param message 信息对象
     */
    function sendMessageToObject (message) {

        // 发送聊天信息给对方
        var toName = message.to;
        dict.action = 12;
        dict.data = message;
        clients.find(toName, function (sock) {
            if (sock) {
                datagram.send(sock, dict);
            } else {
                console.log('保存离线记录');
                var sessionId = createSessionId(message.to, message.from);
                var new_message = JSON.parse(JSON.stringify( message ));
                new_message.sessionId = sessionId;
                db.insertToCollection(db.coll_message_offline, new_message, function (err, result) {
                    if (err)
                    {
                        console.log('保存离线聊天失败' + err.toString());
                    }
                });
            }

        });
    }

    /**
     * 通过2个人的名字创建唯一的sessionId
     * @param _username1 用户名1
     * @param _username2 用户名2
     * @returns {string|String}
     */
    function createSessionId (_username1, _username2) {

        var sessionId = _username1 + _username2;
        var arr =  new Array();
        for (var i in sessionId)
        {
            arr.push(sessionId[i]);
        }
        arr.sort();
        return arr.toString().replace(/\,/g, '') + _username1;
    }

    /**
     * 获取聊天记录
     */
    this.action13 = function ()
    {
        process.nextTick(function () {
            var sId = createSessionId(parameter['username'], parameter['username1']);
            db.findFromCollection(db.coll_message, {sessionId : sId}, function (err, result) {

                if (err) {
                    dict.msg = err.toString();
                    dict.code = 0;
                } else {
                    dict.data.list = result;
                }
                send(dict);

            });
        });

    }

    /**
     * 语音一系列操作
     */
    this.action15 = function () {


        /**
         * type 类型
         * 0 => 连接中
         * 1 => 断开连接
         * 2 => 连接
         * 3 => 对方不在线
         * 4 => 对方拒绝
         * 5 => 对方通话中
         */

        process.nextTick(function () {

            var toUsername = parameter['to'];
            var fromUsername = parameter['from'];
            var type = parameter['type'];
            var port = parameter['port'];

            clients.find(toUsername, function (sockt) {

                if (sockt == null) {
                    dict.code = 0;
                    dict.data = {'type' : 3};
                    dict.msg = '对方不在线';
                    send(dict);
                    return;
                } else {
                    var dict1 = {'action' : 15,'code' : 0, 'data' : {'type' : type, 'username' : fromUsername, "ipaddr" : socket.remoteAddress},'msg' : ''};
                    switch (type) {
                        case 0:
                            if (sockt.audioUsername) {
                                dict.code = 0;
                                dict.data = {'type' : 5};
                                dict.msg = '对方语音中';
                                send(dict);
                                return;
                            } else {
                                dict1.data.port = port;
                                socket.audioUsername = sockt.username;
                                sockt.audioUsername = socket.username;
                            }
                            break;
                        case 1:
                            if (!(socket.audioUsername && socket.audioUsername == sockt.username)) {
                                return;
                            }
                            socket.audioUsername = null;
                            sockt.audioUsername = null;
                            break;
                        case 2:
                            socket.audioUsername = sockt.username;
                            sockt.audioUsername = socket.username;
                            break;
                        case 4:
                            socket.audioUsername = null;
                            sockt.audioUsername = null;
                            break;
                    }
                    datagram.send(sockt, dict1);
                }
            });

        });
    }


    /**
     * 删除用户一条信息
     */
    this.action16 = function () {


        var messageId = parameter.messageId;
        var sessionId = parameter.sessionId;
        if (messageId == null || sessionId == null) {
            dict.msg = 'messageId或sessionId为空';
            dict.code = 0;
            send(dict);
        } else {
            deleteMessage(messageId, sessionId);
        }
    }

    /**
     * 删除一个用户的所有消息
     */
    this.action17 = function () {

        var sessionId = parameter.sessionId;
        db.findFromCollection(db.coll_message, {'sessionId' : sessionId}, function (error, result) {

            if (!error && result.length) {
                for (var i = 0; i < result.length; i++) {
                    var obj = result[i];
                    deleteMessage(obj.messageId, sessionId);
                }
            }
        });
    }


    /**
     * 删除信息
     * @param _messageid 信息id
     * @param _sessionid 信息所属会话id
     */
    function deleteMessage (_messageid, _sessionid) {

        process.nextTick(function () {

            // 查找在线消息库
            db.findFromCollection(db.coll_message, {'messageId' : _messageid, 'sessionId' : _sessionid}, function (error, result) {
                if (!error && result.length > 0) {

                    var message = result[0];
                    if (message.type == 1) {

                        var path = message.remotePath.replace('bin', '.');
                        var t_path = message.thumbnailPath.replace('bin', '.');
                        fs.unlink(path, function (error) {
                        });
                        fs.unlink(t_path, function (error) {
                        });
                    } else if (message.type == 3) {
                        var path = message.audioRemote.replace('bin', '.');
                        fs.unlink(path, function (error) {
                        });
                    }
                    db.removeCollection(db.coll_message, {'messageId' : _messageid, 'sessionId' : _sessionid}, function (error, result) {
                    });
                }
            });

            // 查找离线消息库
            db.findFromCollection(db.coll_message_offline, {'messageId' : _messageid, 'sessionId' : _sessionid}, function (error, result) {
                if (!error && result.length > 0) {

                    var message = result[0];
                    if (message.type == 1) {

                        var path = message.remotePath.replace('bin', '.');
                        var t_path = message.thumbnailPath.replace('bin', '.');
                        fs.unlink(path, function (error) {
                        });
                        fs.unlink(t_path, function (error) {
                        });
                    } else if (message.type == 3) {
                        var path = message.audioRemote.replace('bin', '.');
                        fs.unlink(path, function (error) {
                        });
                    }
                    db.removeCollection(db.coll_message_offline, {'messageId' : _messageid, 'sessionId' : _sessionid}, function (error, result) {

                    });


                }
            });

        });

    }


    this.action18 = function () {

        var logOutUsername = parameter['username'];
        if (logOutUsername) {

            clients.find (logOutUsername, function (sock) {
                if (sock) {
                    clearSocket(sock);
                    send(dict);
                } else {
                    dict.code = 0;
                    dict.msg = "没有找到此用户";
                    send(dict);
                }
            });

        } else {
            dict.code = 0;
            dict.msg = "用户名为空";
            send(dict);

        }
    }

    function clearSocket (sock) {
        sock.username = null;
        sock.audioUsername = null;
        sock.acceptLength = 0;
        sock.acceptData = null;
        sock.acceptMaxLength = 0;
    }

    function MIN (value1, value2) {
        return value1 > value2 ? value2 : value1;
    }

    function MAX (value1, value2) {
        return value1 > value2 ? value1 : value2;
    }

}


module.exports = handle_socket;

