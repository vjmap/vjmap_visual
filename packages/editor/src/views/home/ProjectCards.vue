<template>
    <n-space vertical class="container">
        <n-space justify="space-between">
            <n-space>
                <n-pagination v-model:page="page" v-model:page-size="pageSize" :page-count="pageCount" show-size-picker
                    :page-sizes="[12, 24, 48, 96]" />
                <n-input-group>
                    <n-input :style="{ width: '50%' }" v-model:value="seachKey" :placeholder="t('home.searchPlaceholder')" size="small" />
                    <n-button type="primary" ghost size="small">
                        {{ t('common.search') }}
                    </n-button>
                </n-input-group>

                <n-radio-group v-model:value="sortType" size="small">
                    <n-radio-button value="updateTime" :label="t('home.sortByUpdateTime')" />
                    <n-radio-button value="projectName" :label="t('home.sortByName')" />
                    <n-radio-button value="mapId" :label="t('home.sortByMapId')" />
                </n-radio-group>

                <n-radio-group v-model:value="sortOrder" size="small">
                    <n-radio-button value="asc" :label="t('home.orderAsc')" />
                    <n-radio-button value="desc" :label="t('home.orderDesc')" />
                </n-radio-group>

                <n-radio-group v-model:value="dataType" size="small">
                    <n-radio-button value="all" :label="t('home.dataAll')" />
                    <n-radio-button value="server" :label="t('home.dataServer')" />
                    <n-radio-button value="local" :label="t('home.dataLocal')" />
                </n-radio-group>

            </n-space>
            <n-space>
                <n-button type="info" round size="medium" @click="createNew">
                    {{ t('home.newProject') }}
                </n-button>
            </n-space>
        </n-space>
        <n-scrollbar :style="scrollStyle" trigger="none">
            <n-space>
                <n-card size="small" v-for="card in curPageProjectCards" :key="card.id" class="card">
                    <n-image class="img" preview-disabled width="200" height="200" object-fit="fill"
                        :src="card.thumbnail || requireUrl('projectThumbnail.png')" :fallback-src="emptyImage"
                        @click="editHandle(card, !card.isServerData)" />
                    <template #action>
                        <n-space vertical>
                            <n-space justify="space-between">
                                <n-ellipsis style="max-width: 150px; width:150px">
                                    {{ card.title }}
                                </n-ellipsis>
                                <template v-for="item in fnBtnList" :key="item.key">
                                    <template v-if="item.key === 'select'">
                                        <n-dropdown trigger="hover" placement="bottom" :options="selectOptions"
                                            :show-arrow="true" @select="(key: any) => handleSelect(card, key)">
                                            <n-button size="small">
                                                <template #icon>
                                                    <component :is="item.icon"></component>
                                                </template>
                                            </n-button>
                                        </n-dropdown>
                                    </template>

                                    <n-tooltip v-else placement="bottom" trigger="hover">
                                        <template #trigger>
                                            <n-button size="small" @click="handleSelect(card, item.key)">
                                                <template #icon>
                                                    <component :is="item.icon"></component>
                                                </template>
                                            </n-button>
                                        </template>
                                        {{ item.label }}
                                    </n-tooltip>
                                </template>
                            </n-space>

                            <n-space justify="space-between">
                                <n-tooltip v-if="!!card.server" placement="bottom" trigger="hover">
                                    <template #trigger>
                                        <n-button size="small" :type="card.isServerData ? 'success' : 'tertiary'" secondary
                                            @click="editHandle(card, false)">
                                            {{ t('home.serverData') }}
                                        </n-button>
                                    </template>
                                    {{ t('home.openEditServerData') }}
                                </n-tooltip>
                                <div v-else></div>

                                <n-tooltip v-if="!!card.local" placement="bottom" trigger="hover">
                                    <template #trigger>
                                        <n-button size="small" :type="!card.isServerData ? 'success' : 'tertiary'" secondary
                                            @click="editHandle(card, true)">
                                            {{ t('home.localData') }}
                                        </n-button>
                                    </template>
                                    {{ t('home.openEditLocalData') }}
                                </n-tooltip>
                                <div v-else></div>

                            </n-space>
                        </n-space>

                    </template>
                </n-card>
            </n-space>
        </n-scrollbar>
    </n-space>
    <n-modal v-model:show="showModifyProjectIdModel" preset="dialog" :title="t('home.modifyProjectId')" :positive-text="t('common.confirm')" :negative-text="t('common.cancelAlt')"
        @positive-click="onModifyIdOk">
        <n-space vertical>
            {{ t('home.projectId') }}<n-input v-model:value="selectCard.key" type="text" placeholder="" />
        </n-space>
    </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Storage from '@/lib/storage'
import { h, computed, onMounted, reactive, ref, shallowRef, watch, type Component, toRaw } from 'vue';

const { t } = useI18n();
import { EllipsisHorizontalCircleSharp, BrowsersOutline, Copy, Pencil, Trash } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui';
import { useRouter } from 'vue-router';
import { MapApp } from '~/MapApp';
import { APP_VISUAL_KEY, useAppStore } from "@/stores/app";
import { Service } from 'vjmap';
import { useResizeObserver } from '@vueuse/core';
import { getFormInput } from '@/lib/ui/form';
const app = useAppStore();
const page = ref(1);
const pageSize = ref(app.projectPageSize || 24);
const projectCards = ref<any>([]);
const projectInfos = reactive<any>({});
const seachKey = ref("");
const router = useRouter();
const pageCount = computed(() => Math.ceil(projectCards.value.length / pageSize.value));
function migrateSortOrder(v: string) { return v === "正序" ? "asc" : v === "倒序" ? "desc" : v || "asc"; }
function migrateSortType(v: string) { return v === "更新时间" ? "updateTime" : v === "项目名称" ? "projectName" : v === "图ID" ? "mapId" : v || "updateTime"; }
function migrateDataType(v: string) { return v === "所有数据" ? "all" : v === "服务端" ? "server" : v === "本地" ? "local" : v || "all"; }
const sortOrder = ref(migrateSortOrder(app.projectSortOrder));
const sortType = ref(migrateSortType(app.projectSortType));
const dataType = ref(migrateDataType(app.projectDataType));
const scrollStyle = { maxHeight: (document.body.clientHeight - 95) + 'px' }
const showModifyProjectIdModel = ref(false);
const selectCard = ref({
    key: "",
    oldKey: ""
});
// 处理url获取
const requireUrl = (name: string) => {
    return new URL(`../../assets/images/${name}`, import.meta.url).href
}
useResizeObserver(document.body, (entries) => {
    scrollStyle.maxHeight = (entries[0].contentRect.height - 95) + 'px';
})
const renderIcon = (icon: Component) => {
    return () => {
        return h(NIcon, null, {
            default: () => h(icon)
        })
    }
}
const emptyImage = ref('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAA7EAAAOxAGVKw4bAAADHUlEQVR4nO3UMQEAIAzAMMC/5yFjRxMFvXpn5gBNbzsA2GMAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEGYAEPYB58oE/VhFU1IAAAAASUVORK5CYII=');
interface PropOptions {
    sortType?: String
    sortOrder?: String
    searchKey?: String
}
const listProjects = () => {
    let cards = [];
    let opts: PropOptions = {
        sortType: sortType.value,
        sortOrder: sortOrder.value,
        searchKey: seachKey.value
    }
    let infos = projectInfos.value;


    for (let m of infos) {
        if (seachKey.value) {
            if (m.key.indexOf(seachKey.value) == -1 &&
                m.mapid.indexOf(seachKey.value) == -1 &&
                m.title.indexOf(seachKey.value) == -1) {
                continue;
            }
        }
        cards.push({ ...m });
    }
    if (dataType.value == "server") {
        cards = cards.filter((p: any) => p.server);
        cards = cards.map(c => {
            return {
                ...c,
                ...c.server,
                isServerData: true,
            }
        })
    } else if (dataType.value == "local") {
        cards = cards.filter((p: any) => p.local)
        cards = cards.map(c => {
            return {
                ...c,
                ...c.local,
                isServerData: false,
            }
        })
    }
    if (opts?.sortType == "updateTime") {
        cards.sort((a, b) => {
            if (+a.updatetime > +b.updatetime) {
                return -1;
            }
            if (+a.updatetime < +b.updatetime) {
                return 1;
            }
            return 0;
        });
    } else if (opts?.sortType == "projectName") {
        cards.sort((a, b) => {
            if (a.title < b.title) {
                return -1;
            }
            if (a.title > b.title) {
                return 1;
            }
            return 0;
        });
    } else if (opts?.sortType == "mapId") {
        cards.sort((a, b) => {
            if (a.mapid < b.mapid) {
                return -1;
            }
            if (a.mapid > b.mapid) {
                return 1;
            }
            return 0;
        });
    }
    if (opts?.sortOrder == "desc") {
        projectCards.value = cards.reverse();
    } else {
        projectCards.value = cards;
    }
}

const getProjectInfos = async () => {
    try {
        let localProjectInfos = await Storage.getAll(); // 本地的
        let data: any = {};
        try {
            let svc = new Service(app.serviceUrl, app.accessToken);
            let res = await svc.getCustomDataKeysByPrefix(APP_VISUAL_KEY);
            let keys = res.keys ?? [];
            if (keys.length > 0) {
                data = await svc.getCustomData(keys, { retDataType: "prop" }); // 只获取属性数据
            }
        } catch (err: any) {
            window.$message.error(err)
        }
        let serverInfo = data.props || [];
        localProjectInfos = localProjectInfos || [];
        // 过滤掉临时数据
        localProjectInfos = localProjectInfos.filter(p => p.key.indexOf("tmp_") != 0);
        let allProjects = [];
        for (let i = 0; i < localProjectInfos.length; i++) {
            const idx = serverInfo.findIndex((m: any) => m.key == localProjectInfos[i].key);
            allProjects.push({
                ...localProjectInfos[i],
                local: localProjectInfos[i],
                server: idx != -1 ? serverInfo[idx] : undefined
            })
        }
        for (let i = 0; i < serverInfo.length; i++) {
            if (allProjects.findIndex((m: any) => m.key == serverInfo[i].key) >= 0) continue; // 已存在
            allProjects.push({
                ...serverInfo[i],
                server: serverInfo[i]
            })
        }

        // 如果本地或服务端都有，则哪个更新时间新就用哪个
        for (let i = 0; i < allProjects.length; i++) {
            if (allProjects[i].server && allProjects[i].local) {
                if (+allProjects[i].server.updatetime > +allProjects[i].local.updatetime) {
                    allProjects[i] = {
                        ...allProjects[i],
                        ...allProjects[i].server,
                        isServerData: true
                    }
                } else {
                    allProjects[i] = {
                        ...allProjects[i],
                        ...allProjects[i].local,
                        isServerData: false
                    }
                }
            } else if (allProjects[i].server) {
                allProjects[i].isServerData = true;
            } else {
                allProjects[i].isServerData = false;
            }
        }

        projectInfos.value = allProjects;
    } catch (error: any) {
        window.$message.error(error)
    }
}


const curPageProjectCards = computed(() => {
    let offset = (page.value - 1) * pageSize.value;
    return (offset + pageSize.value >= projectCards.value.length) ? projectCards.value.slice(offset, projectCards.value.length) : projectCards.value.slice(offset, offset + pageSize.value);
});

const refresh = async () => {
    await getProjectInfos();
    listProjects();
}
onMounted(async () => {
    await refresh();
});

watch(seachKey, () => {
    listProjects();
})

watch(sortOrder, () => {
    app.projectSortOrder = sortOrder.value;
    listProjects();
})

watch(sortType, () => {
    app.projectSortType = sortType.value;
    listProjects();
})

watch(dataType, () => {
    app.projectDataType = dataType.value;
    listProjects();
})

watch(pageSize, () => {
    app.projectPageSize = pageSize.value;
})

const createNew = () => {
    router.push("/edit");
}
const fnBtnList = computed(() => [
    {
        label: t('home.more'),
        key: 'select',
        icon: shallowRef(EllipsisHorizontalCircleSharp)
    }
])

const selectOptions = computed(() => [
    {
        label: t('home.previewServer'),
        key: 'previewServer',
        icon: renderIcon(BrowsersOutline)
    },
    {
        label: t('home.copyServer'),
        key: 'copyServer',
        icon: renderIcon(Copy)
    },
    {
        label: t('home.deleteServer'),
        key: 'deleteServer',
        icon: renderIcon(Trash)
    },
    {
        type: 'divider',
        key: 'd1'
    },
    {
        label: t('home.previewLocal'),
        key: 'previewLocal',
        icon: renderIcon(BrowsersOutline)
    },
    {
        label: t('home.copyLocal'),
        key: 'copyLocal',
        icon: renderIcon(Copy)
    },
    {
        label: t('home.deleteLocal'),
        key: 'deleteLocal',
        icon: renderIcon(Trash)
    }, {
        type: 'divider',
        key: 'd2'
    },
    {
        label: t('home.modifyProjectId'),
        key: 'modifyProjectId',
        icon: renderIcon(Pencil)
    }
])

const handleSelect = (card: any, key: string) => {
    switch (key) {
        case 'deleteServer':
            deleteHanlde(card, false)
            break
        case 'deleteLocal':
            deleteHanlde(card, true)
            break
        case 'copyServer':
            copyHandle(card, false)
            break;
        case 'copyLocal':
            copyHandle(card, true)
            break;
        case 'previewServer':
            previewHandle(card, false)
            break;
        case 'previewLocal':
            previewHandle(card, true)
            break;
        case 'modifyProjectId':
            modifyProjectId(card);
            break;
    }
}

const hasData = (card: any, isLocal?: boolean) => {
    if (isLocal && !card.local) {
        window.$message.error(t('home.noLocalData'));
        return false;
    }
    if (!isLocal && !card.server) {
        window.$message.error(t('home.noServerData'));
        return false;
    }
    return true;
}
// 预览处理
const previewHandle = (card: any, isLocal?: boolean) => {
    if (!hasData(card, isLocal)) return;
    const url = router.resolve({
        path: `/preview`,
    });
    // 打开新窗口
    window.open(`${url.href}?key=${card.key}&isLocal=${isLocal ?? false}`);
}

// 删除处理
const deleteHanlde = (card: any, isLocal?: boolean) => {
    if (!hasData(card, isLocal)) return;
    window.$dialog.warning({
        title: t('home.confirmTitle'),
        content: t('home.confirmDeleteContent', { title: card.title, key: card.key }),
        positiveText: t('home.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: async () => {
            if (isLocal) {
                await Storage.deleteRecord(card.key);
            } else {
                let svc = new Service(app.serviceUrl, app.accessToken);
                let keyInfo = APP_VISUAL_KEY + card.key;
                await svc.deleteCustomData(keyInfo);
            }
            refresh();
        }
    })
}

// 编辑处理
const editHandle = (card: any, isLocal?: boolean) => {
    if (!hasData(card, isLocal)) return;
    router.push(`/edit?key=${card.key}&isLocal=${isLocal ?? false}`)
}

// 克隆处理
const copyHandle = async (card: any, isLocal?: boolean) => {
    if (!hasData(card, isLocal)) return;
    let record: any;
    if (isLocal) {
        let records = await Storage.getRecordByKey(card.key);
        if (records.length == 0) return;
        record = records[0];
    } else {
        let svc = new Service(app.serviceUrl, app.accessToken);
        let keyInfo = APP_VISUAL_KEY + card.key;
        let res = await svc.getCustomData(keyInfo, { retDataType: "value" });
        let config = res.data;
        record = {
            ...card,
            config
        }
    }
    record.key = MapApp.guid();
    record.title = (record.title ?? "") + t('home.copySuffix')
    delete record.id;
    delete record.local;
    delete record.server;
    await Storage.upsert(record);
    refresh();
}

const modifyProjectId = async (card: any) => {
    selectCard.value = {
        ...toRaw(card),
        key: card.key,
        oldKey: card.key
    }
    showModifyProjectIdModel.value = true;
}

const onModifyIdOk = async () => {
    let card = toRaw(selectCard.value) as any;
    let oldKey = card.oldKey;
    let newKey = card.key;
    if (oldKey == newKey || !newKey) return;

    try {
        if (card.server) {
            // 如果有服务端数据
            let svc = new Service(app.serviceUrl, app.accessToken);
            let keyInfo = APP_VISUAL_KEY + oldKey;
            let res = await svc.getCustomData(keyInfo);
            // 删除之前的
            const oldKeyInfo = keyInfo;
            // 保存成新的
            keyInfo = APP_VISUAL_KEY + newKey;
            // 数据和属性分开保存，这样全部获取时只先要获取属性，加载少
            await svc.saveCustomData(keyInfo, res.data, {
                ...res.prop,
                key: newKey
            });
            await svc.deleteCustomData(oldKeyInfo);
        }
        if (card.local) {
            let records = await Storage.getRecordByKey(oldKey);
            if (records.length == 0) return;
            let record = records[0];
            await Storage.deleteRecord(oldKey);
            record.key = newKey;
            await Storage.upsert(record);
        }
        refresh();
        window.$message.info(t('home.modifySuccess'));
    } catch (error: any) {
        window.$message.error(error?.response ?? error);
    }

}

</script>

<style lang='scss' scoped>
.container {
    height: 100%;

    .cards {
        width: 100%;
        height: 100%;
        max-height: 100%;
    }

    .img {
        cursor: pointer;
    }
}</style>