
var net = require('net');
var url = require('url');


/**
 * 通过 username 寻找socket
 * @param _username socket的username
 * @param callback 回调方法
 */
Array.prototype.find = function (_username, callback) {


    var tmpArr = this;
    process.nextTick( function() {

        var isFind = false;

        for(var i =0 ; i < tmpArr.length; i++){

            var socket = tmpArr[i];
            if (socket.username == _username) {
                if (callback) {callback(socket);}
                isFind = true;
                break;
            }

        };
        if (isFind == false) {
            if (callback) {callback(null);}
        }

    });

}



/**
 * socket 服务器
 */
function socket () {


    var clients = [];


    this.start = function (route, db) {


        var s1 = net.createServer( function (socket) {
            console.log('连接:' + socket.remoteAddress);

            clients.push(socket);

            // 初始化数据包的长度 跟 当前接受的长度 处理粘包用
            socket.acceptMaxLength = 0;
            socket.acceptLength = 0;

            socket.on('data', function (data) {


                while (1) {

                    // 如果最大接受长度为 0 则视为当前数据包第一次接受
                    if (socket.acceptMaxLength == 0) {

                        // 取出前四个字节 计算出当前数据包最大的长度
                        var length = parseInt(data[socket.acceptLength]) + (parseInt(data[socket.acceptLength + 1]) << 8) + (parseInt(data[socket.acceptLength + 2]) << 16) + (parseInt(data[socket.acceptLength + 3]) << 24);

                        if (isNaN(length))
                        {
                            console.log("max");
                            continue;
                        }
                        socket.acceptMaxLength = length;
                        socket.acceptData = data.slice(socket.acceptLength + 4, length + 4);
                        socket.acceptLength = socket.acceptLength + 4 + length;
                    } else {
                        var length = socket.acceptMaxLength - socket.acceptData.length;
                        socket.acceptData += data.slice(0, length);
                        socket.acceptLength += length;
                    }

                    if (socket.acceptData.length >= socket.acceptMaxLength) {

                        try {

                            var parameter = JSON.parse(decodeURI(socket.acceptData.toString()));
                            route (parameter, socket, db, clients);
                            socket.acceptData = null;
                            socket.acceptMaxLength = 0;
                        }
                        catch(exception){
                            socket.acceptLength = 0;
                            socket.acceptData = null;
                            socket.acceptMaxLength = 0;
                            console.log(exception);
                            break;
                        }
                        finally    {

                        }


                    }

                    if (socket.acceptLength >= data.length) {
                        socket.acceptLength = 0;
                        break;
                    }
                }

            });

            socket.on('close', function (had_error){

                // 断开连接 如果这个用户正在语音中则给对方发送语音 提示断线了
                if (socket.audioUsername) {
                    var parameter = {'action' : 15, 'to' : socket.audioUsername, 'from' : socket.username, 'type' : 1};
                    route (parameter, socket, db, clients, true);
                }


                console.log(clients.length);
                clients.splice(clients.indexOf(socket), 1);
                console.log(clients.length);
                console.log('关闭连接:' + socket + "  isError:" + had_error);

            });

            socket.on('error', function (error) {
                socket.destroy();
                console.log('错误:' + socket + " error: " + error);
            });

        }).listen(8881);


        console.log('Socket server has start port:8881');
    }

}

module.exports = socket;


