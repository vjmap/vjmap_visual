<template>
    <n-tabs type="line" animated class="tabs">
        <n-tab-pane name="mapOpen" :tab="t('basemap.tabMapOpen')">
            <MapOpenTab></MapOpenTab>
        </n-tab-pane>
        <n-tab-pane name="mapStyle" :tab="t('basemap.tabMapStyle')">
            <MapStyleTab></MapStyleTab>
        </n-tab-pane>
        <n-tab-pane name="mapOption" :tab="t('basemap.tabMapOption')">
            <MapOptionTab></MapOptionTab>
        </n-tab-pane>
    </n-tabs>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import MapOpenTab from './MapOpenTab.vue';
import MapOptionTab from './MapOptionTab.vue';
import MapStyleTab from './MapStyleTab.vue';

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.tabs {
    padding: 3px;
}
</style>