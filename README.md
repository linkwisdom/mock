mock
====

mock by reverve-proxy

## install
    
    npm install mockfc

### or
    
    npm install git://github.com/linkwisdom/mock.git



### usage

    var mock = require('./index');

    // redirect localhost/note/** to blog.liandong.org/blog
    // the request response by the back-end-proxy

    var proxyConfig = {
        host: 'bd.liandong.org',
        port: 80,
       // path: ['/project'],
       // cookie: {name:'linkwisdom'},
        replace: [
            {source: '/project/114', target: '/project/114'}
        ]
    };


    var config = {
        service: 'getFile',
        port: 8080,
        dir: './',
        proxy: proxyConfig
    };

    mock.startServer(config);

### test for edp project
- config your edp config file
- make sure that request send normally

.


    {
        location: /\/request\.ajax/,
        handler: mock.getQuery(response)
    }


- you can test by on your *nix system as

    curl -d 'path=GET%2Fmaterial&userid=5&params={"level":"planinfo","fields":["optsug","planid"]}' http://localhost:8188/request.ajax


- where response is a function return json or string

.


    function response(path, params) {
        return {
            status: 200,
            data: [ ... ]
        };
    }



