<template>
    <n-space vertical>
        <n-space class="buttons">
            <n-button size="small" :type="button.type ?? 'primary'" ghost v-for="button in buttons" :key="button.title"
                @click="button.click">
                {{ button.title }}
            </n-button>
        </n-space>
        <n-input v-model:value="sourceId" :placeholder="t('sources.sourceIdPlaceholder')" size="small" :disabled="id != ''">
            <template #prefix>
                {{ t('sources.sourceIdLabel') }}
            </template>
        </n-input>
        <monaco-editor :style="editorStyle" v-model="json" ref="mapJsonEditor"
            @change="editorJsonChange"></monaco-editor>
        {{ t('sources.attrSettings') }}
        <monaco-editor style="height:100px" v-model="jsonsetting" ref="setJsonEditor"
            :readOnly="id != ''"></monaco-editor>
        <n-modal v-model:show="showMapModel" preset="dialog" :title="t('sources.viewMap')" :style="{ width: '850px' }">
            <MapDataPreview :data="mapGeoJsonData" />
        </n-modal>
    </n-space>
</template>

<script setup lang="ts">
import MonacoEditor from "@/components/MonacoEditor.vue";
import type { editorContext } from '@/types';
import { useResizeObserver } from '@vueuse/core';
import { inject, reactive, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { i18n } from '@/i18n';
import vjmap from 'vjmap';
import RandomGeojsonDlg from './dialogs/RandomGeojsonDlg.vue';
import MapComp from '@/components/MapComp.vue'
import type MapApp from '~/MapApp';
import { getMapSnapPoints } from '@vjmap/common';
import { selectFeatures } from '@vjmap/common';
import { ButtonControl } from '@/lib/map/buttonCtrl';
import MapDataPreview from './dialogs/MapDataPreview.vue';

const { t } = useI18n();
const gt = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params);
const { mapApp, uiApp } = inject<editorContext>('editorContext') as editorContext;
const mapJsonEditor = ref<any>(null);
const setJsonEditor = ref<any>(null);
const editorStyle = reactive({ height: '300px' });
const showMapModel = ref(false);
const mapGeoJsonData = ref({});
const isWebBaseMap = ref(mapApp.isWebBaseMap());
useResizeObserver(document.body, (entries) => {
    editorStyle.height = (entries[0].contentRect.height - 350) + 'px';
})
const props = defineProps({
    data: {
        type: Object,
        required: false,
        default: () => {
            return {
            }
        }
    },
    prop: {
        type: Object,
        required: false,
        default: () => {
            return {
            }
        }
    },
    id: {
        type: String,
        required: false,
        default: ''
    }
});


const sourceId = ref(props.id);
const json = ref(JSON.stringify(props.data, null, 4));
const jsonsetting = ref(JSON.stringify(props.prop, null, 4));
const buttons = ref([{
    title: t('sources.randomData'),
    type: "primary",
    click: () => {
        createRandomGeojson();
    }
}]);

if (!isWebBaseMap.value) {
    buttons.value.push(
        {
            title: t('sources.pickPointLinePolygon'),
            type: "primary",
            click: () => {
                pickPointLinePolygons();
            }
        }, {
        title: t('sources.pickEntityByPosition'),
        type: "primary",
        click: () => {
            pickFeatures(false)
        }
    }, {
        title: t('sources.pickEntityByGeom'),
        type: "primary",
        click: () => {
            pickFeatures(true)
        }
    })
}
buttons.value.push({
    title: t('sources.viewDataOnMap'),
    type: "info",
    click: () => {
        showMapModel.value = true;
    }
});
buttons.value.push({
    title: t('sources.viewDataBounds'),
    type: "info",
    click: () => {
        const value = mapJsonEditor?.value?.getValue();
        try {
            const features = JSON.parse(value);
            let bounds = vjmap.getGeoBounds(features);
            console.log("数据范围", `[${bounds.toString()}]`);
            console.log("数据正方形范围", `[${bounds.square().toString()}]`);
            console.log("数据两倍范围", `[${bounds.scale(2).toString()}]`);
            console.log("数据两倍正方形范围", `[${bounds.scale(2).square().toString()}]`);
            let tip = `
            "数据范围": [${bounds.toString()}]
            "数据正方形范围": [${bounds.square().toString()}]
            "数据两倍范围": [${bounds.scale(2).toString()}]
            "数据两倍正方形范围": [${bounds.scale(2).square().toString()}]
            ${t('sources.dataBoundsTip')}
            `
            window.$message.info(tip)
        } catch(e: any) {
            window.$message.error(e)
        }
    }
});
const createRandomGeojson = async () => {
    uiApp.showFloatChildPane("createRandomGeojson", t('sources.randomGeojsonTitle'), {
        component: shallowRef(RandomGeojsonDlg),
        props: {
            hideCloseButton: true,
            showOkButton: true,
            showCancelButton: true,
        },
        listeners: {
            onOK: (comp: any) => {
                let { FeatureCollection } = comp.getResult();
                if (!FeatureCollection) return;
                let value = JSON.stringify(FeatureCollection, null, 4);
                mapJsonEditor?.value?.setValue(value);
            }
        }
    })
}
const pickPointLinePolygons = async () => {
    let res = await uiApp.showModalAsync("pickPointLinePolygons", t('sources.pickPointLinePolygonPrompt'), {
        component: MapComp,
        props: {
            positiveText: t('common.confirm'),
            negativeText: t('common.cancel'),
            bodyStyle: {
                position: 'fixed',
                left: '0px',
                top: '0px',
                right: '0px',
                bottom: '0px',
                width: "100%",
                height: "100%",
            },
            mapOptions: {
                center: [0, 0],
                zoom: 1,
                bearing: 0,
                pitch: 0
            },
            mapOpenOptions: {
                style: {
                    backcolor: mapApp.getConfig().mapOpenOptions?.style?.backcolor ?? 0
                }
            },
            methods: {
                onMounted: async (mApp: MapApp, close: Function, context: any) => {
                    let map = mApp.map;

                    const opts = vjmap.cloneDeep(vjmap.Draw.defaultOptions());
                    // https://vjmap.com/guide/draw.html
                    // 可以隐藏默认的按钮
                    opts.controls.cutPolygon = false;//不显示裁剪多边形
                    opts.controls.splitLine = false;
                    opts.controls.combine_features = false;
                    opts.controls.uncombine_features = false;

                    let snapObj = {};
                    if (!mApp.isWebBaseMap()) {
                      // 如果是为cad为底图，则可以捕捉dwg图上的点
                      getMapSnapPoints(map, snapObj);
                    }
                   
                    // @ts-ignore
                    const draw = new vjmap.Draw.Tool({
                        ...opts,
                        api: {
                            getSnapFeatures: snapObj //要捕捉的数据项在后面，通过属性features赋值
                        }
                    });
                    map.addControl(draw, 'top-left');
                    // 增加之前的数据
                    let geojson = mapJsonEditor?.value?.getValue();
                    if (geojson && geojson != "{}") {
                        geojson = JSON.parse(geojson);
                        draw.set(map.toLngLat(geojson));
                    }
                    // @ts-ignore
                    map._curDraw = draw;
                },
                getResult: (mApp: MapApp, close: Function, context: any) => {
                    let map = mApp.map;
                    // @ts-ignore
                    if (!map._curDraw) return;
                    // @ts-ignore
                    return map.fromLngLat(map._curDraw.getAll());
                }
            }

        }
    })
    if (res.isOk) {
        let value = JSON.stringify(res.result, null, 4);
        mapJsonEditor?.value?.setValue(value);
    }
}
const pickFeatures = async (useGeomCoord?: boolean) => {
    let res = await uiApp.showModalAsync("pickFeatures", t('sources.pickFeaturesPrompt'), {
        component: MapComp,
        props: {
            positiveText: t('common.confirm'),
            negativeText: t('common.cancel'),
            bodyStyle: {
                position: 'fixed',
                left: '0px',
                top: '0px',
                right: '0px',
                bottom: '0px',
                width: "100%",
                height: "100%",
            },
            mapOptions: {
                center: [0, 0],
                zoom: 1,
                bearing: 0,
                pitch: 0
            },
            mapOpenOptions: {
                style: {
                    backcolor: mapApp.getConfig().mapOpenOptions?.style?.backcolor ?? 0
                }
            },
            methods: {
                onMounted: async (mApp: MapApp, close: Function, context: any) => {
                    let map = mApp.map;
                    let pointSelButtonCtrl = new ButtonControl({
                        text: gt('sources.switchToPointSel'),
                        onClick: () => {
                            // @ts-ignore
                            map._isPointSel = true;
                        }
                    });
                    map.addControl(pointSelButtonCtrl);
                    let rectSelButtonCtrl = new ButtonControl({
                        text: gt('sources.switchToRectSel'),
                        onClick: () => {
                            // @ts-ignore
                            map._isPointSel = false;
                        }
                    });
                    map.addControl(rectSelButtonCtrl);
                    let checkboxCtrl1 = new ButtonControl({
                        type: "checkbox",
                        text: gt('sources.noAttrData'),
                        onClick: () => {
                            // @ts-ignore
                            map._noNeedPropsData = !map._noNeedPropsData;
                        }
                    });
                    map.addControl(checkboxCtrl1);
                    let checkboxCtrl2 = new ButtonControl({
                        type: "checkbox",
                        text: gt('sources.wholeEntity'),
                        onClick: () => {
                            // @ts-ignore
                            map._includeWholeEntity = !map._includeWholeEntity;
                        }
                    });
                    map.addControl(checkboxCtrl2);
                    // @ts-ignore
                    selectFeatures(map, useGeomCoord, map._includeWholeEntity);
                },
                onUnmounted(mApp: MapApp) {
                    let map = mApp.map;
                    map.fire("keyup", { keyCode: 27 });
                },
                getResult: (mApp: MapApp, close: Function, context: any) => {
                    let map = mApp.map;
                    // 给地图发送Enter键消息即可取消，模拟按Enter键
                    map.fire("keyup", { keyCode: 13 });
                    // @ts-ignore
                    let features = map._selectFeatures ?? [];
                    // @ts-ignore
                    if (map._noNeedPropsData) {
                        // 如果不需要属性数据
                        features.forEach((f: any) => f.properties = {})
                    }
                    // @ts-ignore
                    return map.fromLngLat({
                        "type": "FeatureCollection",
                        "features": features
                    });
                }
            }

        }
    })
    if (res.isOk) {
        let value = JSON.stringify(res.result, null, 4);
        mapJsonEditor?.value?.setValue(value);
    }
}

const editorJsonChange = () => {
    try {
        mapGeoJsonData.value = JSON.parse(mapJsonEditor?.value?.getValue());
    } catch (e) { /* empty */ }
}
const getResult = () => {
    return {
        data: mapJsonEditor?.value?.getValue(),
        id: sourceId.value.trim(),
        prop: setJsonEditor?.value?.getValue(),
    }
}
// 如果对话框要返回值，则必须导出此方法
defineExpose({
    getResult
})
</script>