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
import { inject, reactive, ref, toRaw } from "vue";
import { useI18n } from 'vue-i18n';
import { pickMapImageCoordinates } from "@/lib/map/pick";
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
        title: t('sources.imageSourceId'),
        value: props.data?.id,
        props: {
            placeholder: t('sources.imageSourceIdPlaceholder'),
            disabled: !!(props.data?.id)
        }
    },
    {
        type: 'input',
        field: 'url',
        title: t('sources.imageUrl'),
        value: props.data?.url,
        props: {
            placeholder: t('sources.imageUrlPlaceholder'),
        }
    },
    {
        type: 'input',
        field: 'coordinates',
        title: t('sources.imageBounds'),
        value: props.data?.coordinates ? JSON.stringify(props.data?.coordinates) : undefined,
        info: t('sources.imageBoundsInfo'),
        props: {
            placeholder: t('sources.imageUrlPlaceholder'),
        },
        suffix:{
            type:'button',
            children:[t('sources.pickImageBounds')],
            on:{
                click: async () => {
                    if (!fApi.url) {
                        window.$message.error(t('sources.pleaseInputImageUrl'))
                        return;
                    }
                    let res = await pickMapImageCoordinates(mapApp, uiApp, "image_pickImageCoordinates", t('sources.pickImageBoundsPrompt'), 
                    "image", fApi.url, fApi.coordinates);
                    if (res) {
                        form.value.fapi.setValue({
                            coordinates: res,
                        });
                    }
                }
            }
        }
    }
]);

const getResult = () => {
    let data = toRaw(fApi);
    if (data.coordinates) {
        data.coordinates = JSON.parse(data.coordinates);
    } else {
        window.$message.error(t('sources.noCoordinates'))
        return {};
    }
    if (!data.url) {
        window.$message.error(t('sources.pleaseInputImageUrl'))
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