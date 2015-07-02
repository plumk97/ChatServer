

function send (socket, data) {

    var buffer = [];
    data = JSON.stringify(data);
    data = new Buffer(data);

    var length = new Buffer(4);
    length[0] = data.length;
    length[1] = data.length >> 8;
    length[2] = data.length >> 16;
    length[3] = data.length >> 24;

    buffer.push(length);

    buffer.push(data);

    buffer = Buffer.concat(buffer, 4 + data.length);


    socket.write(buffer);

}


exports.send = send;
