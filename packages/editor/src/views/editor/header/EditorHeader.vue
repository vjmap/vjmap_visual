<template>
    <n-space justify="space-between" class="editor-header">
        <n-space :size="25">
            <n-tooltip v-for="item in leftButtons" :key="item.id">
                <template #trigger>
                    <n-button size="small" ghost :type="item.type ?? 'primary'" @click="item.click">
                        <template #icon>
                            <n-icon :color="item.color ?? '#51d6a9'">
                                <component :is="item.icon"></component>
                            </n-icon>
                        </template>
                    </n-button>
                </template>
                {{ item.tooltip ?? '' }}
            </n-tooltip>
        </n-space>
        <n-space justify="center" :size="25">
            <n-tooltip v-for="item in middleButtons" :key="item.id">
                <template #trigger>
                    <n-button v-if="item.icon" size="small" ghost :type="item.type ?? 'primary'" @click="item.click">
                        <template #icon>
                            <n-icon :color="item.color ?? '#51d6a9'">
                                <component :is="item.icon"></component>
                            </n-icon>
                        </template>
                    </n-button>
                    <n-button v-else size="small" ghost :type="item.type ?? 'primary'" @click="item.click">
                        {{ item.title }}
                    </n-button>
                </template>
                {{ item.tooltip ?? '' }}
            </n-tooltip>
        </n-space>
        <n-space justify="end" :size="25">
            <n-tooltip v-for="item in rightButtons" :key="item.id">
                <template #trigger>
                    <n-button size="small" ghost :type="item.type ?? 'primary'" @click="item.click">
                        <template #icon>
                            <n-icon :color="item.color ?? '#51d6a9'">
                                <component :is="item.icon"></component>
                            </n-icon>
                        </template>
                    </n-button>
                </template>
                {{ item.tooltip ?? '' }}
            </n-tooltip>
        </n-space>
    </n-space>
</template>

<script setup lang="ts">
import type { ButtonIconItem, editorContext } from '@/types';
import { Home, Code, ServerOutline, Scan, CloudUploadOutline, Navigate, Refresh } from '@vicons/ionicons5'
import { inject, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MapConfigJson from '../map/MapConfigJson.vue';
import Storage, { IndexDbStorage } from '@/lib/storage'
import { getFormInput } from '@/lib/ui/form'
import router from '@/router';
import { APP_VISUAL_KEY } from '@/stores/app';
import vjmap from 'vjmap';
import { exportProject } from '@/lib/export';

const { t } = useI18n();
const { uiApp, mapApp } = inject<editorContext>('editorContext') as editorContext;

const leftButtons = computed<ButtonIconItem[]>(() => [
    {
        id: 'home',
        icon: Home,
        tooltip: t('editorHeader.backHome'),
        click: () => router.push("/"),
    },
]);

const middleButtons = computed<ButtonIconItem[]>(() => [
    {
        id: 'zoomToExtent',
        icon: Scan,
        tooltip: t('editorHeader.zoomToExtent'),
        click: () => { mapApp?.map.fitMapBounds(); },
    },
    {
        id: 'refresh',
        icon: Refresh,
        tooltip: t('editorHeader.refresh'),
        click: async () => {
            await mapApp.setConfig();
            mapApp.map?.resize();
        },
    },
    {
        id: 'preview',
        icon: Navigate,
        tooltip: t('editorHeader.preview'),
        click: async () => {
            let mapConfig = mapApp.getConfig();
            const key = "tmp_preview";
            const data = {
                key: key,
                title: mapConfig.title ?? '',
                mapid: mapConfig.mapOpenOptions?.mapid,
                version: mapConfig.mapOpenOptions?.version,
                thumbnail: mapConfig?.thumbnail,
                config: IndexDbStorage.toConfigStr(mapConfig)
            };
            await Storage.upsert(data);
            const url = router.resolve({ path: `/preview` });
            window.open(`${url.href}?key=${key}&isLocal=true`);
        },
    },
    {
        id: 'exportHtml',
        title: "html",
        tooltip: t('editorHeader.exportHtml'),
        click: async () => {
            await exportProject("download/html.zip", "config.js", "program.js", mapApp.config);
        },
    },
    {
        id: 'exportVue3',
        title: "vue3",
        tooltip: t('editorHeader.exportVue3'),
        click: async () => {
            await exportProject("download/vue3.zip", "packages/vue3/src/data/config.ts", "packages/vue3/src/lib/program.ts", mapApp.config);
        },
    },
    {
        id: 'exportVue2',
        title: "vue2",
        tooltip: t('editorHeader.exportVue2'),
        click: async () => {
            await exportProject("download/vue2.zip", "packages/vue2/src/data/config.js", "packages/vue2/src/lib/program.js", mapApp.config);
        },
    },
    {
        id: 'exportReact',
        title: "react",
        tooltip: t('editorHeader.exportReact'),
        click: async () => {
            await exportProject("download/react.zip", "packages/react/src/data/config.ts", "packages/react/src/lib/program.ts", mapApp.config);
        },
    },
]);

const rightButtons = computed<ButtonIconItem[]>(() => [
    {
        id: 'mapConfig',
        icon: Code,
        tooltip: t('editorHeader.mapConfig'),
        click: async () => {
            let res = await uiApp.showModalAsync("mapconfig", t('editorHeader.mapConfig'), {
                component: MapConfigJson,
                props: { width: '800px', height: '600px' }
            });
            if (res.isOk) {
                mapApp.setConfig(res.result);
            }
        },
    },
    {
        id: 'saveMapCfgToIndexDb',
        icon: ServerOutline,
        tooltip: t('editorHeader.saveToLocal'),
        click: async () => { saveData(true); },
    },
    {
        id: 'saveMapCfgToCloudServer',
        icon: CloudUploadOutline,
        tooltip: t('editorHeader.saveToServer'),
        click: async () => { saveData(false); },
    },
]);

const saveData = async (isLocal?: boolean) => {
    try {
        let mapConfig = mapApp.getConfig();
        if (!mapConfig.title) {
            let res = await getFormInput(uiApp, t('editorHeader.promptSaveName'), {
                rule: [{
                    type: 'input',
                    field: 'title',
                    title: t('editorHeader.name'),
                    value: '',
                    props: {
                        placeholder: t('editorHeader.placeholderProjectName'),
                    }
                }]
            }, null, '300px', '200px');
            if (!res.isOk) {
                return;
            }
            mapConfig.title = res.result.title;
        }
        mapApp.projectKey = mapApp.projectKey || IndexDbStorage.guid();
        const data = {
            key: mapApp.projectKey,
            title: mapConfig.title ?? '',
            mapid: mapConfig.mapOpenOptions?.mapid,
            version: mapConfig.mapOpenOptions?.version,
            thumbnail: mapConfig?.thumbnail,
            config: IndexDbStorage.toConfigStr(mapConfig)
        }
        if (isLocal) {
            await Storage.upsert(data);
            window.$message.success(t('editorHeader.saveToLocalSuccess'));
        } else {
            let keyInfo = APP_VISUAL_KEY + data.key;
            // 保存至服务端时，如果图有密码保护的，不应该把secretKey保存进去
            let config = vjmap.cloneDeep(mapConfig);
            if (config?.mapOpenOptions?.secretKey) {
                delete config?.mapOpenOptions?.secretKey;
                // @ts-ignore
                delete config?.mapOpenOptions?.tryPasswordCount;
            }
            // 数据和属性分开保存，这样全部获取时只先要获取属性，加载少
            await mapApp.map.getService().saveCustomData(keyInfo, config, {
                key: data.key,
                title: mapConfig.title ?? '',
                mapid: mapConfig.mapOpenOptions?.mapid,
                version: mapConfig.mapOpenOptions?.version,
                thumbnail: mapConfig?.thumbnail,
                workspace: mapConfig?.workspace,
                updatetime: new Date().getTime() + "",
            });
            window.$message.success(t('editorHeader.saveToServerSuccess'));
        }
    } catch (err: any) {
        window.$message.error(JSON.stringify(err));
    }
}
</script>

<style lang="scss" scoped>
</style>
