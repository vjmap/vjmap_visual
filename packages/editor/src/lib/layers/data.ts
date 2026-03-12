import type MapApp from '~/MapApp';
import { i18n } from '@/i18n';
const t = (key: string) => i18n.global.t(key);
export default (data: any, form: any, mapApp: MapApp, disableSourceLayer?: boolean, disableTimerUpdate?: boolean): any => {
    const items: any = [
        {
            type: "InputNumber",
            field: 'minzoom',
            title: t('layers.types.minZoom'),
            collapse: t('layers.types.dataSettings'),
            value: data.minzoom,
            props: {
                min: 0,
                max: 24,
                placeholder: t('layers.types.zoomPlaceholder'),
            }
        },
        {
            type: "InputNumber",
            field: 'maxzoom',
            title: t('layers.types.maxZoom'),
            collapse: t('layers.types.dataSettings'),
            value: data.maxzoom,
            props: {
                min: 0,
                max: 24,
                placeholder: t('layers.types.zoomPlaceholder'),
            }
        },
        {
            type: 'exprComp',
            field: 'filter',
            title: t('layers.types.dataFilter'),
            collapse: t('layers.types.dataSettings'),
            value: data.filter,
            props: {
                childType: "Input",
                onlyExprInput: true,
                hideExprButton: true,
                placeholder: '',
            }
        }
    ]
    if (!disableTimerUpdate) {
        items.push({
            type: 'select',
            field: 'disableTimerUpdate',
            title: t('layers.types.noDynamicUpdate'),
            collapse: t('layers.types.dataSettings'),
            value: data.disableTimerUpdate,
            options: [{
                label: "",
                value: undefined
            },{
                label: t('layers.types.yes'),
                value: true
            },{
                label: t('layers.types.no'),
                value: false
            }],
        })
    }
    if (!disableSourceLayer) {
        items.push({
            type: 'input',
            field: 'sourceLayer',
            title: t('layers.types.sourceLayer'),
            collapse: t('layers.types.dataSettings'),
            value: data.sourceLayer,
            props: {
                placeholder: '',
            }
        })
    }
    return items;
}
