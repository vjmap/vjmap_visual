import vjmap, { type IDrawTool, type Map } from "vjmap";
import {
  selectRotate,
  toBezierCurve,
  deleteCadEntity,
  modifyCadEntity,
  loadDataToDraw,
  MapApp,
  cacheStorage,
  copyCadEntity
} from "@vjmap/common";
import { i18n } from '@/i18n';
const t = (k: string) => i18n.global.t(k);
export const getCmdToolButtons = (tFn: (k: string) => string = t) => [
  { id: "undo", title: tFn('drawUI.undo'), tooltip: tFn('drawUI.undoHint'),
    icon: `M170.666667 682.666667h241.365333l-87.936-87.978667C363.904 525.909333 447.658667 469.333333 554.666667 469.333333c146.602667 0 213.333333 110.592 213.333333 213.333334h85.333333c0-148.437333-102.570667-298.666667-298.666666-298.666667-131.797333 0-235.392 64.469333-292.48 148.821333L170.666667 441.301333V682.666667z`,
  },
  {
    id: "redo",
    title: tFn('drawUI.redo'),
    tooltip: tFn('drawUI.redoHint'),
    icon: "M256 682.666667c0-102.741333 66.730667-213.333333 213.333333-213.333334 107.008 0 190.762667 56.576 230.570667 125.354667L611.968 682.666667H853.333333v-241.365334l-91.562666 91.562667C704.768 448.469333 601.130667 384 469.333333 384c-196.096 0-298.666667 150.229333-298.666666 298.666667h85.333333z",
  },
  {
    id: "trash",
    title: tFn('drawUI.delete'),
    tooltip: tFn('drawUI.deleteHint'),
  },
  {
    id: "scaleRotate",
    title: tFn('drawUI.scaleRotate'),
    tooltip: tFn('drawUI.scaleRotateHint'),
  },
  {
    id: "combine",
    title: tFn('drawUI.combine'),
    tooltip: tFn('drawUI.combineHint'),
  },
  {
    id: "unCombine",
    title: tFn('drawUI.uncombine'),
    tooltip: tFn('drawUI.uncombineHint'),
  },
  {
    id: "splitLine",
    title: tFn('drawUI.splitLine'),
    tooltip: tFn('drawUI.splitLineHint'),
  },
  { id: "cutPolygon", title: tFn('drawUI.splitPolygon'), tooltip: tFn('drawUI.splitPolygonHint') },
  { id: "polygonToPolyline", title: tFn('drawUI.polygonToLine'), tooltip: tFn('drawUI.polygonToLineHint') },
  { id: "toMultiPolygon", title: tFn('drawUI.toMultiPolygon'), tooltip: tFn('drawUI.toMultiPolygonHint') },
  { id: "toBezierCurve", title: tFn('drawUI.toCurve'), tooltip: tFn('drawUI.toCurveHint') },
  { id: "selectRotate", title: tFn('drawUI.multiRotate'), tooltip: tFn('drawUI.multiRotateHint') },
  { id: "hideSelected", title: tFn('drawUI.hideSelected'), tooltip: tFn('drawUI.hideSelected') },
  { id: "showAllFeatures", title: tFn('drawUI.showAll'), tooltip: tFn('drawUI.showAll') },
  { id: "lockedSelected", title: tFn('drawUI.lockSelected'), tooltip: tFn('drawUI.lockHint') },
  { id: "unLockedAllFeatures", title: tFn('drawUI.unlockAll'), tooltip: tFn('drawUI.unlockHint') },
  { id: "deleteAll", title: tFn('drawUI.clearAll'), tooltip: tFn('drawUI.clearAllHint') },
  { id: "save", title: tFn('drawUI.saveToLocal'), tooltip: tFn('drawUI.saveToLocalHint') },
  { id: "load", title: tFn('drawUI.loadFromLocal'), tooltip: tFn('drawUI.loadFromLocalHint') },
  { id: "deleteCadEntity", title: tFn('drawUI.deleteCadEntity'), tooltip: tFn('drawUI.deleteCadEntityHint') },
  { id: "modifyCadEntity", title: tFn('drawUI.modifyCadEntity'), tooltip: tFn('drawUI.modifyCadEntityHint') },
  { id: "copyCadEntity", title: tFn('drawUI.copyCadEntity'), tooltip: tFn('drawUI.copyCadEntityHint') },
];
export const cmdToolButtons = getCmdToolButtons();

export const runToolBarItem = async (
  item: any,
  map: Map,
  draw: IDrawTool,
  getDrawOptions: Function,
  refreshData: Function,
  updateMapStyleObj: any,
  mMap: MapApp
) => {
  if (item.id == "undo") {
    draw.undo();
  } else if (item.id == "redo") {
    draw.redo();
  } else if (item.id == "trash") {
    draw.trash();
  } else if (item.id == "scaleRotate") {
    draw.changeMode("scaleRotateMode");
  } else if (item.id == "combine") {
    draw.combineFeatures();
  } else if (item.id == "unCombine") {
    draw.uncombineFeatures();
  } else if (item.id == "splitLine") {
    draw.changeMode("splitLineMode");
  } else if (item.id == "cutPolygon") {
    draw.changeMode("cutPolygonMode");
  } else if (item.id == "toMultiPolygon") {
    draw.doAction("toMultiPolygon");
  } else if (item.id == "polygonToPolyline") {
    const sels = draw.getSelectedIds();
    if (sels.length == 0) return;
    const ents = draw.getAll();
    for (let i = 0; i < sels.length; i++) {
      const idx = ents.features.findIndex((f) => f.id == sels[i]);
      if (idx == -1) continue;
      const feature = ents.features[idx];
      if (feature.geometry.type != "Polygon") continue;
      feature.geometry.type = "LineString";
      // @ts-ignore
      feature.geometry.coordinates = feature.geometry.coordinates[0];
    }
    const newEnts = vjmap.cloneDeep(ents);
    draw.deleteAll();
    draw.set(newEnts);
  } else if (item.id == "toBezierCurve") {
    toBezierCurve(map, draw);
  } else if (item.id == "selectRotate") {
    selectRotate(map, draw, getDrawOptions(), window.$message.info);
  } else if (item.id == "hideSelected") {
    const sels = draw.getSelectedIds();
    if (sels.length == 0) return;
    for (const featureId of sels) {
      draw.setFeatureProperty(featureId, "isOff", true); // isOff属性设置为true，即为隐藏了
    }
    draw.changeMode("simple_select");
  } else if (item.id == "showAllFeatures") {
    const ents = draw.getAll();
    if (ents.features.length == 0) return;
    for (const feature of ents.features) {
      // @ts-ignore
      draw.setFeatureProperty(feature.id, "isOff", undefined); // isOff属性移除了。默认就是显示
    }
    // 刷新下
    draw.forceRefresh();
  } else if (item.id == "lockedSelected") {
    const sels = draw.getSelectedIds();
    if (sels.length == 0) return;
    for (const featureId of sels) {
      draw.setFeatureProperty(featureId, "isLocked", true);
    }
    draw.changeMode("simple_select");
  } else if (item.id == "unLockedAllFeatures") {
    const ents = draw.getAll();
    if (ents.features.length == 0) return;
    for (const feature of ents.features) {
      // @ts-ignore
      draw.setFeatureProperty(feature.id, "isLocked", undefined); //属性移除了。默认就是不锁定
    }
    draw.changeMode("simple_select");
  } else if (item.id == "deleteAll") {
    window.$dialog.warning({
      title: t('drawUI.confirmTitle'),
      content: t('drawUI.confirmClearAll'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: () => {
        draw.deleteAll(); // 不能撤销还原
        refreshData();
      },
    });
  } else if (item.id == "save") {
    let entsJson = draw.getAll();
    // 转成地理坐标
    entsJson = map.fromLngLat(entsJson);
    const curParam = map.getService().currentMapParam() || {};
    // 用地图的mapid和版本号做为key值，把数据保存起来，这里演示只是做数据保存到了localStorage,实际中请保存至后台数据库中
    const key = `map_drawdata_${curParam.mapid}_${curParam.version}${map
      .getService()
      .getCurWorkspaceName()}`;
    await cacheStorage.setValueByKey(key, entsJson, true)
    window.$message.info(t('drawUI.saveSuccess'));
  } else if (item.id == "load") {
    // 用地图的mapid和版本号做为key值, 这里演示只是从localStorage去加载,实际中请从后台去请求数据加载
    const curParam = map.getService().currentMapParam() || {};
    const key = `map_drawdata_${curParam.mapid}_${curParam.version}${map
      .getService()
      .getCurWorkspaceName()}`;
    const data = await cacheStorage.getValueByKey(key, false) as string;
    if (data && data != "") {
      const load = async () => {
        try {
          loadDataToDraw(map, draw, data, updateMapStyleObj)
          window.$message.info(t('drawUI.loadSuccess'));
        } catch (error) {
          window.$message.error(error as any);
        }
      };
      if (draw.getAll().features.length > 0) {
        window.$dialog.warning({
          title: t('drawUI.confirmTitle'),
          content: t('drawUI.confirmLoad'),
          positiveText: t('common.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: () => {
            load();
          },
        });
      } else {
        load();
      }
    }
  } else if (item.id == "deleteCadEntity") {
    deleteCadEntity(map, draw, updateMapStyleObj,  window.$message.info, async (content: string) => {
      return new Promise((resolve) => {
        window.$dialog.warning({
          title: t('drawUI.confirmTitle'),
          content: content,
          positiveText: t('common.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: () => {
            resolve(true);
          },
          onNegativeClick: async () => {
            resolve(false);
          },
          onClose: () => {
            resolve(false);
          },
        });
      })
    }, mMap?.keyEvent?.isShiftKey());
  } else if (item.id == "modifyCadEntity") {
    await modifyCadEntity(map, draw, updateMapStyleObj,  window.$message.info, async (content: string) => {
      return new Promise((resolve) => {
        window.$dialog.warning({
          title: t('drawUI.confirmTitle'),
          content: content,
          positiveText: t('common.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: () => {
            resolve(true);
          },
          onNegativeClick: async () => {
            resolve(false);
          },
          onClose: () => {
            resolve(false);
          },
        });
      })
    }, mMap?.keyEvent?.isShiftKey());
    if (refreshData) refreshData()
  } else if (item.id == "copyCadEntity") {
    await copyCadEntity(map, draw, updateMapStyleObj,  window.$message.info, async (content: string) => {
      return new Promise((resolve) => {
        window.$dialog.warning({
          title: t('drawUI.confirmTitle'),
          content: content,
          positiveText: t('common.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: () => {
            resolve(true);
          },
          onNegativeClick: async () => {
            resolve(false);
          },
          onClose: () => {
            resolve(false);
          },
        });
      })
    }, mMap?.keyEvent?.isShiftKey());
    if (refreshData) refreshData()
  }
};
