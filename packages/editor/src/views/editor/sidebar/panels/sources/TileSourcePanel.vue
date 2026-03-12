<template>
    <n-space vertical>
            <n-card>
                <FormCreate v-model="fApi" ref="form" :rule="rule" :option="option"></FormCreate>
            </n-card>
    </n-space>
</template>

<script setup lang="ts">
import type { editorContext } from "@/types";
import formCreate from "@form-create/naive-ui"
import { inject, reactive, ref, toRaw, computed } from "vue";
import { useI18n } from 'vue-i18n';
import { pickMapBounds } from "@/lib/map/pick";
const { t } = useI18n();
const { mapApp, uiApp } = inject<editorContext>('editorContext') as editorContext;
const FormCreate = formCreate.$form();
const form = ref<any>(null);
let fApi = reactive<any>({});
const props = defineProps({
    data: {
        type: Object,
        required: false,
        default: () => {
            return {
            }
        }
    },
    isVector: {
        type: Boolean,
        required: false,
        default: false
    }
});

const option = reactive({
    form: {
        labelWidth: "auto",
        size: 'small'
    },
    submitBtn: false
});
const rule = ref([
    {
        type: 'input',
        field: 'id',
        title: t('sources.tileSourceId'),
        value: props.data?.id,
        props: {
            placeholder: t('sources.tileSourceIdPlaceholder'),
            disabled: !!(props.data?.id)
        }
    },
    {
        type: 'input',
        field: 'tiles',
        title: t('sources.tilesUrl'),
        value: props.data?.tiles,
        info: t('sources.tilesUrlInfo'),
        props: {
            placeholder: t('sources.tilesUrlPlaceholder'),
        }
    },
    {
        type: "InputNumber",
        field: 'tileSize',
        title: t('sources.tileSize'),
        value: props.data?.tileSize,
        info: t('sources.tileSizeInfo'),
        props: {
            min: 0,
            placeholder: t('sources.tileSizePlaceholder')
        }
    },
    {
        type: 'input',
        field: 'bounds',
        title: t('sources.tileBounds'),
        value: props.data?.bounds ? JSON.stringify(props.data?.bounds, null, 0) : undefined,
        info: t('sources.tileBoundsInfo'),
        props: {
            placeholder: t('sources.tileBoundsPlaceholder'),
        },
        suffix:{
            type:'button',
            children:[t('sources.pickBounds')],
            on:{
                click: async () => {
                    let res = await pickMapBounds(mapApp, uiApp, "raster_pickbounds", t('sources.pickBoundsPrompt'), fApi.bounds);
                    if (res) {
                        form.value.fapi.setValue({
                            bounds: res,
                        });
                    }
                }
            }
        }
    },
    {
        type: "InputNumber",
        field: 'minzoom',
        title: t('sources.minZoom'),
        value: props.data?.minzoom,
        info: t('sources.zoomInfo'),
        props: {
            min: 0,
            max: 24,
            placeholder: t('sources.zoomPlaceholder'),
        }
    },
    {
        type: "InputNumber",
        field: 'maxzoom',
        title: t('sources.maxZoom'),
        value: props.data?.maxzoom,
        info: t('sources.zoomInfo'),
        props: {
            min: 0,
            max: 24,
            placeholder: t('sources.zoomPlaceholder'),
        }
    },
    {
        type: 'select',
        field: 'scheme',
        title: t('sources.schemeY'),
        value: props.data?.scheme,
        info: t('sources.schemeYInfo'),
        options: [{
            label: "",
            value: undefined
        },{
            label: t('sources.schemeXyz'),
            value: "xyz"
        },{
            label: t('sources.schemeTms'),
            value: "tms"
        }],
        props: {
            placeholder: t('sources.schemePlaceholder'),
        }
    },
]);

if (props.isVector) {
    rule.value.push({
        type: 'input',
        field: 'promoteId',
        title: t('sources.promoteId'),
        value: props.data?.promoteId,
        info: t('sources.promoteIdInfo'),
        props: {
            placeholder: t('sources.promoteIdPlaceholder'),
        }
    })
}

const getResult = () => {
    let data = toRaw(fApi);
    if (data.bounds) {
        data.bounds = JSON.parse(data.bounds);
    }
    if (!data.tiles) {
        window.$message.error(t('sources.noTilesUrl'))
        return {};
    }
    return {
        data: Object.keys(data).reduce((obj: any, key) => {
            if (data[key] !== undefined) {
                obj[key] = data[key];
            }
            return obj;
        }, {})
    }
}
// 如果对话框要返回值，则必须导出此方法
defineExpose({
    getResult
})
</script>