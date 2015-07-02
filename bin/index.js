
var server = require('./server.js');
var socket = require('./Tcp/socket.js');
var h_route = require('./http/route_http.js');
var s_route = require('./Tcp/route_socket.js');
var db = require('./db.js');

var sock1 = new socket();
var s1 = new server();
var d1 = new db();

d1.openDB();


s1.start(h_route.route_http, d1);
sock1.start(s_route.route_socket, d1);

/**
 * 时间格式化
 * @param format 格式化字符串
 * @returns {*}
 */
Date.prototype.format = function(format)
{
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3), //quarter
        "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
        (this.getFullYear()+"").substr(4- RegExp.$1.length));
    for(var k in o)if(new RegExp("("+ k +")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length==1? o[k] :
                ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
}
