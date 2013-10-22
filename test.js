
var mock = require('./index');

// redirect localhost/note/** to bd.liandong.org/blog
// the request response by the back-end-proxy
var proxyConfig = {
    host: 'bd.liandong.org',
    port: 80,
    cookie: {name:'linkwisdom'},
    replace: [
        {source: '/note', target: '/blog'}
    ]
};


var config = {
    service: 'getFile',
    port: 8087,
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
                replace: [
                    {source: 'note/', target: 'blog/'},
                    {source: /\.ajax$/g, target: '.php'},
                    {source: /\.css$/g, target: '.less'}
                ]
            }
        )
    };