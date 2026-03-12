# VJMap Visualization Project

[中文](README.md)

The VJMap Visualization Platform aims to provide an intuitive and easy-to-use map display interface, offering users a simple, efficient, and precise CAD map Web visualization solution, building a low-code platform for CAD-based WebGIS.

Online preview: https://vjmap.com/app/visual/#/?lang=en

This project is based on secondary development of [VJMap](https://vjmap.com/en/). Unauthorized commercial use is prohibited (except for licensed private deployment of VJMap).

# Getting Started

```
yarn
yarn dev
```

# Directory Structure

- packages/common

  Common library

  Provides encapsulation of commonly used VJMap functions for sharing across projects.

  To use in other projects, go to `packages/common` and run `npm run build`, then include `vjcommon.min.js` in your HTML, or `npm install vjcommon` and `import vjcommon from 'vjcommon'`.

  This package cannot run standalone; it is intended for code sharing across projects.

  To update the `vjmap` library, go to this directory and run:

  ```
  yarn add vjmap
  ```

- packages/editor

  VJMap Visualization Platform

  Implements map visualization editing functionality.

# Recommended VSCode Extensions

- Volar

# About VJMap

`VJMap` provides a one-stop solution for `CAD` drawings or `custom map format` WebGIS `visualization` development. It supports common formats such as `AutoCAD` `DWG` files, `GeoJSON`, and other common `GIS` file formats. It uses WebGL `vector tiles` and `custom styles` to render interactive maps, and offers `big data visualization` and `real-time streaming data` visualization capabilities. With this product, you can quickly achieve beautiful, smooth map rendering and spatial analysis on browsers and mobile devices, helping you build feature-rich, interactive, and customizable map applications.

[VJMap](https://vjmap.com/en/) official website: https://vjmap.com/en/

# VJMap Features

- Fully compatible with `AutoCAD` `DWG` files, no conversion required
- Advanced rendering: WebGL technology, supports `vector map` rendering, raster/image/video rendering, and 3D model rendering
- Customizable maps: Both server-side and client-side rendering support custom style expressions
- Multiple view modes: Supports 2D and 3D views, vertical view, and 360-degree rotation
- Visual effects: Seamless zoom, particle and flight-path animations, fly-to and pan motion effects
- Full-featured: Supports all common map functions with rich JS APIs
- Interactive controls: Mouse/touch drag for panning, scroll wheel/double-click/pinch for zooming, Shift+drag to zoom to area
- Big data visualization: Excellent performance for large-scale data display
- Export to `Autodesk Forge` f2d format for development within the Forge ecosystem, with offline deployment support. [Example](/en/guide/forgeviewer.html)
- Cross-platform support (`Windows`, `Linux`); `Docker` deployment; `private` deployment; desktop language development (`C#`, `Java`, `C++`)

# VJMap Quick Start

## Open a Map via Service

Use the `openMap` method of the `Service` object to open an existing map on the server, or pass an `http` URL or local server path via `fileid` to open a `DWG` format `CAD drawing`.

```js
// Create a map service object with service URL and token
let svc = new vjmap.Service(env.serviceUrl, env.accessToken);
// Open a map
let res = await svc.openMap({
  mapid: "sys_world", // Map ID (the name given when uploading the drawing)
  mapopenway: vjmap.MapOpenWay.GeomRender, // Open with geometry data rendering
  style: vjmap.openMapDarkStyle(), // Server rendering style
});
if (res.error) {
  message.error(res.error);
}
```

## Create a Map Object

Use the `geographic bounds` returned from opening the map to establish a `coordinate system`, then create the `map object`.

```js
// Create a geographic projection based on map bounds
let prj = new vjmap.GeoProjection(res.bounds);

// Map object
let map = new vjmap.Map({
  container: "map", // DIV container ID
  style: svc.vectorStyle(), // Style, using vector tile style
  center: prj.toLngLat(prj.getMapExtent().center()), // Set map center
  zoom: 2, // Set zoom level
  pitch: 60, // Tilt angle
  renderWorldCopies: false, // Disable multi-world map display
});

// Bind service and projection objects
map.attach(svc, prj);
```

## Map Interaction

When the mouse hovers over an entity on the map and you need highlight or click inspection, use `enableVectorLayerHoverHighlight` in `vector tile` mode, or `enableLayerClickHighlight` in `raster tile` mode.

```js
// Get all layers
const layers = svc.getMapLayers();
// Entity type ID to name mapping
const { entTypeIdMap } = await svc.getConstData();

// Enable hover highlight (entities highlight when mouse hovers over them)
map.enableVectorLayerHoverHighlight((event, feature, layer) => {
  // Callback for clicking a highlighted entity
  const prop = feature.properties;
  let content = `event: ${event}; feature: ${feature.id}; layer: ${
    layers[prop.layer].name
  }; type: ${entTypeIdMap[prop.type]}`;
  message.info({ content, key: "info", duration: 5 });
});
```

## Add Overlays or Other Layers

The map provides the ability to draw overlays such as point markers, text labels, polylines, circles, polygons, rectangles, etc. You can customize properties like title, icon for markers, color and width for polylines, and fill color, border color, width, and more for polygon shapes (circles, polygons, rectangles).

Add a marker overlay:

```js
const mapBounds = map.getGeoBounds(0.6); // Get map geographic bounds with scale factor
let position = mapBounds.randomPoint(); // Generate a random point within bounds
let latLng = map.toLngLat(position); // Convert geographic coordinates to lng/lat
let marker = new vjmap.Marker(); // Create a new Marker
marker.setLngLat(latLng).addTo(map); // Set coordinates and add to map
```

Create multiple square extrusion layers:

```js
let lengthMin = mapBounds.width() / 200; // Min side length for random squares
let lengthMax = mapBounds.width() / 100; // Max side length for random squares
let geoDatas = []; // Data array
for (let i = 0; i < 100; i++) {
  const pts = [];
  const len = vjmap.randInt(lengthMin, lengthMax); // Random length between range
  const p1 = mapBounds.randomPoint(); // Random point as bottom-right corner
  const p2 = vjmap.geoPoint([p1.x, p1.y + len]);
  const p3 = vjmap.geoPoint([p1.x + len, p1.y + len]);
  const p4 = vjmap.geoPoint([p1.x + len, p1.y]);
  pts.push(p1, p2, p3, p4); // Four corners of the square
  geoDatas.push({
    points: map.toLngLat(pts), // Convert geographic coordinates to lng/lat for drawing
    properties: {
      name: "square" + (i + 1),
      color: vjmap.randomColor(),
      type: "square",
      baseHeight: 0,
      height: prj.toMeter(vjmap.randInt(lengthMin * 10, lengthMax * 10)), // Random height based on 10x the min/max length
    },
  });
}

// Create fill extrusion layer
let fillExtrusions = new vjmap.FillExtrusion({
  data: geoDatas, // Data
  // Red when hovered, otherwise use the 'color' property
  fillExtrusionColor: [
    "case",
    ["to-boolean", ["feature-state", "hover"]],
    "red",
    ["get", "color"],
  ],
  fillExtrusionOpacity: 0.8, // Opacity
  fillExtrusionHeight: ["get", "height"], // Height value
  fillExtrusionBase: ["get", "baseHeight"], // Base height, change for floating effect
  isHoverPointer: true, // Change cursor on hover
  isHoverFeatureState: true, // Change feature state on hover for highlight effect
});
fillExtrusions.addTo(map); // Add to map
// Click event
fillExtrusions.clickLayer((e) =>
  message.info(
    `You clicked item ${e.features[0].id}, name: ${e.features[0].properties.name}, color: ${e.features[0].properties.color}, type: ${e.features[0].properties.type}`
  )
);
// Hover popup
fillExtrusions.hoverPopup(
  (f) => `<h3>ID: ${f.properties.name}</h3>Color: ${f.properties.color}`,
  { anchor: "bottom" }
);
```

Result:

![image-20211015195337555](https://vjmap.com/blogimages/image-20211015195337555.png)

[Demo](https://vjmap.com/en/demo/#/demo/map/overlay/fillextrusion/fillextrusion) https://vjmap.com/en/demo/#/demo/map/overlay/fillextrusion/fillextrusion

[VJMap Documentation](https://vjmap.com/en/) https://vjmap.com/en/
