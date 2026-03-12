<template>
    <div>
        <n-space>
            <n-card :title="t('sources.httpData.paramInput')" size="small" :style="{ width: '300px' }">
                <n-radio-group v-model:value="reqType" size="small">
                    <n-radio-button value="GET" :label="t('sources.httpData.getRequest')" />
                    <n-radio-button value="POST" :label="t('sources.httpData.postRequest')" />
                    <n-radio-button value="SOURCE" :label="t('sources.httpData.sourceData')" />
                </n-radio-group>
                <FormCreate v-model="paramfApi" :rule="paramRule" :option="formOption" ref="paramForm"></FormCreate>
            </n-card>
            <n-space vertical>
                <n-space>
                    <n-card :title="t('sources.httpData.queryResult')" size="small" :style="{ width: '420px' }">
                        <n-space vertical>
                            <n-space>
                                <n-button type="primary" @click="sendReqData">
                                    {{ t('sources.httpData.requestData') }}
                                </n-button>
                                <n-button type="default" @click="testData">
                                    {{ t('sources.httpData.testData') }}
                                </n-button>
                            </n-space>

                            <div>{{ t('sources.httpData.returnResult') }}</div>
                            <monaco-editor :style="{ height: '160px' }" :wordWrap="false" :minimap="false"
                                :lineNumbers="false" v-model="queryJson" ref="queryJsonEditor"
                                language="json"></monaco-editor>

                        </n-space>


                    </n-card>
                    <n-card :title="t('sources.httpData.processResultTitle')" size="small" :style="{ width: '400px' }">
                        <template #header-extra>
                            <n-button type="default" @click="showMapModel = true">
                                {{ t('sources.viewDataOnMap') }}
                            </n-button>
                        </template>
                        <monaco-editor :style="{ height: '230px' }" :wordWrap="false" :minimap="false"
                            :lineNumbers="false" v-model="resultJson" ref="resultJsonEditor"
                            language="json"></monaco-editor>
                    </n-card>
                </n-space>
                <div>{{ t('sources.httpData.dataProcessHint') }}</div>
                <monaco-editor :style="{ height: '210px' }" :wordWrap="true" :minimap="false" :lineNumbers="true"
                    v-model="dataProcessJson" ref="dataProcessJsonEditor" language="javascript"
                    @change="changeResult"></monaco-editor>
            </n-space>
        </n-space>
        <n-modal v-model:show="showMapModel" preset="dialog" :title="t('sources.httpData.viewMap')" :style="{ width: '850px' }">
            <MapDataPreview :data="mapGeoJsonData" />
        </n-modal>
    </div>
</template>

<script setup lang="ts">
import MonacoEditor from "@/components/MonacoEditor.vue";
import formCreate from "@form-create/naive-ui"
import { inject, onMounted, reactive, ref, toRaw, watch, computed } from "vue";
import { useI18n } from 'vue-i18n';
import { requestChangeData, evalDataConvert } from '@vjmap/common';
import type { editorContext } from "@/types";
import MapDataPreview from './MapDataPreview.vue'
const { t } = useI18n();
const props = defineProps({
    change: {
        type: Object,
        required: false,
        default: () => {
            return {
                reqType: "GET",
                url: "",
                data: "",
                header: "",
                interval: 0,
                processJS: ""
            }
        }
    },
    sources: {
        type: Array,
        required: false,
        default: () => []
    }
});
const FormCreate = formCreate.$form();
const param = { ...props.change }
if (param.data && typeof param.data != "string") {
    param.data = JSON.stringify(param.data, null, 4)
}
if (param.header && typeof param.header != "string") {
    param.header = JSON.stringify(param.header, null, 4)
}
let paramfApi = reactive<any>(param);
const paramForm = ref();
const reqType = ref(param.reqType ?? "GET")
const queryJsonEditor = ref();
const dataProcessJsonEditor = ref();
const resultJsonEditor = ref();
const queryJson = ref('');
const dataProcessJson = ref(props?.change?.processJS ?? "");
const resultJson = ref('');
const showMapModel = ref(false);
const { mapApp } = inject<editorContext>('editorContext') as editorContext;
const mapGeoJsonData = ref({})
const formOption = reactive({
    form: {
        labelWidth: "auto",
        size: 'small',
        labelPlacement: 'top',
    },
    submitBtn: false
});


const paramRule = computed(() => [
    {
        type: 'select',
        field: 'fromSourceId',
        title: t('sources.httpData.fromSourceId'),
        value: "",
        options: props.sources,
    },
    {
        type: "Input",
        field: 'url',
        title: t('sources.httpData.urlAddress'),
        value: '',
        props: {
            placeholder: '',
        }
    },
    {
        type: 'monacoEditor',
        field: 'data',
        title: t('sources.httpData.requestParamData'),
        value: '',
        props: {
            height: 110,
            language: 'json',
            wordWrap: false,
            lineNumbers: false
        }
    },
    {
        type: 'monacoEditor',
        field: 'header',
        title: t('sources.httpData.requestHeader'),
        value: '',
        props: {
            height: 80,
            language: 'json',
            wordWrap: false,
            lineNumbers: false
        }
    }, {
        type: "InputNumber",
        field: 'interval',
        title: t('sources.httpData.updateIntervalSec'),
        info: t('sources.httpData.intervalZeroHint'),
        value: 0,
        props: {
            placeholder: '',
        }
    },
]);

const switchControl = () => {
    if (reqType.value == "SOURCE") {
        paramForm.value.fapi.hidden(false, 'fromSourceId');
        paramForm.value.fapi.hidden(true, 'url');
        paramForm.value.fapi.hidden(true, 'data');
        paramForm.value.fapi.hidden(true, 'header');
    } else {
        paramForm.value.fapi.hidden(true, 'fromSourceId');
        paramForm.value.fapi.hidden(false, 'url');
        paramForm.value.fapi.hidden(false, 'data');
        paramForm.value.fapi.hidden(false, 'header');
    }
}
watch(reqType, () => {
    switchControl();
});
onMounted(() => {
    switchControl();
})

const sendReqData = async () => {
    try {
        let param = { ...toRaw(paramfApi) };
        param.reqType = reqType.value;
        let res = await requestChangeData(mapApp.map, param, mapApp);
        queryJsonEditor.value.setValue(res ? JSON.stringify(res, null, 4) : "");
        await convertData(res);
    } catch (error: any) {
        window.$message.error(error)
    }
}

const convertData = async (data: any) => {
    try {
        let processJS = dataProcessJsonEditor.value.getValue();
        if (processJS) {
            /**
             *  处理地图后台服务查询的数据的处理语句
                let result = map.getService()._processQueryResult(data.data);
                result = utils.ProcessDataToFeatureCollection(map, result, true);
                return result;
             */
            let result = await evalDataConvert(data, processJS, mapApp.map, mapApp);
            resultJsonEditor.value.setValue(result ? JSON.stringify(result, null, 4) : "");
        } else {
            resultJsonEditor.value.setValue(queryJsonEditor.value.getValue());
        }
        mapGeoJsonData.value = JSON.parse(resultJsonEditor.value.getValue());
    } catch (error: any) {
        window.$message.error(error)
    }
}
const changeResult = () => {
    try {
        mapGeoJsonData.value = JSON.parse(resultJsonEditor.value.getValue());
    } catch (e) { /* empty */ }
}
const testData = async () => {
    try {
        await convertData(JSON.parse(queryJsonEditor.value.getValue()));
    }
    catch (error: any) {
        window.$message.error(error)
    }
}

const getResult = () => {
    let param = { ...toRaw(paramfApi) };
    param.reqType = reqType.value;
    if (param.data && typeof param.data == "string") {
        param.data = JSON.parse(param.data);
    }
    if (param.header && typeof param.header == "string") {
        param.header = JSON.parse(param.header);
    }
    return {
        ...param,
        processJS: dataProcessJsonEditor.value.getValue()
    }
}

defineExpose({
    getResult
})
</script>

