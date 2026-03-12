<template>
     <n-card>
        <FormCreate v-model="fApi" ref="form" :rule="rule" :option="option"></FormCreate>
    </n-card>
</template>

<script setup lang="ts">
import formCreate from "@form-create/naive-ui"
import { inject, reactive, ref, toRaw, computed } from "vue";
import { useI18n } from 'vue-i18n';
import { getSources } from "./util";
import type { editorContext } from '@/types';
import { sourceTags } from "../sources/SourcesPanel/define";
const { t } = useI18n();
const FormCreate = formCreate.$form();
const form = ref<any>(null);
let fApi = reactive<any>({});
const { mapApp } = inject<editorContext>('editorContext') as editorContext;
const sources = getSources(mapApp, undefined, sourceTags) || [];
const props = defineProps({
    layerId: {
        type: String,
        required: false,
        default: ""
    },
    memo: {
        type: String,
        required: false,
        default: ""
    },
    sourceId: {
        type: String,
        required: false,
        default: ""
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
    type:'input',
    field:'layerId',
    title: t('layers.layerId'),
    value: props.layerId,
    props: {
        placeholder: t('layers.placeholderRandom'),
    }
  },
  {
    type:'select',
    field:'sourceId',
    title: t('layers.sourceId'),
    value: props.sourceId,
    options: sources.map(s => {
        return {
            label: s.memo ? `${s.memo} ${s.id}` : s.id + " " + s.tag,
            value: s.id
        }
    }),
    props: {
        placeholder: '',
    }
  },
  {
    type:'input',
    field:'memo',
    title: t('layers.memo'),
    value: props.memo,
    props: {
        placeholder: t('layers.placeholderOptional'),
    }
  }
])
const getResult = () => {
    let value = toRaw(fApi) as any;
    return value;
}

// 如果对话框要返回值，则必须导出此方法
defineExpose({
   getResult
})
</script>