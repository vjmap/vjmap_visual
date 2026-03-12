<template>
     <n-space vertical>
        {{ t('sources.videoUrlLabel') }}
        <n-dynamic-input v-model:value="urls" :placeholder="t('sources.videoUrlPlaceholder')"
            show-sort-button :min="1" :max="10" />
        {{ t('sources.videoBoundsLabel') }}
        <n-input v-model:value="coordinates" :placeholder="t('sources.videoBoundsPlaceholder')">
            <template #suffix>
                <n-button @click="pickCoordinates">{{ t('sources.pickVideoBounds') }}</n-button>
            </template>
        </n-input>
    </n-space>
</template>

<script setup lang="ts">
import type { editorContext } from "@/types";
import { inject, reactive, ref, toRaw } from "vue";
import { useI18n } from 'vue-i18n';
import { pickMapImageCoordinates } from "@/lib/map/pick";
const { t } = useI18n();
const { mapApp, uiApp } = inject<editorContext>('editorContext') as editorContext;

const props = defineProps({
    data: {
        type: Object,
        required: false,
        default: () => {
            return {
            }
        }
    }
});
const urls = ref(props.data.urls ?? ['']);
const coordinates = ref(props.data.coordinates ? JSON.stringify(props.data.coordinates, null, 0) : '');
const getVideoUrls = () => urls.value.filter((u: any) => !!u)
const pickCoordinates = async () => {
    let videoUrls = getVideoUrls();
    if (videoUrls.length == 0) {
        window.$message.error(t('sources.pleaseInputVideoUrl'))
        return;
    }
    let res = await pickMapImageCoordinates(mapApp, uiApp, "video_pickImageCoordinates", t('sources.pickVideoBoundsPrompt'), 
    "video", toRaw(videoUrls), toRaw(coordinates.value));
    if (res) {
        coordinates.value = res;
    }
}

const getResult = () => {
    let data: any = {};
    if (coordinates.value) {
        data.coordinates = JSON.parse(coordinates.value);
    } else {
        window.$message.error(t('sources.noCoordinates'))
        return {};
    }
    let videoUrls = getVideoUrls();
    if (videoUrls.length == 0) {
        window.$message.error(t('sources.noVideoUrl'))
        return {};
    } else {
        data.urls = videoUrls;
    }
    return {
        data: toRaw(data)
    }
}
// 如果对话框要返回值，则必须导出此方法
defineExpose({
    getResult
})
</script>