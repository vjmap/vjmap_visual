<template>
    <n-card>
        <FormCreate v-model="fApi" ref="form" :rule="rule" :option="option"></FormCreate>
        <n-space justify="end">
            <n-button type="primary" @click="onOK">{{ t('common.confirm') }}</n-button>
            <n-button  @click="onCancel">{{ t('common.cancel') }}</n-button>
        </n-space>
    </n-card>
</template>

<script setup lang="ts">
import formCreate from "@form-create/naive-ui"
import { reactive, ref, toRaw, computed } from "vue";
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const emit = defineEmits(['update:modelValue', "onClose"]);
const FormCreate = formCreate.$form();
const form = ref<any>(null);
let fApi = reactive<any>({});
const props = defineProps({
    modelValue: {
        type: Object,
        required: false,
        default: () => { }
    }
});
const option = reactive({
    form: {
        labelWidth: "auto",
        size: 'small'
    },
    submitBtn: false
});
const rule = computed(() => [
{
        type: 'input',
        field: 'bounds',
        title: t('sources.wms.tileBounds'),
        value: props.modelValue?.bounds ? JSON.stringify(props.modelValue?.bounds, null, 0) : undefined,
        info: t('sources.wms.tileBoundsInfo'),
        props: {
            placeholder: t('sources.wms.tileBoundsPlaceholder'),
        }
    },
    {
        type: "InputNumber",
        field: 'minzoom',
        title: t('sources.wms.minZoom'),
        value: props.modelValue?.minzoom,
        info: t('sources.wms.minZoomInfo'),
        props: {
            min: 0,
            max: 24,
            placeholder: t('sources.wms.minZoomPlaceholder'),
        }
    },
    {
        type: "InputNumber",
        field: 'maxzoom',
        title: t('sources.wms.maxZoom'),
        value: props.modelValue?.maxzoom,
        info: t('sources.wms.maxZoomInfo'),
        props: {
            min: 0,
            max: 24,
            placeholder: t('sources.wms.maxZoomPlaceholder'),
        }
    },
])

const onCancel = () => {
    emit("onClose", {})
}

const onOK = () => {
    emit('update:modelValue', toRaw(fApi));
    emit("onClose", {})
}
</script>