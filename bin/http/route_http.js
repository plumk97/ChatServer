
var url = require('url');
var h_handle = require('./handle_http.js');
var path = require ('path');
var fs = require('fs');

/**
 * 路由处理
 */
function route_http(req, res, db) {

    var pathname = url.parse(req.url).pathname;
    if (path.extname(pathname) == '.jpg') {

        pathname = pathname.replace('/bin','.')
        fs.readFile(pathname,'binary', function (error, file) {

            if (error) {

                res.writeHead(200, {'Content-Type' : "text/plain"});
                res.write(error.toString());
                res.end();
            } else {
                res.writeHead(200, {'Content-Type' : 'image/png'});
                res.write(file, "binary");
                res.end();
            }

        });


    } else if (path.extname(pathname) == '.amr') {

        pathname = pathname.replace('/bin','.')
        fs.readFile(pathname,'binary', function (error, file) {

            if (error) {

                res.writeHead(200, {'Content-Type' : "text/plain"});
                res.write(error.toString());
                res.end();
            } else {
                res.writeHead(200, {'Content-Type' : 'image/png'});
                res.write(file, "binary");
                res.end();
            }

        });


    } else {

        pathname = pathname.substring(1);

        var handler = new h_handle();
        if (typeof handler[pathname] === 'function') {

            process.nextTick ( function () {
                handler.setRequest(req);
                handler.setRespone(res);
                handler.setDB(db);
                handler.setSucceedCallback(function (data) {
                    res.write(JSON.stringify(data));
                    res.end();
                });
                handler.setPathname(handler[pathname]);
            });



        } else {
            res.end(JSON.stringify({'msg' : '没有找到此方法'}));
        }
    }
}

exports.route_http = route_http;
