/**
 * @author 杨亚辉
 *
 * Constructor: L.TileLayer.IndexedDBLayer
 * 离线缓存图层类
 *
 * Parameters:
 * url - {String} 对象，即要访问的地图url
 * options - {Object} 一定要包含"layerName"的属性，值自定义，要保证唯一性
 *
 * 示例：
 * (code)
 *      var img=L.indexedDBLayer(
 *          'http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
 *          {
 *              subdomains:["1", "2", "3", "4"],
 *              maxZoom: 22,
 *              zoomControl: false,
 *              layerName:"tdt_img"
 *          }
 *      );
 * (end)
 */

L.TileLayer.IndexedDBLayer=L.TileLayer.extend({
    webtilecache:null,
    dbcontroller:null,

    initialize:function (url,options) {
        /**
         * 初始化indexedDB数据库（连接数据库）
         */
        if(options.hasOwnProperty("layerName")){
            this._initTileDB();
        }

        this._url = url;
        options = L.Util.setOptions(this, options);
        if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {
            options.tileSize = Math.floor(options.tileSize / 2);

            if (!options.zoomReverse) {
                options.zoomOffset++;
                options.maxZoom--;
            } else {
                options.zoomOffset--;
                options.minZoom++;
            }

            options.minZoom = Math.max(0, options.minZoom);
        }

        if (typeof options.subdomains === 'string') {
            options.subdomains = options.subdomains.split('');
        }

        if (!L.Browser.android) {
            this.on('tileunload', this._onTileRemove);
        }
    },

    /**
     * 用来初始化数据库
     * 错误情况：
     *  * 浏览器不支持indexeDB数据库，
     *  * 初始化对象存储空间失败
     * 成功情况：
     *  * 初始化对象存储空间成功，讲webtilecache实例传递给wtc;
     *
     */
    _initTileDB:function () {
        var temp=new L.Db.Controller();

        if(!temp.isSupported()){
            alert("浏览器不支持indexedDB数据库");
            temp=null;
            this.dbcontroller=null;
        }else{
            var success_create=function (res) {
                this.dbcontroller=temp;
            };
            var error_create=function (errorStr) {
                alert("数据库创建/连接失败");
                temp=null;
                this.dbcontroller=null;
            };
            temp.initTileDB({
                version:1.0,
                totalLevels:this.options.maxZoom,
                dbname:"MapTileCache"
            },success_create,error_create);
        }

    },

    createTile:function (coords,done) {
        var tile = document.createElement('img');

        L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
        L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

        if (this.options.crossOrigin) {
            tile.crossOrigin = '';
        }

        tile.alt = '';

        tile.setAttribute('role', 'presentation');

        //新添加
        //tile.src = this.getTileUrl(coords);
        this.getTileUrl(coords).then(function (url) {
            tile.src = url;
        });

        return tile;
    },

    getTileUrl:function (coords) {
        //获取行列号
        var row=coords.y;
        var col=coords.x;
        // var zoom = this._tileZoom,
        //     maxZoom = this.options.maxZoom,
        //     zoomReverse = this.options.zoomReverse,
        //     zoomOffset = this.options.zoomOffset;
        //
        // if (zoomReverse) {
        //     zoom = maxZoom - zoom;
        // }
        // var level=zoom + zoomOffset;

        var level=coords.z;
        var layerName=this.options.layerName?this.options.layerName:'';

        var url = L.TileLayer.prototype.getTileUrl.call(this, coords);
        return new Promise(
            function (resolve,reject) {
                if(this.dbcontroller!=null){
                    //存在，则转为ｕｒｌ返回
                    var success_query=function (res) {
                        resolve(URL.createObjectURL(res));
                    };
                    //不存在，则请求网络，并且保存
                    var error_query=function (err) {
                        this.dbcontroller.insertFromURL(col,row,level,url,layerName);
                        resolve(url);
                    };
                    this.dbcontroller.queryTile(col,row,level,layerName,success_query,error_query);
                }else{
                    resolve(url);
                }
            }
        );
    },

    /**
     * APIMethod: clearDB
     * 清空indexedDB中缓存的数据，会清空所有图层缓存的数据
     */
    clearDB:function () {
        if(this.dbcontroller==null){
            var temp=new L.Db.Controller();
            if(!temp.isSupported()){
                temp=null;
            }else{
                var success_create=function (res) {
                    temp.clearTileDB();
                };
                var error_create=function (errorStr) {
                    temp=null;
                };
                temp.createTileDB({
                    version:1.0,
                    totalLevels:this.options.maxZoom,
                    dbname:"MapTileCache"
                },success_create,error_create);
            }
        }else{
            this.dbcontroller.clearTileDB();
        }
    },

    /**
     * 删除数据库
     */
    deleteDB:function(){
        var $this=this;
        if(this.dbcontroller==null){
            var temp=new L.Db.Controller();
            if(!temp.isSupported()){
                temp=null;
            }else{
                var success_create=function (res) {
                    temp.deleteTileDB(function (event) {
                        temp=null;
                        $this.dbcontroller=null;
                    });
                };
                var error_create=function (errorStr) {
                    temp=null;
                };
                temp.createTileDB({
                    version:1.0,
                    totalLevels:this.options.maxZoom,
                    dbname:"MapTileCache"
                },success_create,error_create);
            }
        }else{
            this.dbcontroller.deleteTileDB();
            this.dbcontroller=null;
        }
    }
});


L.indexedDBLayer = function (url,options) {
    return new L.TileLayer.IndexedDBLayer(url, options);
};






