<template>
    <n-data-table
    v-model:checked-row-keys="checkedRowKeysRef"
    :columns="columns"
    :data="data"
    :pagination="pagination"
    :row-key="rowKey"
    @update:checked-row-keys="handleCheck"
  />
</template>

<script setup  lang="ts">
import { inject, reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DataTableColumns, DataTableRowKey } from 'naive-ui';
import type MapApp from '@vjmap/common';
import type { IMapLayer } from 'vjmap';

const { t } = useI18n();
const emits = defineEmits(['update:modelValue']);
const mMap = inject<MapApp>('interactiveMap');
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => {}
  }
})
type RowData = {
  index: string
  layername: string
}
const columns = computed<DataTableColumns<RowData>>(() => [
  { type: 'selection' },
  { title: t('basemap.layerIndex'), key: 'index' },
  { title: t('basemap.layerName'), key: 'layername' }
]);

const data = mMap?.map.getService().getMapLayers().map((layer: IMapLayer) => ({
  layername: layer.name,
  index: layer.index,
})) 
const checkedRowKeysRef = ref<DataTableRowKey[]>(props.modelValue.layers);
const pagination = reactive({
    pageSize: 8
});
const rowKey = (row: RowData) => row.index;
const handleCheck = (rowKeys: DataTableRowKey[]) => {
    checkedRowKeysRef.value = rowKeys;
    let config = mMap?.getConfig();
    // @ts-ignore
    config.mapOpenOptions.style.layeron = rowKeys;
    // @ts-ignore
    mMap.setMapOpenOptions(config.mapOpenOptions);
    emits("update:modelValue", {
      layers: rowKeys
    })
}
</script>