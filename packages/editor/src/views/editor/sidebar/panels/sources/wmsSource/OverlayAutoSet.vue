<template>
    <n-card class="card">
        {{ t('sources.wms.inputCadEpsg') }}
        <n-input-number v-model:value="param.crs" :on-blur="onChange" placeholder="" :show-button="false">
          <template #prefix>
            EPSG:
            </template>
        </n-input-number>
        {{ t('sources.wms.selectCadEpsg') }}
        <n-cascader v-if="!(param.coordxPrefix >= 10 && param.coordxPrefix < 100)"
        placeholder=""
        :expand-trigger="'click'"
        :options="epsgOptions"
        :check-strategy="'child'"
        :show-path="false"
        @update:value="handleUpdateValue"
        />
        <n-select v-else :options="selectOptions" :on-update:value="onUpdateSelect" placeholder="" />
        <a :href="getHref()"  target="_blank" style="color: aquamarine;">
                {{ t('sources.wms.getEpsgByCoord') }}
        </a><br/>
        {{ t('sources.wms.cadOffsetX') }}
        <n-input-number v-model:value="param.fourParameterX" :on-blur="onChange"  placeholder="" :show-button="false">
        </n-input-number>

        {{ t('sources.wms.cadOffsetY') }}
        <n-input-number v-model:value="param.fourParameterY" :on-blur="onChange"  placeholder="" :show-button="false">
        </n-input-number>

        <n-button type="info" quaternary v-if="baseMapIsWeb" @click="emit('posToCad')">{{ t('sources.wms.locateToCad') }}</n-button>
    </n-card>
</template>

<script setup lang="ts">
import { ref, toRaw, computed } from "vue";
import { useDebounceFn } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import vjmap from "vjmap";
import { getEpsgRange } from "~/map/wms";
const { t, locale } = useI18n();
const emit = defineEmits(['updateValue', 'posToCad']);
const props = defineProps({
  value: {
    type: Object,
    required: false,
    default: ()=>{}
  },
  baseMapIsWeb: {
    type: Boolean,
    required: false,
    default: false
  }
})
const param = ref(props.value ?? {});
if (param.value.crs && typeof(param.value.crs) == "string") {
    param.value.crs = +param.value.crs.replace("EPSG:", "")
}
const getEpsgChild = (type: string)=>  {
    let epsgs = getEpsgRange(type as any)
    let result = [];
    for(let epsg of epsgs) {
        result.push({
            value: epsg,
            label: epsg
        })
    }
    return result
}
const epsgOptions = computed(() => [{
    value: t('sources.wms.beijing54_3'),
    label: t('sources.wms.beijing54_3'),
    children: getEpsgChild("BEIJING54_3")
},{
    value: t('sources.wms.beijing54_6'),
    label: t('sources.wms.beijing54_6'),
    children: getEpsgChild("BEIJING54_6")
},{
    value: t('sources.wms.xian80_3'),
    label: t('sources.wms.xian80_3'),
    children: getEpsgChild("XIAN80_3")
},{
    value: t('sources.wms.xian80_6'),
    label: t('sources.wms.xian80_6'),
    children: getEpsgChild("XIAN80_6")
},{
    value: t('sources.wms.cgcs2000_3'),
    label: t('sources.wms.cgcs2000_3'),
    children: getEpsgChild("CGCS2000_3")
},{
    value: t('sources.wms.cgcs2000_6'),
    label: t('sources.wms.cgcs2000_6'),
    children: getEpsgChild("CGCS2000_6")
}])

const selectOptions = computed(() => [{
        label: t('sources.wms.beijing54'),
        value: 'beijing54'
    },{
        label: t('sources.wms.xian80'),
        value: 'xian80'
    },{
        label: t('sources.wms.cgcs2000'),
        value: 'cgcs2000'
    }]);

const handleUpdateValue = (val: string)=>{
    param.value.crs = +val.replace("EPSG:", "")
    onChange();
}

const onUpdateSelect = (val: string) => {
    let crs;
    if (val == 'cgcs2000') {
        crs = vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.CGCS2000, props.value.coordxPrefix)?.epsg;
    } else if (val == 'xian80') {
        crs = vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.Xian80, props.value.coordxPrefix)?.epsg;
    } else if (val == 'beijing54') {
        crs = vjmap.transform.getEpsgParam(vjmap.transform.EpsgCrsTypes.Beijing54, props.value.coordxPrefix)?.epsg;
    }
    if (crs) {
        param.value.crs = +crs.replace("EPSG:", "")
        onChange();
    }
}

const onChange = useDebounceFn(() => {
    let res = toRaw(param.value);
    emit("updateValue", res)
}, 200);

const getHref = () => {
   let href = window.location.origin + window.location.pathname;
   if (href.indexOf("visual") >= 0) {
      href = href.replace("app/visual", "demo");
      href = href.replace("visual", "demo");
   } else {
      href = "https://vjmap.com/demo/";
   }
   if (locale.value === 'en' && href.indexOf("vjmap.com") >= 0) {
      href = href.replace("vjmap.com/", "vjmap.com/en/");
   }
   href += "#/demo/map/web/03webzgetepsg"
   return href;
}

</script>

<style scoped>
.card {
    position: absolute;
    width: 200px;
    height: 300px;
}
</style>