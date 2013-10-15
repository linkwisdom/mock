/**
 * fc for nirvana project
 * @author  liandong(liu@liandong.org)
 * 
 */

var querystring = require('querystring');


/**
 * getQuery Response data
 * @param  {Object} config {response: 'modPath'}
 * @return {Function}
 *
 * please config the edp-webserver-config.js as 
 *
 *     {
 *          location: /\/request\.ajax/,
 *          handler: mock.getQuery({response: './resp'})
 *     }
 */

exports.getQuery = function(responsor) {
    var me = this;
    me.response = responsor;

    function getContent(req) {
        var path = req.query.path;
        var params = req.body.params;
        var rst = {};

        //所有的请求，必有path和params两个字段
        if (path && req.body && req.body.params) {
            rst = me.response.getResult(path, params);
        }
        return rst;
    }

    return function( context ) {
        var req = context.request;

        context.header[ 'Content-Type' ] = 'application/json';

        if (req.bodyBuffer) {
            var buffer = req.bodyBuffer.toString();
            req.body = querystring.parse(buffer);
            if (req.body && req.body.params) {
                req.body.params = JSON.parse(req.body.params);
            }
        }
        else {
            req.body = {};
        }
        
        var rst = getContent(req);

        //context.content = JSON.stringify(rst, '   ', 3);
        context.content = JSON.stringify(rst);
        context.status = 200; 
        context.start();
    };
};
