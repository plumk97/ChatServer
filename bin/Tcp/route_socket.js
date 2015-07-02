

var h_handle = require('./handle_socket.js');
var datagram = require('./datagram.js');
var ObjectId = require('mongodb/node_modules/mongodb-core').BSON.ObjectID;


function route_socket (parameter, socket, db, clients, isServer) {

    var action = parameter['action'];
    if (!action) {

        datagram.send(socket, {'code' : 0, 'msg' : '请选择请求目标'});
        return;
    }
    var handle = new h_handle();
    handle.dict().action = action;

    var userid = parameter['userid'];
    if (action != 10 && action != 9 && userid == null && (!isServer || isServer == false)) {
        datagram.send(socket, {'code' : 0, 'msg' : '请输入用户id'});
        return;
    }

    action = 'action' + action;

    if (userid && (!isServer || isServer == false)) {
        db.findFromCollection(db.coll_user, {'_id':ObjectId(userid)}, function (err, result) {

            if (err) {
                datagram.send(socket, {'code' : 0, 'msg' : err.toString()});
            } else if (result.length == 0) {
                datagram.send(socket, {'code' : 0, 'msg' : '没有此用户'});
            } else {
                if (typeof handle[action] === 'function') {
                    handle.setSocket(socket);
                    handle.setParameter(parameter);
                    handle.setDB(db);
                    handle.setClients(clients);
                    handle[action]();
                } else {

                    datagram.send(socket, {'code' : 0, 'msg' : '没有找到此方法'});
                }
            }
        });
    } else {
        if (typeof handle[action] === 'function') {
            handle.setSocket(socket);
            handle.setParameter(parameter);
            handle.setDB(db);
            handle.setClients(clients);
            handle[action]();
        } else {

            datagram.send(socket, {'code' : 0, 'msg' : '没有找到此方法'});
        }
    }



}

exports.route_socket = route_socket;
