<template>
   <MapComp v-bind="props || {}">
   </MapComp>
   <monaco-editor v-if="showPropPanel" :style="entJsonStyle" :wordWrap="false" :lineNumbers="true" v-model="entJson"
    ref="entJsonEditor" style="position: fixed;right: 5px;top: 50px; width: 400px;height: 550px; z-index: 100;"></monaco-editor>
</template>
<script setup lang="ts">
import MapComp from '@/components/MapComp.vue';
import QueryData from '@/views/editor/sidebar/panels/sources/dialogs/QueryData.vue'
import { computed, nextTick, onBeforeMount, provide, reactive, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import MonacoEditor from "@/components/MonacoEditor.vue";
import { useResizeObserver } from '@vueuse/core';
import vjmap from "vjmap"
const { t } = useI18n();
const entJsonEditor = ref()
const entJsonStyle = reactive({ height: '500px' });
const entJson = ref('');
const showPropPanel = ref(false)
useResizeObserver(document.body, (entries) => {
  entJsonStyle.height = (entries[0].contentRect.height - 500) + 'px';
})

provide("editorContext", {});
const route = useRoute();
const openMapParam = {
  mapid: 'sys_zp', // 地图ID,(请确保此ID已存在，可上传新图形新建ID)
  mapopenway: "GeomRender", // 以几何数据渲染方式打开
  version: '',
  workspace: '',
  isVectorStyle: false,
  accessKey: '',
  style: {
    backcolor: 0
  },
};
const serviceUrl = ref();
const accessToken = ref();
const backgroundColor = ref();
onBeforeMount(() => {
    if (route.query?.mapid) {
       openMapParam.mapid = route.query.mapid as string;
     }
     if (route.query?.version) {
       openMapParam.version = route.query.version as string;
     }
     if (route.query?.workspace) {
        openMapParam.workspace = route.query.workspace as string;
     }
     if (route.query?.mapopenway) openMapParam.mapopenway = route.query.mapopenway as any;
     if (route.query?.vector) openMapParam.isVectorStyle = route.query.vector == 'true';
     if (route.query?.theme) {
       openMapParam.style.backcolor = route.query.theme as string == 'light' ? 0xFFFFFF : 0;
     } 
     if (route.query?.accessKey) openMapParam.accessKey = route.query.accessKey as any;
     if (route.query?.serviceUrl) serviceUrl.value = route.query.serviceUrl;
     if (route.query?.accessToken) accessToken.value = route.query.accessToken;
     if (route.query?.backgroundColor) backgroundColor.value = route.query.backgroundColor;
});
const entTypeNames = computed(() => [
    { label: t('queryData.entityType1'), value: "AcDbLine" },
    { label: t('queryData.entityType2'), value: "AcDbPolyline" },
    { label: t('queryData.entityType3'), value: "AcDb2dPolyline" },
    { label: t('queryData.entityType4'), value: "AcDb3dPolyline" },
    { label: t('queryData.entityType5'), value: "AcDbSpline" },
    { label: t('queryData.entityType6'), value: "AcDbArc" },
    { label: t('queryData.entityType7'), value: "AcDbCircle" },
    { label: t('queryData.entityType8'), value: "AcDbEllipse" },
    { label: t('queryData.entityType9'), value: "AcDbCurve" },
    { label: t('queryData.entityType10'), value: "AcDbBlockReference" },
    { label: t('queryData.entityType11'), value: "AcDbHatch" },
    { label: t('queryData.entityType12'), value: "AcDbMText" },
    { label: t('queryData.entityType13'), value: "AcDbText" },
    { label: t('queryData.entityType14'), value: "AcDbShape" },
    { label: t('queryData.entityType15'), value: "AcDbRasterImage" },
    { label: t('queryData.entityType16'), value: "AcDbWipeout" },
    { label: t('queryData.entityType17'), value: "AcDbRotatedDimension" },
    { label: t('queryData.entityType18'), value: "AcDbAngularDimension" },
    { label: t('queryData.entityType19'), value: "AcDbAlignedDimension" },
    { label: t('queryData.entityType20'), value: "AcDbArcDimension" },
    { label: t('queryData.entityType21'), value: "AcDbDiameterDimension" },
    { label: t('queryData.entityType22'), value: "AcDbOrdinateDimension" },
    { label: t('queryData.entityType23'), value: "AcDbRadiusDimension" },
    { label: t('queryData.entityType24'), value: "AcDbRadiusChordDimension" },
    { label: t('queryData.entityType25'), value: "AcDbAngularDimension" },
    { label: t('queryData.entityType26'), value: "AcDbAttributeDefinition" },
    { label: t('queryData.entityType27'), value: "AcDbAttribute" },
    { label: t('queryData.entityTypeTable'), value: "AcDbTable" }
])

const clickHighlightCb = async (e: any, map: any) => {
  if (!e) {
    showPropPanel.value = false
  } else {
    showPropPanel.value = true;
    let geom = e.geom
    delete e.geom;
    let svc = map.getService();
    let layers = svc.getMapLayers();
    let layer = layers.find((layer: any) => layer.index == e.layerindex);
    if (layer) e.layerName = layer.name;
    if (e.color) e.colorRGB = vjmap.entColorToHtmlColor(e.color);
    if (e.name) e.entType = entTypeNames.value.find((ent) => ent.value == e.name)?.label;
    // 坐标数据放最后面了
    e.geom = geom;
    let prop = JSON.stringify(e, null, 2)
    nextTick(() => {
      entJsonEditor.value.setValue(prop);
    });
  }
}
const props = ref({
    mapOpenOptions: openMapParam,
    mapOptions: {
        center: [0, 0],
        zoom: 1,
        bearing: 0,
        pitch: 0
    },
    isLoadImages: false,
    ui: {
        comp: shallowRef(QueryData),
        value: {
        }
    },
    cfg: {
        serviceUrl: serviceUrl,
        serviceToken: accessToken,
        backgroundColor: backgroundColor
    },
    clickHighlightCb: clickHighlightCb
});
</script>