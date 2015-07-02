

var http = require('http');


function server () {


    this.start = function (route, db) {
        http.createServer( function (req, res) {

            if (req.url == '/favicon.ico')
            {
                return;
            }
            res.writeHead(200, {'Content-Type' : "application/json;charset=utf-8"});

            //db.removeCollection(db.coll_user, {}, function (err, result) {
            //    console.log(err);
            //    console.log(result);
            //});
            route(req, res, db);

        }).listen(8888);

        console.log('Server has start prot: 8888');
    }

}

module.exports = server;

