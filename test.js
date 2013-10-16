
var mock = require('mockfc');

// redirect localhost/note/** to bd.liandong.org/blog
// the request response by the back-end-proxy
var proxyConfig = {
    host: 'bd.liandong.org',
    port: 80,
    locates: {
        '/note': '/blog'
    }
};


var config = {
    service: 'getFile',
    port: 8080,
    dir: './',
    proxy: proxyConfig
};

mock.startServer(config);


/**
 * -------------------------------------------------
 *  for fc test
 * -------------------------------------------------
 *  proxy bd.liandong.org/bloc with localhost/note/
 *
 *  query *.css and the according *.less file;
 *
 *  when *.ajax query, redirect it to the php file
 *
 * -------------------------------------------------
 */

    var option = {
        location: /\/note/,
        handler: mock.proxy(
            {
                host: 'bd.liandong.org',
                port: 80,
                reset: true, 
                replace: [
                    {source: 'note/', target: 'blog/'},
                    {source: /\.ajax$/g, target: '.php'},
                    {source: /\.css$/g, target: '.less'}
                ]
            }
        )
    };