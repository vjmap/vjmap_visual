import type MapApp from '~/MapApp';
import { i18n } from '@/i18n';
const t = (key: string) => i18n.global.t(key);
export default (data: any, form: any, mapApp: MapApp): any => {
    return [
        {
            type: 'input',
            field: 'layerId',
            title: t('layers.types.layerId'),
            value: data.layerId,
            collapse: t('layers.types.commonSettings'),
            props: {
                placeholder: '',
                disabled: true
            }
        },
        {
            type: 'input',
            field: 'sourceId',
            title: t('layers.types.dataSource'),
            collapse: t('layers.types.commonSettings'),
            value: data.sourceId,
            props: {
                placeholder: '',
                disabled: true
            }
        }
    ]
}