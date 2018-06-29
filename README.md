## Leaflet的离线缓存插件

使用本插件，可以对实时浏览的网络切片地图进行本地缓存，在下次浏览时避免重复的网络请求。同时在离线状态下依旧可以进行地图访问。

#### 使用步骤

一、在html引入leaflet的文件和本插件的js文件：

```javascript
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.3.1/dist/leaflet.css" integrity="sha512-Rksm5RenBEKSKFjgI3a41vrjkw4EVPlJ3+OiI65vTjIdo9brlAacEuKOiQ5OFh7cOI1bkDwLqdLw3Zg0cRJAAQ==" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.3.1/dist/leaflet.js" integrity="sha512-/Nsx9X4HebavoBvEBuyp3I7od5tA0UzAxs+j83KgC8PU0kgB4XiK4Lfe4y4cgBtaRJQEIFCW+oC506aPT2L1zw==" crossorigin=""></script>
    <script src="../src/db/dbController.js"></script>
    <script src="../src/offline.js"></script>
```

二、使用本插件的离线图层加载相应的切片

```javascript
    var mymap = L.map('mapid').setView([29.87, 119.51], 10);
    L.indexedDBLayer('http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
        , {
            subdomains:["1", "2", "3", "4"],
            maxZoom: 18,
            minZoom: 5,
            zoomControl: false,
            layerName:"tdt_img"
        }).addTo(mymap);
```

三、**注意：** indexedDBLayer的使用，可以参考`L.tileLayer`,但是`layerName`属性是必须传递的。