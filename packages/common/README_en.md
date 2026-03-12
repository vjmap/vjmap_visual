# vjcommon

[中文](README.md)

Provides encapsulation of commonly used VJMap functions for sharing across projects.

To use in other projects, go to `packages/common` and run `npm run build`, then include `vjcommon.min.js` in your HTML, or `npm install vjcommon` and `import vjcommon from 'vjcommon'`.

For `monorepo` projects, you can directly reference the source directory.

Source code repository:

[https://github.com/vjmap/vjmap-common](https://github.com/vjmap/vjmap-common)

# Usage

## Installation

 - Include `vjcommon.min.js` in HTML: `https://vjmap.com/demo/js/vjmap/vjcommon.min.js`
 - `npm install vjcommon` then `import vjcommon from 'vjcommon'`

## Examples

### Call Common Functions
Such as drawing, CAD editing, entity selection, etc.

 ```js
 // Select features
 await vjcommon.selectFeatures(map, true, true, false, true);

 // Modify CAD drawing
 await vjcommon.modifyCadEntity(map, draw, updateMapStyleObj);

 // Draw text
 await vjcommon.drawText(map, draw, {}, { text: "vjmap"});
 ```

### Load VJMap Visualization JSON Data to Generate a Map
```js
const config = {
    "mapSources": [
        {
            "id": "geojson_Z7cLnslC",
            "tag": "static",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "id": 1,
                            "properties": {
                                "index": 1
                            },
                            "geometry": {
                                "type": "Point",
                                "coordinates": [
                                    587614231.5210593,
                                    3103881054.3056574
                                ]
                            }
                        },
                        {
                            "type": "Feature",
                            "id": 2,
                            "properties": {
                                "index": 2
                            },
                            "geometry": {
                                "type": "Point",
                                "coordinates": [
                                    587644226.1148031,
                                    3103918228.249017
                                ]
                            }
                        }
                    ]
                }
            },
            "props": {}
        }
    ],
    "mapLayers": [
        {
            "layerId": "marker_qigxhNnv",
            "sourceId": "geojson_Z7cLnslC",
            "memo": "",
            "type": "marker",
            "color": "#3FB1CE"
        }
    ],
    "baseMapType": "",
    "webMapTiles": [],
    "mapOpenOptions": {
        "mapid": "sys_zp",
        "version": "v2",
        "mapopenway": "GeomRender",
        "isVectorStyle": false,
        "style": {
            "backcolor": 0
        }
    },
    "mapOptions": {}
}

let mapApp = new vjcommon.MapApp();
mapApp.mount("map");
await mapApp.setConfig(config);
// Access map object via mapApp.map
```

### Associate with an Existing Map Object to Create Sources and Layers
If you already have a map object, `MapApp` can associate with it via `attachMap`.
```js
let mapApp = new vjcommon.MapApp();
// Associate map object
mapApp.attachMap(map);
// Add data source
await mapApp.addSource({
    "id": "geojson_R6shwTDB",
    "tag": "static",
    "source": {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": 1,
                    "properties": {
                        "index": 1
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            9945.14159398403,
                            8028.257974499531
                        ]
                    }
                },
                {
                    "type": "Feature",
                    "id": 2,
                    "properties": {
                        "index": 2
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            14330.729692594781,
                            8912.481704534506
                        ]
                    }
                }
            ]
        }
    },
    "props": {}
}, true)

// Add layer associated with data source
await mapApp.addLayer({
    "layerId": "marker_NM49tApU",
    "sourceId": "geojson_R6shwTDB",
    "memo": "",
    "type": "marker",
    "color": "#3FB1CE",
    "closeButton": true,
    "closeOnClick": true
})

// Simulate data change
setTimeout(async () => {
    // Update data source, layers will update accordingly
    await mapApp.setSourceData("geojson_R6shwTDB", {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": 1,
                "properties": {
                    "index": 1
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        8629.428315643036,
                        18411.03475111672
                    ]
                }
            }
        ]
    }, true)
}, 5000)
```

# About VJMap

`VJMap` provides a one-stop solution for `custom map format` WebGIS `visualization` development. It supports common formats such as `AutoCAD` `DWG` files, `GeoJSON`, and other common `GIS` file formats. It uses WebGL `vector tiles` and `custom styles` to render interactive maps, and offers `big data visualization` and `real-time streaming data` visualization capabilities. With this product, you can quickly achieve beautiful, smooth map rendering and spatial analysis on browsers and mobile devices, helping you build feature-rich, interactive, and customizable map applications.

# VJMap Features

- Fully compatible with `AutoCAD` `DWG` files, no conversion required
- Advanced rendering: WebGL technology, supports `vector map` rendering, raster/image/video rendering, and 3D model rendering
- Customizable maps: Both server-side and client-side rendering support custom style expressions
- Multiple view modes: Supports 2D and 3D views, vertical view, and 360-degree rotation
- Visual effects: Seamless zoom, particle and flight-path animations, fly-to and pan motion effects
- Full-featured: Supports all common map functions with rich JS APIs
- Interactive controls: Mouse/touch drag for panning, scroll wheel/double-click/pinch for zooming, Shift+drag to zoom to area
- Big data visualization: Excellent performance for large-scale data display
- Cross-platform support (`Windows`, `Linux`); `Docker` deployment; `private` deployment; desktop language development (`C#`, `Java`, `C++`)
- Full support for third-party open-source libraries: [OpenLayers](https://vjmap.com/en/demo/#/demo/map/openlayers/01olraster), [Leaflet](https://vjmap.com/en/demo/#/demo/map/leaflet/01leafletraster), [Maptalks](https://vjmap.com/en/demo/#/demo/map/maptalks/01maptalksraster) to load CAD maps for development
- Supports slicing of image formats such as TIFF, JPG, PNG for instant front-end loading of images over hundreds of MB
