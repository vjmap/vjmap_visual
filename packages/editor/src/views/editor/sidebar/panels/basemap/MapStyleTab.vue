<template>
    <n-space vertical>
        <n-scrollbar :style="scrollStyle">
            <n-card size="small"  v-if="!baseMapType || baseMapType == 'CAD'">
                <FormCreate v-model="fApi" ref="form" :rule="rule" :option="option" @change="onChange"></FormCreate>
                <n-space>
                    <!-- <n-dropdown trigger="hover" :options="themeOptions" @select="handleThemeSelect">
                        <n-button>{{ t('basemap.commonExpressions') }}</n-button>
                    </n-dropdown> -->
                </n-space>
            </n-card>
            <n-empty v-else :description="t('basemap.webMapNoStyle')">
            </n-empty>
        </n-scrollbar>
        <n-button v-if="!!ctxMapApp" @click="onOK">{{ t('common.confirm') }}</n-button>
    </n-space>
</template>

<script setup lang="ts">
import type { editorContext } from "@/types";
import formCreate from "@form-create/naive-ui"
import { useDebounceFn } from '@vueuse/core';
import { inject, reactive, ref, shallowRef, toRaw, computed } from "vue";
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
import { toString } from '@/lib/utils'
import MapComp from '@/components/MapComp.vue'
import vjmap, { type IMapLayer, type IMapStyleParam } from "vjmap";
import { Settings } from '@vicons/ionicons5'
import { useResizeObserver } from '@vueuse/core'
import SelectLayer from './SelectLayer.vue'
import { pickMapBounds } from "@/lib/map/pick";
const emit = defineEmits(["onClose"]);
const props = defineProps({
    ctxMapApp: {
        type: Object,
        required: false
    }
})
let { mapApp, uiApp } = inject<editorContext>('editorContext') as editorContext;
if (props.ctxMapApp) {
    // @ts-ignore
    // eslint-disable-next-line vue/no-setup-props-destructure
    mapApp = props.ctxMapApp;
    // @ts-ignore
    uiApp = null;
}
const baseMapType = ref(mapApp?.getConfig().baseMapType);
const scrollStyle = reactive({ maxHeight: '500px' });
useResizeObserver(document.body, (entries) => {
    scrollStyle.maxHeight = (entries[0].contentRect.height - 150) + 'px';
})

const FormCreate = formCreate.$form();

const form = ref<any>(null);
let fApi = reactive<any>({});
const mapConfig = mapApp?.getConfig();
const mapStyle: IMapStyleParam = mapConfig?.mapOpenOptions?.style || {};
const option = reactive({
    form: {
        labelWidth: "auto",
        size: 'small',
        labelPlacement: 'top',
    },
    submitBtn: false
});

const themeOptions = computed(() => [
    { label: t('basemap.themeTech'), key: "tech" },
    { label: t('basemap.themeGray'), key: 'gray' },
    { label: t('basemap.themeDefault'), key: 'default' },
    { label: t('basemap.themeMore'), key: 'moretheme' },
    { label: t('basemap.themeMoreExpr'), key: 'moreexpr' },
])
const convertLayeron = (layeron?: string | number[]) => {
    if (!layeron) return [{ zoom: '', layers: '' }];
    if (Array.isArray(layeron)) {
        return [{ zoom: '', layers: layeron.join(',') }];
    } else {
        let layer = JSON.parse(layeron);
        let keys = Object.keys(layer).sort((a: any, b: any) => a.localeCompare(b));
        return keys.map((k: string) => {
            return {
                zoom: k,
                layers: layer[k]
            }
        })
    }
}
const convertLineweight = (lineweight?: string | number[]) => {
    if (typeof lineweight == 'string') {
        lineweight = lineweight.replace('(', '').replace(')', '').replace('[', '').replace(']', '').split(",").map((e: any) => +e);
    }
    lineweight = lineweight || [];
    if (lineweight.length == 0) return [{ zoom: '', lineweight: '' }];
    return lineweight.map((e: number, i: number) => {
        return { zoom: (i + 1) + '', lineweight: e + '' }
    })
}
const backgroundColor = ref(mapConfig?.backgroundColor ?? '#022b4f');
const lightTheme = ref(mapStyle.backcolor != 0);
const rule = computed(() => [
    {
        type: 'input',
        field: 'name',
        title: t('basemap.styleName'),
        value: mapStyle.name,
        props: {
            placeholder: '',
        }
    },
    {
        type: "ColorPicker",
        field: "backgroundColor",
        title: t('basemap.backgroundColor'),
        value: backgroundColor.value,
    },
    {
        type: "switch",
        title: t('basemap.lightBg'),
        field: "lightTheme",
        value: lightTheme.value,
        props: {
            round: false,
        },
    },
    {
        type: 'input',
        field: 'clipbounds',
        title: t('basemap.customBounds'),
        info: t('basemap.customBoundsInfo'),
        value: mapStyle.clipbounds ? (Array.isArray(mapStyle.clipbounds) ? mapStyle.clipbounds.join(",") : toString(mapStyle.clipbounds)) : '',
        props: {
            placeholder: t('basemap.customBoundsPlaceholder'),
            clearable: true
        },
        suffix: {
            type: 'button',
            children: uiApp ? [t('basemap.pick')] : [''],
            on: {
                click: async () => {
                    await pickBounds();
                }
            }
        }
    },
    {
        type: 'tableComp',
        field: 'layeron',
        title: t('basemap.layer'),
        value: convertLayeron(mapStyle.layeron),
        props: {
            options: {
                columns: [
                    {
                        title: t('basemap.zoomRange'),
                        info: t('basemap.zoomRangeInfo'),
                        key: "zoom"
                    },
                    {
                        title: t('basemap.openLayers'),
                        info: t('basemap.openLayersInfo'),
                        key: "layers"
                    }
                ],
                buttons: [
                    {
                        icon: shallowRef(Settings),
                        info:  uiApp ? [t('basemap.set')] : [''],
                        click: async (data: any, idx: number) => {
                            await pickLayers(data, idx);
                        }
                    }
                ]
            }
        }
    },
    {
        type: 'tableComp',
        field: 'lineweight',
        title: t('basemap.lineWidth'),
        value: convertLineweight(mapStyle.lineweight),
        props: {
            options: {
                columns: [
                    {
                        title: t('basemap.zoomRange'),
                        info: t('basemap.zoomRangeInfo'),
                        key: "zoom"
                    },
                    {
                        title: t('basemap.displayLineWidth'),
                        info: t('basemap.displayLineWidthInfo'),
                        key: "lineweight"
                    }
                ]
            }
        }
    },
    {
        type: 'monacoEditor',
        field: 'expr',
        title: t('basemap.styleExpr'),
        value: mapStyle.expression ?? '',
        props: {
            style: {
                height: '500px'
            },
            language: 'expr'
        }
    },
]);
const onChange = useDebounceFn(() => {
    let value = { ...toRaw(fApi) as any };
    try {
        let style: IMapStyleParam = {
            name: value.value,
            backcolor: 0,
        };

        if (value.clipbounds == '') {
            delete value.clipbounds; // 如果没有设置
        } else {
            let clipbounds = value.clipbounds.split(',');
            if (clipbounds.length == 4) {
                clipbounds = clipbounds.map((e: string) => +e);
                let bounds = vjmap.GeoBounds.fromArray(clipbounds);
                bounds = bounds.square();
                style.clipbounds = [bounds.min.x, bounds.min.y, bounds.max.x, bounds.max.y];
            } else {
                style.clipbounds = +value.clipbounds;
            }
        }

        // 图层
        let layeron = [...toRaw(value.layeron)];
        // 去除所有空项
        layeron = layeron.filter((layer: any) => !(!layer.zoom && !layer.layers));
        if (layeron.length == 1 && layeron[0].zoom == '') {
            // 转成数组形式
            style.layeron = layeron[0].layers.replace('(', '').replace(')', '').split(",").map((e: any) => +e);
        } else {
            // 转成对象形式，图层必须有
            layeron = layeron.filter((layer: any) => !!layer.layers);
            if (layeron.length > 0) {
                let layeronObj: any = {};
                for (let item in layeron) {
                    let val = layeron[item].layers;
                    val = val.trim();
                    if (val.indexOf("(") < 0) val = "(" + val;
                    if (val.indexOf(")") < 0) val = val + ")";
                    let z = layeron[item].zoom;
                    if (!z) z = "*"; //表示所有图层
                    layeronObj[z] = val;
                }
                style.layeron = JSON.stringify(layeronObj);
            }
        }


        // 线宽
        let lineweights = [...toRaw(value.lineweight)];
        // 去除所有空项
        lineweights = lineweights.filter((lw: any) => !(!lw.zoom && !lw.lineweight));
        if (lineweights.length == 1 && lineweights[0].zoom == '') {
            // 转成数组形式
            style.lineweight = [lineweights[0].lineweight == "1" ? 1 : 0];
        } else {
            // 转成对象形式，图层必须有
            lineweights = lineweights.filter((lw: any) => lw.zoom && lw.lineweight);
            if (lineweights.length > 0) {
                let lineweightArr: any = [];
                for (let item in lineweights) {
                    let val = lineweights[item].lineweight;
                    val = val.trim();
                    let z = +lineweights[item].zoom;
                    if (z <= 0 || z >= 24) continue;
                    lineweightArr[z - 1] = val == "1" ? 1 : 0;
                }
                let n = 0;
                for (let i = 0; i < lineweightArr.length; i++) {
                    if (lineweightArr[i] === null || lineweightArr[i] === undefined) {
                        lineweightArr[i] = n; //  如果此级别没有设置。则以上个级别为主
                    }
                    n = lineweightArr[i];
                }
                style.lineweight = lineweightArr;
            }
        }

        mapConfig.backgroundColor = value.backgroundColor;
        style.backcolor = value.lightTheme ? 0xFFFFFF : 0;
        if (value.expr) {
            let expr = value.expr.trim();
            if (expr != "") {
                style.expression = expr;
            }
        }
        mapApp.setMapOpenOptions({
            style
        });
    } catch (error: any) {
        window.$message.error(error);
    }

}, 1000);



const pickBounds = async () => {
    let res = await pickMapBounds(mapApp, uiApp, "mapoption_PickBounds", t('basemap.pickBoundsPrompt'), fApi.clipbounds);
    if (res) {
        res = res.replace("[", "");
        res = res.replace("]", "");
        form.value.fapi.setValue({
            clipbounds: res,
        });
    }
}



const pickLayers = async (data: any, idx: number) => {
    let layers;
    if (data[idx].layers) {
        layers = data[idx].layers?.replace('(', '').replace(')', '').split(",").map((e: any) => +e) ?? [];
    } else {
        // 默认获取所有打开的图层
        layers = mapApp.svc.getMapLayers().filter((layer: IMapLayer) => !layer.isOff).map((layer: IMapLayer) => layer.index);
    }
    let res = await uiApp.showModalAsync("pickLayers", t('basemap.pickLayersPrompt'), {
        component: MapComp,
        props: {
            positiveText: t('common.confirm'),
            negativeText: '',
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
                pitch: 0,
            },
            mapOpenOptions: {
                style: {
                    backcolor: mapStyle?.backcolor ?? 0,
                    layeron: layers
                }
            },
            ui: {
                comp: SelectLayer,
                value: {
                    layers: layers
                }
            }
        }
    })
    if (res.isOk) {
        data[idx].layers = `(${res.result.value.layers.join(',')})`;
    }
}

const handleThemeSelect = (key: string | number) => {
    if (key == "tech") {
        let expr = "var color := gFilterCustomTheme(gInColorRed, gInColorGreen, gInColorBlue, 200, 200, 0.1);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);";
        let el = form.value.fapi.el('expr');
        el.setValue(expr);
    } else if (key == "gray") {
        let expr = "var color := gFilterMaxAvg(gInColorRed, gInColorGreen, gInColorBlue);gOutColorRed[0] := gRed(color);gOutColorGreen[0] := gGreen(color);gOutColorBlue[0] := gBlue(color);";
        let el = form.value.fapi.el('expr');
        el.setValue(expr);
    } else if (key == "default") {
        let el = form.value.fapi.el('expr');
        el.setValue('');
    } else if (key == "moretheme") {
        const base = locale.value === 'en' ? 'https://vjmap.com/en/demo/' : 'https://vjmap.com/demo/';
        window.open(base + '#/demo/map/service/24setMapStyle', '_blank')
    } else if (key == "moreexpr") {
        const base = locale.value === 'en' ? 'https://vjmap.com/en/demo/' : 'https://vjmap.com/demo/';
        window.open(base + '#/demo/map/service/12mapStyleBackend', '_blank')
    }
}

const onOK = () => {
    emit("onClose", {
        config: mapApp?.config
    })
}
</script>