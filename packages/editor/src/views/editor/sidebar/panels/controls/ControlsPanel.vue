<template>
    <n-scrollbar :style="scrollStyle">
        <n-space vertical>
            <n-card>
                <n-form :model="model">
                    {{ t('controls.label') }}:
                    <n-dynamic-input v-model:value="model.controlValue" item-style="margin-bottom: 0;"
                        :on-create="onCreate" #="{ index, value }">
                        <div  class="dataitem" >
                            <div style="display: flex;">
                                <span class="dataitem" style="width:40px;">{{ t('controls.name') }}</span>
                                <n-select  class="dataitem" placeholder="" v-model:value="model.controlValue[index].name" :options="nameOptions" />
                            </div>
                            <div style="display: flex;">
                                <span  class="dataitem"  style="width:40px;">{{ t('controls.position') }}</span>
                                <n-select  class="dataitem"  placeholder="" v-model:value="model.controlValue[index].position" :options="positionOptions" />
                            </div>
                            <div style="display: flex;">
                                <span  class="dataitem"  style="width:40px;">{{ t('controls.options') }}</span>
                                <n-tooltip :style="{ maxWidth: '800px' }" trigger="hover">
                                    <template #trigger>
                                        <n-input v-model:value="model.controlValue[index].options"
                                            :placeholder="t('controls.optionsPlaceholder')" @keydown.enter.prevent class="dataitem"
                                            clearable />
                                    </template>
                                    {{ model.controlValue[index].options }}
                                </n-tooltip>
                            </div>
                        </div>
                    </n-dynamic-input>
                </n-form>
            </n-card>
        </n-space>
    </n-scrollbar>
</template>

<script setup lang="ts">
import type { editorContext } from "@/types";
import { useDebounceFn, useResizeObserver } from '@vueuse/core';
import { inject, reactive, ref, toRaw, watch, computed } from "vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { mapApp } = inject<editorContext>('editorContext') as editorContext;
const scrollStyle = reactive({ maxHeight: '500px' });
useResizeObserver(document.body, (entries) => {
    scrollStyle.maxHeight = (entries[0].contentRect.height - 90) + 'px';
});
let controlValue = mapApp.config.controls || [];
if (controlValue.length == 0) {
    controlValue.push({
        name: "",
        position: "",
        options: ""
   });
}
const model = ref({
    controlValue: controlValue
})
const nameOptions = computed(() => [{
    label: t('controls.navBar'),
    value: "NavigationControl"
}, {
    label: t('controls.mousePosition'),
    value: "MousePositionControl"
}, {
    label: t('controls.scale'),
    value: "ScaleControl"
}, {
    label: t('controls.fullscreen'),
    value: "FullscreenControl"
}, {
    label: t('controls.miniMap'),
    value: "MiniMapControl"
}, {
    label: t('controls.draw'),
    value: "DrawTool"
}, {
    label: t('controls.custom'),
    value: "Custom"
}])
const positionOptions = computed(() => [{
    label: t('controls.topLeft'),
    value: "top-left"
}, {
    label: t('controls.bottomLeft'),
    value: "bottom-left"
}, {
    label: t('controls.topRight'),
    value: "top-right"
}, {
    label: t('controls.bottomRight'),
    value: "bottom-right"
}])

const onCreate = () => {
    return {
        name: '',
        position: '',
        options: ""
    }
}
watch(
    () => model,
    () => {
        onChange()
    },
    { deep: true}
)

const onChange = useDebounceFn(() => {
    let controls = toRaw(model.value.controlValue);
    mapApp.config.controls = controls.filter(c => c.name && c.position)
    mapApp.addControls();
}, 500);
</script>

<style scoped>
.dataitem {
    margin-top: 8px;
}
</style>