/**
 * 沙箱mock数据
 * @author  liuliandong (liu@liandong.org)
 */

var vm = require('vm');
var fs = require('fs');
var path = require('path');

// 沙箱程序路径
exports.sourceDir = './AO-Debug/response';

//等待实现
exports.runphp = function(code, path, param) {

};

/**
 * 在沙箱运行JS模拟程序
 * 防止挂掉服务器，更安全，即时生效，不需要重启服务器
 * @param  {String} code  代码内容
 * @param  {String} path  请求path
 * @param  {Object} param Post请求参数
 * @return {Object}       沙箱程序运行的输出结果
 */
exports.runJS = function(code, path, param) {
    var msgCache = [];

    function print(args) {
        var args = arguments;
        for (var i = 0; i < args.length; i++) {
            msgCache.push(args[i]);
        }
    }

    function dump(object) {
        msgCache.push(object);
    }

    var context = {
        param: param,
        path: path,
        console: {
            log: dump,
            dump: dump
        }
    };
    vm.runInNewContext(code, context);

    return (msgCache.length == 1) ? msgCache[0]: msgCache;
};


/**
 * 支持重写该方法
 * @param  {String} pathName 请求path
 * @param  {Object} param 请求POST参数
 * @return {Buffer/String}   返回数据
 */
exports.getContent = function(pathName, param) {
    var content = '';
    var fileName = pathName.replace(/\//g, '_') + '.js';
    var filePath = path.join( exports.sourceDir, fileName);
    if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath);
    }
    return content;
};

/**
 * 打包结果
 * 修改输出格式，或者修改结果
 * @param  {Object} data 输出结果
 * @return {Object} 
 */
exports.pack = function(data) {
    var rst = {
        "status": 200,
        "data": data,
        "error": {}
    }
    return rst;
};

/**
 * 获得结果- 数据入口
 * @param  {String} pathName 请求路径
 * @param  {Object} param    请求参数
 * @return {Object}          要输出的结果
 */
exports.getResult = function(pathName, param) {
    var content = exports.getContent(pathName);
    var result = exports.runJS(content, pathName, param);

    if (exports.pack) {
        result = exports.pack(result);
    }
    return  result;
};