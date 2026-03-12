import { createApp } from 'vue'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import store from './stores'
import { i18n, resolveInitialLocale } from './i18n'
import { useAppStore } from './stores/app'

const initialLocale = resolveInitialLocale()
const appStore = useAppStore(store)

appStore.setLocale(initialLocale)
i18n.global.locale.value = initialLocale

const app = createApp(App)
app.use(i18n)
app.use(naive)
app.use(store)
app.use(router)

app.mount('#app')
