import { shallowRef } from 'vue';
import vjmap from 'vjmap';
import type MapApp from '~/MapApp';
import type { EditorUi } from '@/lib/ui/editorUI';
import { i18n } from '@/i18n';
import TileSourcePanel from '../TileSourcePanel.vue'
import ImageSourcePanel from '../ImageSourcePanel.vue'
import VideoSourcePanel from '../VideoSourcePanel.vue'
import WmsSourcePanel  from '../wmsSource/WmsSourcePanel.vue'
const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params);
export const showTileSourcePanel = (mapApp: MapApp, uiApp: EditorUi, isVerctor: boolean, item?: any, refreshSources?: Function) => {
    const mapSources = mapApp.sources || [];
    const nameEn = isVerctor ? 'vector' : 'raster';
    const title = isVerctor ? t('sources.tileSettingVector') : t('sources.tileSettingRaster');
    // @ts-ignore
    const sourceData = item ? mapSources[item.index].source : undefined;
    uiApp.showFloatPane(nameEn + "_source", title, {
      component: shallowRef(TileSourcePanel),
      props: {
        data: {
            id: item ? item.id : undefined,
            ...sourceData
        },
        isVector: isVerctor
      },
      listeners: {
        onOK: async (comp: any) => {
          // eslint-disable-next-line prefer-const
          let { data } = comp.getResult();
          if (!data) return;
          if (item) {
            const sid = data.id;
            delete data.id;
            await mapApp.setSourceData(sid, data, true);
          } else {
            // 新增
            const sid = (data.id ? data.id : nameEn + "_" + vjmap.RandomID(8));
            delete data.id;
            if (!await mapApp.addSource({
              id: sid,
              tag: nameEn,
              source: {
                ...data,
                type: nameEn
              }
            }, true)) {
              window.$message.error(t('sources.sourceIdExists', { id: sid }));
              return;
            }
          }
          if (refreshSources) refreshSources();
        }
      }
    })
  }


  export const showImageSourcePanel = (mapApp: MapApp, uiApp: EditorUi, item?: any, refreshSources?: Function) => {
    const mapSources = mapApp.sources || [];
    // @ts-ignore
    const sourceData = item ? mapSources[item.index].source : undefined;
    uiApp.showFloatPane("image_source", t('sources.imageSourceSetting'), {
      component: shallowRef(ImageSourcePanel),
      props: {
        data: {
            id: item ? item.id : undefined,
            ...sourceData
        }
      },
      listeners: {
        onOK: async (comp: any) => {
          // eslint-disable-next-line prefer-const
          let { data } = comp.getResult();
          if (!data) return;
          if (item) {
            const sid = data.id;
            delete data.id;
            await mapApp.setSourceData(sid, data, true);
          } else {
            // 新增
            const sid = (data.id ? data.id : "image_" + vjmap.RandomID(8));
            delete data.id;
            if (!await mapApp.addSource({
              id: sid,
              tag: "image",
              source: {
                ...data,
                type: "image"
              }
            }, true)) {
              window.$message.error(t('sources.sourceIdExists', { id: sid }));
              return;
            }
          }
          if (refreshSources) refreshSources();
        }
      }
    })
  }

  
  export const showVideoSourcePanel = (mapApp: MapApp, uiApp: EditorUi, item?: any, refreshSources?: Function) => {
    const mapSources = mapApp.sources || [];
    // @ts-ignore
    const sourceData = item ? mapSources[item.index].source : undefined;
    uiApp.showFloatPane("video_source", t('sources.videoSourceSetting'), {
      component: shallowRef(VideoSourcePanel),
      props: {
        data: {
            id: item ? item.id : undefined,
            ...sourceData
        }
      },
      listeners: {
        onOK: async (comp: any) => {
          // eslint-disable-next-line prefer-const
          let { data } = comp.getResult();
          if (!data) return;
          if (item) {
            const sid = data.id;
            delete data.id;
            await mapApp.setSourceData(sid, data, true);
          } else {
            // 新增
            const sid = (data.id ? data.id : "video_" + vjmap.RandomID(8));
            delete data.id;
            if (!await mapApp.addSource({
              id: sid,
              tag: "video",
              source: {
                ...data,
                type: "video"
              }
}, true)) {
              window.$message.error(t('sources.sourceIdExists', { id: sid }));
              return;
            }
          }
          if (refreshSources) refreshSources();
        }
      }
    })
  }



export const showWmsSourcePanel = async (mapApp: MapApp, uiApp: EditorUi, item?: any, refreshSources?: Function) => {
  const idx = item ? mapApp.sources.findIndex((s) => s.id === item.id) : -1;
    const res = await uiApp.showModalAsync("wmsSource", t('sources.wmsOverlayTitle'), {
        component: WmsSourcePanel,
        props: {
            positiveText: t('common.confirm'),
            negativeText: t('common.cancel'),
            bodyStyle: {
              position: 'fixed',
                left: '0px',
                top: '0px',
                right: '0px',
                bottom: '0px',
                width: "100%",
                height: "100%",
            },
            mapOptions: {
                bearing: 0,
                pitch: 0
            },
            mapOpenOptions: {
                style: {
                    backcolor: mapApp.getConfig().mapOpenOptions?.style?.backcolor ?? 0
                }
            },
            value: idx >= 0 ? mapApp.sources[idx]: {}
        }
    })
    if (res.isOk) {
        const data = res.result;
        if (item) {
          await mapApp.setSourceData(item.id, data, true);
        } else {
          // 新增
          const sid = "wms_" + vjmap.RandomID(8);
          if (!await mapApp.addSource({
            id: sid,
            tag: "wms",
            wms: data.wms,
            source: {
              ...data.source
            }
          }, true)) {
            window.$message.error(t('sources.sourceIdExists', { id: sid }));
            return;
          }
        }
        if (refreshSources) refreshSources();
    }
}
