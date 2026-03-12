<template>
    <n-card class="card">
        <n-space vertical>
            <n-button type="primary" ghost @click="emit('addMarker')">
                {{ t('sources.wms.addCorrespondPoint') }}
            </n-button>
            <n-button type="warning" ghost @click="emit('removeMarkers')">
                {{ t('sources.wms.removeAllPoints') }}
            </n-button>
            <n-checkbox v-model:checked="param.isSetRotateZero" :on-update:checked="(v: Boolean) => {param.isSetRotateZero = v; onChange()}">
                {{ t('sources.wms.noRotate') }}
            </n-checkbox>
            <n-data-table :columns="dataColumns" :data="param.coordinates"  max-height="200px"
               default-expand-all />
        </n-space>
    </n-card>
</template>
<script setup lang="ts">
import { ref, toRaw, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DataTableColumns } from 'naive-ui';
const { t } = useI18n();
const emit = defineEmits(['updateValue', 'addMarker', 'removeMarkers']);
const props = defineProps({
  value: {
    type: Object,
    required: false,
    default: ()=>{}
  }
})
const param = ref(props.value ?? {});
type RowData = {
    x1: number
    y1: number
    x2: number
    y2: number
}
const dataColumns = computed<DataTableColumns<RowData>>(() => [
    {
        type: 'expand',
        renderExpand: (rowData) => {
            return `
            ${rowData.x2.toFixed(2)},${rowData.y2.toFixed(2)}; ${rowData.x1.toFixed(2)},${rowData.y1.toFixed(2)}
        `
        }
    },
    {
        title: t('sources.wms.pointCoordX'),
        key: 'x2',
        width: 120
    },
    {
        title: t('sources.wms.pointCoordY'),
        key: 'y2',
        width: 120,
        ellipsis: true
    },
    {
        title: t('sources.wms.basePointCoordX'),
        key: 'x1',
        width: 120
    },
    {
        title: t('sources.wms.basePointCoordY'),
        key: 'y1',
        width: 120,
        ellipsis: true
    }
])
const onChange =() => {
    let res = toRaw(param.value);
    emit("updateValue", res)
};
</script>
<style scoped>
.card {
    position: absolute;
    width: 200px;
    height: 450px;
}
</style>
