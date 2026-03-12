<template>
  <n-space vertical>
    <n-space justify="space-between">
      <n-button ghost type="primary" style="width:200px;" @click="addLayer">
        <template #icon>
          <n-icon>
            <Add />
          </n-icon>
        </template>
        {{ t('layers.addLayer') }}
      </n-button>
      <n-button ghost @click="refreshLayers">
        <template #icon>
          <n-icon>
            <Refresh />
          </n-icon>
        </template>
        {{ t('layers.refresh') }}
      </n-button>
    </n-space>


    <n-scrollbar :style="scrollStyle" trigger="none">
      <n-list bordered hoverable clickable>
        <template #header>
          {{ t('layers.allLayers') }}
        </template>
        <n-empty v-if="!layers.length" :description="t('layers.noLayersYet')">
          <template #icon>
            <n-icon>
              <BasketOutline />
            </n-icon>
          </template>
        </n-empty>
        <n-list-item v-for="item in layers" :key="item.layerId">
          <template #prefix>
            <n-tag style="width:82px" round :bordered="false" :type="item.tagType" size="small"
              @click="itemClick(item)">
              {{ item.tag }}
            </n-tag>
          </template>
          <template #suffix>
            <n-space style="width:60px">
              <n-button type="info" size="tiny" quaternary @click.prevent="itemVisible(item)">
                <template #icon>
                  <n-icon v-if="item.visibleOff">
                    <EyeOff />
                  </n-icon>
                  <n-icon v-else>
                    <Eye />
                  </n-icon>
                </template>
              </n-button>
              <n-dropdown trigger="hover" :options="menuOptions"
                :render-icon="(opts: any) => renderDropdownIcon(item, opts)"
                @select="(key: string) => handleMenuSelect(item, key)">
                <n-button type="info" size="tiny" quaternary>
                  ...
                </n-button>
              </n-dropdown>
            </n-space>

          </template>
          <div @click="itemClick(item)" style="width:140px;overflow: hidden;">
            <n-tooltip trigger="hover">
              <template #trigger>
                <span style="max-width: 100%;white-space:nowrap;"> {{ (item.memo ? (item.memo + " " + item.layerId) :
                item.layerId) }} </span>
              </template>
              {{ item.memo ? (item.memo + " " + item.layerId) : item.layerId }}<br>
              {{ item.source }}
            </n-tooltip>
          </div>
        </n-list-item>

      </n-list>
    </n-scrollbar>
  </n-space>
</template>

<script setup lang="ts">
import type { editorContext } from '@/types';
import { inject, ref, reactive, shallowRef, h, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Add, BasketOutline, Eye, EyeOff, Refresh, Checkmark } from '@vicons/ionicons5'
import { useResizeObserver } from '@vueuse/core';
import vjmap from 'vjmap';
import LayerItemPanel from './LayerItemPanel.vue'
import allLayers from '@/lib/layers'
import SelectLayer from './SelectLayer.vue'
import emitter from '@/lib/mitt';
import LayerIdMemoDialog from './LayerIdMemoDialog.vue';
import { NIcon, type DropdownOption } from 'naive-ui';
import { nextTick } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute()
const { t } = useI18n();
const { mapApp, uiApp } = inject<editorContext>('editorContext') as editorContext;
const scrollStyle = reactive({ maxHeight: '500px' });
useResizeObserver(document.body, (entries) => {
  scrollStyle.maxHeight = (entries[0].contentRect.height - 130) + 'px';
});
const menuOptions = computed(() => [
  { label: t('layers.moveUp'), key: 'moveUpLayer' },
  { label: t('layers.moveDown'), key: 'moveDownLayer' },
  { label: t('layers.moveToBottom'), key: 'LayerLowest' },
  { label: t('layers.copyLayer'), key: 'copyLayer' },
  { label: t('layers.deleteLayer'), key: 'deleteLayer' },
  { label: t('layers.modifyLayerInfo'), key: 'modifyIdMemo' },
])
const layers: any = ref([]);
const refreshLayers = () => {
  let mapLayers = mapApp.layers || [];
  layers.value = [];

  let idx = 0;
  let cacheTag: any = {};
  const getTagType = (type: string) => {
    const tagTypes = ['success', 'info', 'warning', 'error'];
    if (cacheTag[type]) return cacheTag[type];
    let tagType = tagTypes[idx++ % tagTypes.length];
    cacheTag[type] = tagType;
    return tagType
  }

  for (let idx = 0; idx < mapLayers.length; idx++) {
    let mapLayer = mapLayers[idx];
    let source = "";
    if (mapLayer.sourceId) {
      const sIdx = mapApp.sources.findIndex((s: any) => s.id == mapLayer.sourceId);
      if (sIdx >= 0) {
        source = t('layers.dataFrom', { source: mapApp.sources[sIdx].memo ? mapApp.sources[sIdx].memo + " " + mapApp.sources[sIdx].id : mapApp.sources[sIdx].id })
      }
    }
    layers.value.push({
      layerId: mapLayer.layerId,
      memo: mapLayer.memo,
      index: idx,
      source,
      sourceId: mapLayer.sourceId,
      type: mapLayer.type,
      tag: allLayers[mapLayer.type]?.name,
      tagType: getTagType(mapLayer.type),
      visibleOff: mapLayer.visibleOff ?? false,
      isLowest: mapLayer.isLowest ?? false
    })
  }
}
refreshLayers();

emitter.on("mapConfigLoaded", () => {
  refreshLayers();
});
const addLayer = async () => {
  let res = await uiApp.showModalAsync("SelectLayer", t('layers.newLayer'), {
    component: SelectLayer,
    props: {
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      width: '950px',
      height: '630px'
    }
  })
  if (res.isOk) {
    mapApp.addLayer(res.result, true);
    refreshLayers();
  }
}

const itemClick = async (item: any) => {
  showLayer(item);

}

const itemVisible = async (item: any) => {
  item.visibleOff = !item.visibleOff;
  mapApp.setLayerVisible(item.layerId, item.visibleOff, true);
}

const renderDropdownIcon = (item: any, option: DropdownOption) => {
  if (option.key == "LayerLowest" && item && item.isLowest) {
    return h(NIcon, null, {
      default: () => h(Checkmark)
    })
  }
}
const showLayer = (item?: any) => {
  let mapLayers = mapApp.layers || [];
  let layer = allLayers[item.type];
  if (!layer) {
    window.$message.error(t('layers.layerNotFound', { type: item.type }));
    return;
  }

  let data: any = {};
  if (item.layerId) {
    data = mapLayers.find((m: any) => m.layerId == item.layerId);
  }
  let memo = data.memo;
  uiApp.showFloatPane(layer.title, layer.title, {
    component: shallowRef(LayerItemPanel),
    props: {
      data: data,
      factory: layer.factory
    },
    listeners: {
      onOK: (comp: any) => {
        comp.getResult();
        data = mapLayers.find((m: any) => m.layerId == item.layerId)
        if (data) data.memo = memo;
        refreshLayers();
      }
    }
  })
}
//数组元素互换位置
const swapArray = (arr: Array<any>, index1: number, index2: number) => {
  arr[index1] = arr.splice(index2, 1, arr[index1])[0];
  return arr;
}
const handleMenuSelect = async (item: any, key: string) => {
  if (key == "moveUpLayer") {
    let idx = mapApp.layers.findIndex((layer: any) => layer.layerId == item.layerId);
    if (idx <= 0) return;
    swapArray(mapApp.layers, idx, idx - 1);
    // 同步更新配置中的图层
    if (mapApp.config.mapLayers) {
      idx = mapApp.config.mapLayers.findIndex((layer: any) => layer.layerId == item.layerId);
      if (idx <= 0) return;
      swapArray(mapApp.config.mapLayers, idx, idx - 1);
    }

    refreshLayers();
  } else if (key == "moveDownLayer") {
    let idx = mapApp.layers.findIndex((layer: any) => layer.layerId == item.layerId);
    if (idx < 0 || idx == mapApp.layers.length - 1) return;
    swapArray(mapApp.layers, idx, idx + 1);

    // 同步更新配置中的图层
    if (mapApp.config.mapLayers) {
      idx = mapApp.config.mapLayers.findIndex((layer: any) => layer.layerId == item.layerId);
      if (idx < 0 || idx == mapApp.config.mapLayers.length - 1) return;
      swapArray(mapApp.config.mapLayers, idx, idx + 1);
    }

    refreshLayers();
  } else if (key == "LayerLowest") {
    let idx = mapApp.layers.findIndex((layer: any) => layer.layerId == item.layerId);
    if (idx < 0) return;
    mapApp.layers[idx].isLowest = !mapApp.layers[idx].isLowest;
    for (let k = idx; k >= 1; k--) {
      swapArray(mapApp.layers, k, k - 1);
    }

    // 同步更新配置中的图层
    if (mapApp.config.mapLayers) {
      idx = mapApp.config.mapLayers.findIndex((layer: any) => layer.layerId == item.layerId);
      if (idx < 0) return;
      mapApp.config.mapLayers[idx].isLowest = !mapApp.config.mapLayers[idx].isLowest;
      for (let k = idx; k >= 1; k--) {
        swapArray(mapApp.config.mapLayers, k, k - 1);
      }
    }
    refreshLayers();
    await mapApp.setConfig();// 强制刷新下
  } else if (key == "copyLayer") {
    let idx = mapApp.layers.findIndex((layer: any) => layer.layerId == item.layerId);
    if (idx < 0) return;
    let res = await uiApp.showModalAsync("LayerIdMemoDialog", t('layers.copyLayerTitle'), {
      component: LayerIdMemoDialog,
      props: {
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        width: '400px',
        height: '300px',
        sourceId: item.sourceId,
      }
    })
    if (res.isOk) {
      let opts = res.result || {};
      if (!opts.layerId) {
        // 随机生成
        opts.layerId = item.type + "_" + vjmap.RandomID(8);
      }
      let findIdx = mapApp.layers.findIndex((layer: any) => opts.layerId == layer.layerId);
      if (findIdx >= 0) {
        window.$message.error(t('layers.layerIdDuplicate'));
        return
      }
      mapApp.addLayer({
        ...mapApp.layers[idx],
        ...opts
      }, true)
      refreshLayers();
    }
  } else if (key == "deleteLayer") {
    window.$dialog.warning({
      title: t('layers.confirmTitle'),
      content: t('layers.confirmDelete', { memo: item.memo ?? '', layerId: item.layerId }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: () => {
        mapApp.removeLayer(item.layerId, true);
        refreshLayers();
      }
    })
  } else if (key == "modifyIdMemo") {
    let idx = mapApp.layers.findIndex((layer: any) => layer.layerId == item.layerId);
    let cfgIdx = mapApp.config.mapLayers?.findIndex((layer: any)  => layer.layerId == item.layerId) ?? -1;
    if (idx < 0) return;
    let res = await uiApp.showModalAsync("LayerIdMemoDialog", t('layers.modify'), {
      component: LayerIdMemoDialog,
      props: {
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        width: '400px',
        height: '300px',
        layerId: item.layerId,
        sourceId: item.sourceId,
        memo: item.memo
      }
    })
    if (res.isOk) {
      let opts = res.result || {};
      if (!opts.layerId) {
        // 随机生成
        opts.layerId = item.type + "_" + vjmap.RandomID(8);
      }
      if (opts.layerId == item.layerId && opts.memo == item.memo && opts.sourceId == item.sourceId) {
        return
      } else if (opts.layerId == item.layerId && opts.sourceId == item.sourceId && opts.memo != item.memo) {
        mapApp.layers[idx].memo = opts.memo;
        if (cfgIdx >= 0 && mapApp.config.mapLayers) {
          mapApp.config.mapLayers[cfgIdx].memo = opts.memo;
        }
        refreshLayers();
      } else {
        let layerOpts = {
          ...mapApp.layers[idx],
          ...opts
        }
        mapApp.removeLayer(item.layerId, true);
        mapApp.addLayer(layerOpts, true);
        // 还是挪动到之前的位置 
        swapArray(mapApp.layers, mapApp.layers.length - 1, idx)

        if (cfgIdx >= 0 && mapApp.config.mapLayers) {
          // 还是挪动到之前的位置 
          swapArray(mapApp.config.mapLayers, mapApp.config.mapLayers.length - 1, cfgIdx)
        }

        refreshLayers();
      }
    }
  }
}


onMounted(async () => {
  if (route.query?.layerId) {
    nextTick(() => {
      let layer = layers.value.find((layer: any) => layer.layerId == route.query?.layerId)
      showLayer(layer)
      delete route.query?.layerId
    })
  }
})

</script>

<style lang="scss" scoped>

</style>