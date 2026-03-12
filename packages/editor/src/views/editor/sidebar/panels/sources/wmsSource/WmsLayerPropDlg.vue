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
        type: 'Switch',
        field: 'transparent',
        title: t('sources.wms.transparent'),
        value: props.modelValue?.transparent ?? true,
        props: {
        }
    },
    {
        type: "ColorPicker",
        field: 'backgroundColor',
        title: t('sources.wms.tileBgColor'),
        value: props.modelValue?.backgroundColor,
        props: {
        }
    },
    {
        type: 'Switch',
        field: 'mvt',
        title: t('sources.wms.vectorTile'),
        value: props.modelValue?.mvt,
        props: {
        }
    },
    {
        type: 'Switch',
        field: 'useImageRotate',
        title: t('sources.wms.considerRotate'),
        value: props.modelValue?.useImageRotate,
        props: {
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