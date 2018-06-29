/**
 * @author 杨亚辉
 */
L.Db=L.Db || {};
L.Db.Controller=function(){
    var thisObj=this;
    var indexedDB = window.indexedDB || window.msIndexedDB || window.mozIndexedDB || window.webkitIndexedDB;
    // 统一事务
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    // 始终维持一个database
    var database;
    // 用来构建对数据库图片的索引
    //var URL = window.URL || window.webkitURL;
    // 内部 常调用的变量
    var _request,_transaction,_index;

    thisObj.options={
        // 数据库版本号
        version:1.0,
        // 对象存储空间的级数
        totalLevels:20,
        // 数据库默认名称
        dbname:"MapTileCache"
    };


    this.isSupported=function(){
        return indexedDB ? true:false;
    };

    /**
     * 初始化数据库
     * 如果数据库已经创建，则连接数据库；否则创建数据库并创建数据表
     * @param opts             数据库的可选项
     * @param successHandler   初始化成功时的回调函数
     * @param errorHandler     初始化失败时的回调函数
     */
    this.initTileDB=function (opts,successHandler,errorHandler) {
        if(database){//数据库已经在使用
            errorHandler("初始化据库失败！");
        }else{
            _request = indexedDB.open(thisObj.options.dbname,thisObj.options.version);
            _request.onsuccess = function(event){
                database = event.target.result;
                //当数据库有版本更新时，关闭这个数据库
                database.onversionchange=function(event){
                    database.close();
                };
                successHandler(database);
            };
            // 创建数据库失败
            _request.onerror=function(){
                errorHandler("初始化切片对象存储空间失败！");
            };

            // 执行数据库对象存储空间的创建工作
            _request.onupgradeneeded=function(event){
                // 连接成功则建对象存储空间（表）
                database = event.target.result;
                thisObj._createTables(database);
            };
        }
    };

    /**
     * 将某切片插入到数据库中
     * @param col      列
     * @param row      行
     * @param level    级别
     * @param tile     切片数据
     * @param urlKeyWord 切片关键字
     */
    this.insertTile=function (col,row,level,tile,urlKeyWord) {
        var objName=level>15?String(level):"0-15";
        if((typeof (database))=="undefined"){
            alert("database未实例化");
        }
        // 获取读写模式下的事务，此种模式不仅可以读，还可以写
        _transaction=database.transaction(objName,"readwrite");
        var temp={
            'tileId':urlKeyWord+"_"+level+"_"+col+"_"+row,
            'col':col,
            'row':row,
            'level':level,
            'tile':tile
        };
        _request = _transaction.objectStore(objName).add(temp);
        _request.onsuccess = function(event){
            //successHandler(event.target.result);
        };
        // 插入切片失败
        _request.onerror=function(){
            //errorHandler("要插入的对象已存在！");
        };
    };

    this.deleteTile=function () {

    };

    /**
     * 根据显示级别、行、列、关键字来查询某切片
     * @param col
     * @param row
     * @param level
     * @param urlKeyWord
     * @param successHandler
     * @param errorHandler
     */
    this.queryTile=function (col,row,level,urlKeyWord,successHandler,errorHandler) {
        // 构造表名
        var objName=level>15?String(level):"0-15";
        // 获取索引
        _index=database.transaction(objName).objectStore(objName).index("tileId");
        // 通过索引获取数据
        _request=_index.get(urlKeyWord+"_"+level+"_"+col+"_"+row);
        _request.onerror = function(event){
            errorHandler("[L.Db.Controller]-query查詢失敗");
        };
        _request.onsuccess = function(event){
            if(typeof (event.target.result)!="undefined"){
                successHandler(event.target.result.tile);
            }else{
                errorHandler("数据库中不存在该数据");
            };
        };
    };

    /**
     * 删除该数据库
     */
    this.deleteTileDB=function () {
        database.close();
        _request = indexedDB.deleteDatabase(database.name);
        _request.onsuccess = function(event){
            //console.log("【删除数据库成功】");
            callback(event);
        };
        // 删除数据库失败
        _request.onerror=function(event){
            callback(event);
        };
    };

    /**
     * 清空该数据库中的数据
     * @returns {number}
     */
    this.clearTileDB=function () {
        var lObj='';
        for(var i=15;i<=thisObj.options.totalLevels;i++){
            if(i==15){
                lObj="0-15"
            }else{
                lObj=i;
            }
            if(database.objectStoreNames.contains(String(lObj))){
                database.transaction(lObj,"readwrite").objectStore(lObj).clear().onsuccess=function (event) {
                    //console.log("清空数据库。。。");
                };
            }
        }
        return 1;
    };

    this._createTables=function(database){
        var objectStore;
        for(var i=0;i<=thisObj.options.totalLevels;i++){
            if(i<=15){
                if(!database.objectStoreNames.contains("0-15")){
                    // 主键设为tileId
                    objectStore=database.createObjectStore("0-15",{keyPath: "tileId"});
                    // 建立索引
                    objectStore.createIndex("tileId" , "tileId" , { unique: true });
                }
            }else{
                if(!database.objectStoreNames.contains(String(i))){
                    // 主键设为tileId
                    objectStore=database.createObjectStore(String(i),{keyPath: "tileId"});
                    // 建立索引
                    objectStore.createIndex("tileId" , "tileId" , { unique: true });
                }
            }
        }
    };

    this.insertFromURL=function (col,row,level,imgurl,urlKeyWord) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", imgurl, true);
        // Set the responseType to blob
        xhr.responseType = "blob";
        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                thisObj.insertTile(col,row,level,xhr.response,urlKeyWord);
            }else{
                //errorHandler('[takeUrlToIndexedDB] 從網絡获取网络图片失败');
            }
        }, false);
        // Send XHR
        xhr.send();
    }
}