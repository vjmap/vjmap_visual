export const mapSourceOptions = [
  { labelKey: 'sources.typeGeoJsonStatic', key: "geojson_static" },
  { labelKey: 'sources.typeGeoJsonQuery', key: "geojson_query" },
  { labelKey: 'sources.typeGeoJsonDraw', key: "geojson_draw" },
  { labelKey: 'sources.typeGeoJsonChange', key: "geojson_change" },
  { labelKey: 'sources.typeWms', key: "wms" },
  { labelKey: 'sources.typeRasterTile', key: "raster" },
  { labelKey: 'sources.typeVectorTile', key: "vector" },
  { labelKey: 'sources.typeImage', key: "image" },
  { labelKey: 'sources.typeVideo', key: "video" },
]

/** Map tag value (Chinese) to i18n key for display */
export const tagToLabelKey: Record<string, string> = {
  'geojson静态': 'sources.tagGeoJsonStatic',
  'geojson动态': 'sources.tagGeoJsonChange',
  'geojson绘制': 'sources.tagGeoJsonDraw',
  'geojson查询': 'sources.tagGeoJsonQuery',
  'WMS栅格': 'sources.tagWmsRaster',
  'WMS矢量': 'sources.tagWmsVector',
  '栅格瓦片': 'sources.tagRasterTile',
  '矢量瓦片': 'sources.tagVectorTile',
  '图像': 'sources.tagImage',
  '视频': 'sources.tagVideo',
}

export const sourceTags: any = {
    "geojson": 'geojson',
    "geojson_static": 'geojson静态',
    "geojson_change": 'geojson动态',
    "geojson_draw": 'geojson绘制',
    "geojson_query": 'geojson查询',
    "raster_wms": 'WMS栅格',
    "vector_wms": 'WMS矢量',
    "raster_raster": '栅格瓦片',
    "vector_vector": '矢量瓦片',
    "image_image": '图像',
    "video_video": '视频'
  }

export const soutceTagTypes: any = {
    "geojson": 'success',
    "raster": 'warning',
    "vector": 'error',
    "image": 'info',
    "video": 'default'
}