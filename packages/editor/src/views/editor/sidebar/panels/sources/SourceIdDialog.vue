<template>
     <n-card>
        <FormCreate v-model="fApi" ref="form" :rule="rule" :option="option"></FormCreate>
    </n-card>
</template>

<script setup lang="ts">
import formCreate from "@form-create/naive-ui"
import { reactive, ref, toRaw, computed } from "vue";
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const FormCreate = formCreate.$form();
const form = ref<any>(null);
let fApi = reactive<any>({});
const props = defineProps({
    id: {
        type: String,
        required: false,
        default: ""
    },
    memo: {
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
    field:'id',
    title: t('sources.sourceIdTitle'),
    value: props.id,
    props: {
        placeholder: t('sources.sourceIdPlaceholderRandom'),
    }
  },
  {
    type:'input',
    field:'memo',
    title: t('sources.memoTitle'),
    value: props.memo,
    props: {
        placeholder: '',
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