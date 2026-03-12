<template>
    <n-scrollbar :style="scrollStyle">
        <n-space vertical>
            <n-card>
                <FormCreate v-model="fApi" ref="form" :rule="rule" :option="option" @change="onChange"></FormCreate>

                <n-space justify="end" v-if="thumbnail != ''">
                    <n-image width="200" :src="thumbnail" />
                </n-space>

                <n-form :model="model">
                    {{ t('settings.imageRes') }}:
                    <n-dynamic-input v-model:value="model.imageResValue" item-style="margin-bottom: 0;"
                        :on-create="onCreate" #="{ index, value }">
                        <div style="margin-top:8px">
                            <div style="display: flex;">
                                <span style="width:40px;margin-top:8px">{{ t('settings.name') }}</span>
                                <n-input v-model:value="model.imageResValue[index].key" :placeholder="t('settings.namePlaceholder')"
                                    @keydown.enter.prevent style="margin-top:3px" clearable />
                            </div>
                            <div style="display: flex;">
                                <span style="width:40px;margin-top:8px">{{ t('settings.path') }}</span>
                                <n-tooltip :style="{ maxWidth: '800px' }" trigger="hover">
                                    <template #trigger>
                                        <n-input v-model:value="model.imageResValue[index].value"
                                            :placeholder="t('settings.pathPlaceholder')" @keydown.enter.prevent
                                            style="margin-top:3px" clearable>
                                            <template #suffix>
                                                <n-dropdown trigger="hover" :show-arrow="true" size="small"
                                                    :options="sysImagesOptions"
                                                    @select="(key: string) => model.imageResValue[index].value = key">
                                                    <n-button size="tiny">{{ t('settings.builtin') }}</n-button>
                                                </n-dropdown>
                                                <n-button size="tiny" style="margin-left:2px"  @click= "() => uploadImage(index)">{{ t('settings.upload') }}</n-button>
                                            </template>
                                        </n-input>
                                    </template>
                                    {{ model.imageResValue[index].value }}
                                </n-tooltip>

                            </div>
                            <div style="display: flex;">
                                <span style="width:40px;margin-top:8px">{{ t('settings.options') }}</span>
                                <n-tooltip :style="{ maxWidth: '800px' }" trigger="hover">
                                    <template #trigger>
                                        <n-input v-model:value="model.imageResValue[index].options"
                                            :placeholder="t('settings.optionsPlaceholder')" @keydown.enter.prevent style="margin-top:3px"
                                            clearable />
                                    </template>
                                    {{ model.imageResValue[index].options }}
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
import formCreate from "@form-create/naive-ui"
import { useDebounceFn, useResizeObserver } from '@vueuse/core';
import { inject, onUnmounted, reactive, ref, toRaw, watch, computed } from "vue";
import { useI18n } from 'vue-i18n';
import html2canvas from 'html2canvas'
import { IndexDbStorage } from "@/lib/storage";
import vjmap from "vjmap";

const { t } = useI18n();
const { mapApp } = inject<editorContext>('editorContext') as editorContext;
const FormCreate = formCreate.$form();
const form = ref<any>(null);
let fApi = reactive<any>({});
const thumbnail = ref(mapApp.config.thumbnail);
const scrollStyle = reactive({ maxHeight: '500px' });
useResizeObserver(document.body, (entries) => {
    scrollStyle.maxHeight = (entries[0].contentRect.height - 90) + 'px';
});
let mapCfgInitImages = JSON.stringify(mapApp.config.mapImages);
const model = ref<any>({
    imageResValue: [...mapApp.config.mapImages || []]
})
const sysImagesOptions = ref(mapApp.getSysImages().map(item => {
    return {
        label: item,
        key: item
    }
}))

const option = reactive({
    form: {
        labelWidth: "auto",
        size: 'small'
    },
    submitBtn: false
});
const onCreate = () => {
    return {
        key: '',
        value: ''
    }
}
const rule = computed(() => [
    {
        type: 'input',
        field: 'title',
        title: t('settings.projectName'),
        value: mapApp.config.title,
        props: {
            placeholder: '',
        }
    },
    {
        type: 'input',
        field: 'title',
        title: t('settings.projectDesc'),
        value: mapApp.config.description,
        props: {
            type: "textarea",
            rows: 2,
            placeholder: '',
        }
    },
    {
        type: 'input',
        field: 'serviceUrl',
        title: t('settings.serviceUrl'),
        value: mapApp.config.serviceUrl,
        props: {
            placeholder: '',
        }
    },
    {
        type: 'input',
        field: 'serviceToken',
        title: t('settings.serviceToken'),
        value: mapApp.config.serviceToken,
        props: {
            placeholder: '',
        }
    },
    {
        type: 'input',
        field: 'workspace',
        title: t('settings.workspaceName'),
        value: mapApp.config.workspace,
        props: {
            placeholder: '',
        }
    },
    {
        type: 'input',
        field: 'accessKey',
        title: t('settings.accessKey'),
        value: mapApp.config.accessKey,
        props: {
            placeholder: t('settings.accessKeyPlaceholder'),
        }
    },
    {
        type: 'input',
        field: 'mapInitBounds',
        title: t('settings.initialBounds'),
        value: mapApp.config.mapInitBounds,
        info: t('settings.initialBoundsInfo'),
        props: {
            placeholder: t('settings.initialBoundsPlaceholder'),
        }
    },
    {
        type: 'input',
        field: 'thumbnail',
        title: t('settings.thumbnailUrl'),
        value: mapApp.config.thumbnail,
        props: {
            placeholder: '',
        },
        suffix: {
            type: 'button',
            children: [t('settings.captureThumbnail')],
            on: {
                click: async() => {
                    try {
                        let pos = await pickMapCapturePoint();
                        if (!pos) return;
                        // @ts-ignore
                        let canvas = await html2canvas(document.getElementById(mapApp.containerId), {
                            useCORS: true,
                            allowTaint: true,
                            x: pos.x,
                            y: pos.y,
                            width: 300,
                            height: 300
                        });
                      
                        mapApp.projectKey = mapApp.projectKey || IndexDbStorage.guid();
                        const base64Data = canvas.toDataURL('image/png', 1)
                        let svc = mapApp.map.getService();
                        const k = "image_visual_" + mapApp.projectKey;
                        await svc.saveCustomData(k, base64Data);
                        let url = `${svc.baseUrl()}dataImage?key=${k}&time=${Date.now()}`;
                        mapApp.config.thumbnail = url;
                        form.value.fapi.setValue({
                            thumbnail: url,
                        });
                    } catch (error: any) {
                        window.$message.error(error);
                    }
                }
            }
        }
    }
]);

// 在地图上拾取要截图的开始像素点
const pickMapCapturePoint = async () => {
    window.$message.info(t('settings.pickCaptureArea'));
    // 先新建一个marker
    let el = document.createElement('div');
    el.className = 'marker';
    el.style.background = '#00ffff77';
    el.style.width = '300px';
    el.style.height = '300px';

    // Add markers to the map.
    let marker = new vjmap.Marker({
        element: el,
        anchor: 'top-left'
    });
    let isAddToMap = false;

    let drawPoint = await vjmap.Draw.actionDrawPoint(mapApp.map, {
        updatecoordinate: (e: any) => {
            // 鼠标移动时回调
            if (!e.lnglat) return;
            marker.setLngLat(e.lnglat)
            if (!isAddToMap) {
                // 第一次回调时，把marker加入地图中
                marker.addTo(mapApp.map);
                isAddToMap = true;
            }
        }
    });
    if (isAddToMap) marker.remove()
    if (drawPoint.cancel) {
        return;// 取消操作
    }
    return mapApp.map.project(marker.getLngLat());
}
const onChange = useDebounceFn(() => {
    let value = toRaw(fApi) as any;
    try {
        mapApp.config.title = value.title;
        mapApp.config.thumbnail = value.thumbnail;
        thumbnail.value = value.thumbnail;
        if (mapApp.config.serviceUrl == value.serviceUrl &&
            mapApp.config.serviceToken == value.serviceToken &&
            mapApp.config.workspace == value.workspace &&
            mapApp.config.accessKey == value.accessKey && 
            mapApp.config.mapInitBounds == value.mapInitBounds) {
            return;
        }
        mapApp.config.serviceUrl = value.serviceUrl;
        mapApp.config.serviceToken = value.serviceToken;
        mapApp.config.workspace = value.workspace;
        mapApp.config.accessKey = value.accessKey;
        mapApp.config.mapInitBounds = value.mapInitBounds;
        mapApp.setConfig();
    } catch (error: any) {
        window.$message.error(error);
    }

}, 1000);


const uploadImage = (index: number) => {
    // 创建一个隐藏的input元素
    const id = "selectImageInput";
    let input = document.getElementById(id) as any;
    if (!input) {
        input = document.createElement("input");
        input.type = "file";
        input.id = id;
        input.style.display = "none";
    }

    // 将input元素添加到DOM中
    document.body.appendChild(input);

    // 添加change事件监听器
    input.addEventListener("change", (event: any) => {
        // @ts-ignore
        if (event.target.files.length == 0) return;
        // @ts-ignore
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.addEventListener('load', () => {
            const base64String = reader.result;
            model.value.imageResValue[index].value = base64String;
        });

        reader.readAsDataURL(file);
    });
    // 模拟点击input元素来打开文件选择器
    input.click();

}

watch(() => model, (newValue, oldValue) => {
    let curImages = JSON.stringify(newValue.value.imageResValue);
    if (curImages != mapCfgInitImages) {
        mapApp.config.mapImages = toRaw(newValue.value.imageResValue);
    }
  }, { deep: true });

onUnmounted(() => {
    let curImages = JSON.stringify(model.value.imageResValue);
    if (curImages != mapCfgInitImages) {
        mapApp.config.mapImages = toRaw(model.value.imageResValue);
        mapApp.addMapImages();
    } else {
        mapApp.config.mapImages = JSON.parse(mapCfgInitImages);
    }
});

</script>