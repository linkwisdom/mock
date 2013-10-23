/**
 * ## edp mock service
 * ## @author: liandong(liu@liandong.org)
 *
 * ## mock 模块设计目标
 * - 支持edp插件形式，通过反向代理请求其它端口或主机数据
 * - 支持静态文件作为mock数据
 * - 支持JS文件生成动态数据 （holding）
 *  
 */

var fs      = require( 'fs' );
var path    = require( 'path' );
var http    = require('http');
var url     = require('url');
var Cookie  = require('./cookie');

/**
 * getQuery for fc project
 */
exports.getQuery = function(responsor) {
    var fc = require('./fc');
    return fc.getQuery(responsor);
};


/**
 * start a stand-alone web server
 */
exports.startServer = function(config) {
    var me = this;
    var port = config.port || 8011;
    var srv = config.service || 'getFile';

    // 配置服务参数
    me.response = this[srv](config);

    var proxy = me.getProxy(config.proxy);

    console.log('starting....');

    // 启动一项服务
    http.createServer(function(request, response) {
        

        request.query = url.parse(request.url);

        var context = {
            request : request,
            response: response,
            status: 202,
            mimeType: 'text/html'
        };

        context.start = function() {
            response.writeHead(
                context.status, 
                {'Content-Type': context.mimeType}
            );
            response.end(context.content);
        };

        if (!proxy.resolve(context)) {
            me.response(context);
        }
    }).listen(port);
};

/**
 * list the files for the target dir
 */
exports.listFile = function(dirname) {
    var flag = false;
    var i = 0;

    
    if (fs.existsSync(dirname)) {
        var stat = fs.statSync(dirname);
        if (stat.isFile()) {
            dirname = path.dirname(dirname);
        }
    }


    do {
        flag = fs.existsSync(dirname);
        if (flag) {
            break;
        }

        dirname = path.dirname(dirname);
        i++;
    } while (!flag && i < 2);

    if (flag) {
        var lst = [];

        var files = fs.readdirSync(dirname);

        files.forEach(function(file) {
            var filePath = path.join(dirname, file);
            var stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                file = file + '/';
            }

            if (file.charAt(0) != '.') {
                lst.push( ''
                    + '<a href="'
                    + file + '" >' 
                    + file + '</a>'
                );
            }
        });

        return lst.map(function(item) {
            return '<li>' + item + '</li>';
        }).join('');
    }
};

exports.notFound = function(filePath) {
    return '';
};

/**
 * read file from local path
 */
exports.getFile = function(config) {
    var me  = this;
    var dir = config.dir;
    var def = config.index || 'index.html';
    var notFound = config.notFound || me.listFile;

    return function(context) {
        var req = context.request;
        var pathname = req.query.pathname;
        var filePath = path.join(dir, pathname);

        if (fs.existsSync(filePath)) {
            var stat = fs.statSync(filePath);

            if (stat.isFile()) {
                context.content = fs.readFileSync(filePath);
            }
            else {
                filePath = path.join(filePath, def);
                if (fs.existsSync(filePath)) {
                    context.content = fs.readFileSync(filePath);
                }
                else {
                    context.content = notFound(filePath);
                    context.status = 404;
                }
            }
            context.status = 200; 
        }
        else {
            context.content = notFound(filePath);
            context.status = 404;
        }
        context.start();
    };
};


/**
 * getProxy for the proxy-server
 * upgrading...
 */
exports.getProxy = function(config) {

    return {
        resolve: function(context) {
            var flag = false;
            var query= context.request.query;
            var replace = config.replace || [];
            var path = config.path || [];
            var pathname = query.pathname;
            var flag = false;

            path.forEach(function(item) {
                flag = flag || (pathname.indexOf(item) > -1);
            });

            for (var item in replace) {
                if (flag) {
                    break;
                }

                var source = replace[item].source;
                flag = flag || (source.test && source.test(pathname));
                flag = flag || (pathname.indexOf(source) > -1);   
            }

            if (flag) {
                this.response(context);
                return true;
            }
        },
        response: this.proxy(config)
    };

};

/**
 * modify cookies for proxy
 * @param  {object} headers request.headers
 * @param  {object} params  cookie to be set
 */
function modCookie(headers, params) {
    var str = headers.cookie;

    var lst = str.match(/([^=;]*)=([^=;]*);/g);

    var cookie = lst.filter(function(item) {
        var km = item.split('=');

        var key = km[0];

        if (key in params) {
            return false;
        }

        return item;
    });

    for (var item in params) {
        cookie.push(item + '=' + params[item]);
    }

    headers.cookie = cookie.join('&');
}

function modRequest(request, config) {
    var params = config.postParams;

    var cookie = config.cookie;

    var replace = config.replace;

    var headers = request.headers;

    //rewrite bodydata
    if (params) {}

    if (cookie) {
        modCookie(headers, cookie);
    }

    if (replace) {
        replace.forEach(function(rep) {
            request.url = request.url.replace(rep.source, rep.target);
        });
    }
}

/**
 * 将当前请求建立反向代理
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 *
 * TODO： 再连接超多情况下会挂掉
 */
exports.proxy = function(config) {
    var httpProxy = require('http-proxy');
    var proxy = new httpProxy.RoutingProxy();

    var proxyConfig = {
        host: config.host || 'localhost',
        port: config.port || 8088
    };

    return function(context) {
        var response = context.response;
        var request = context.request;

        //if request-databody are buffered, reset it
        if (request.bodyBuffer) {
            request.removeAllListeners('data');
            request.removeAllListeners('end');

            setTimeout(function() {
                var buffer = new Buffer(128);

                if (request.bodyBuffer) {
                    buffer = request.bodyBuffer;
                }

                request.emit('data', buffer, 'utf8');
                request.emit('end', new Buffer(0), '');
            }, 20);

            context.stop();
        }

        // mod request, postData, cookie, url, etc
        modRequest(request, config);

        //var cookie = new Cookie(request, response);
        proxy.proxyRequest(request, response, proxyConfig);
        
    };
};
