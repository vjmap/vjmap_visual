<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-message-provider>
     <n-layout class="layout">
       <n-layout-header class="layout-header">
         <HeaderView @onTheme="onTheme"/>
       </n-layout-header>
       <n-layout-content class="layout-content">
          <RouterView />
       </n-layout-content>
     </n-layout>
  </n-message-provider>
 </n-config-provider>
 <Message></Message>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { RouterView } from 'vue-router'
import { darkTheme, zhCN, enUS, dateZhCN, dateEnUS } from 'naive-ui'
import HeaderView from "@/views/HeaderView.vue"
import { useAppStore } from "@/stores/app";
import Message from "@/components/Message.vue";
import type { BuiltInGlobalTheme } from "naive-ui/es/themes/interface";
import type { GlobalThemeOverrides } from "naive-ui";
import formCreate from "@form-create/naive-ui"
import FormGroup from '@/components/FormGroup'
import TableComp from "@/components/TableComp.vue";
import MonacoEditor from "@/components/MonacoEditor.vue";
import ExprComp from '@/components/ExprComp'
import { i18n } from '@/i18n'
formCreate.component('tableComp', TableComp);
formCreate.component('formGroup', FormGroup);
formCreate.component('monacoEditor', MonacoEditor);
formCreate.component('exprComp', ExprComp);
const app = useAppStore();
const theme = ref<BuiltInGlobalTheme | null>(app.lightTheme ? null : darkTheme);

const naiveLocale = computed(() => (app.locale === 'en' ? enUS : zhCN));
const naiveDateLocale = computed(() => (app.locale === 'en' ? dateEnUS : dateZhCN));

const themeOverrides = computed<GlobalThemeOverrides>(() => ({}));

onMounted(() => {
  i18n.global.locale.value = app.locale;
});

const onTheme = () => {
   if(theme.value === null) {
     theme.value = darkTheme;
     app.setTheme(false);
     return
   }
   theme.value = null
   app.setTheme(true);
 }
</script>


<style lang="scss" scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .layout-header {
    flex: none;
    height: 34px;
  }
  .layout-content {
    flex: 1;
  }
}

</style>
