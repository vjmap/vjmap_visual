<template>
    <n-space vertical class="uicontainer">
        <n-card :title="t('queryData.queryParams')" size="small">
            <n-form ref="formRef" :model="model" size="small" label-placement="left">
                <n-grid :cols="24" :x-gap="24">
                    <n-form-item-gi :span="19" :label="t('queryData.condition')">
                        <n-input v-model:value="model.condition" :placeholder="t('queryData.conditionPlaceholder')" type="textarea"
                            :autosize="{ minRows: 3, maxRows: 3 }" clearable />
                    </n-form-item-gi>
                    <n-gi>
                        <n-tooltip>
                        <template #trigger>
                            <n-button size="small" round  type="primary" @click="aiSql"  :loading="loadingSql">
                              {{ t('queryData.aiGenerateSql') }}
                            </n-button>
                        </template>
                        {{ t('queryData.conditionHint') }}
                        </n-tooltip>
                       
                        <n-button size="small" round type="info" @click="sqlCondShowModal = true" style="margin-top: 10px;">
                            {{ t('queryData.addCondition') }}
                        </n-button>
                    </n-gi>
                </n-grid>
                <n-grid :cols="24" :x-gap="24">
                    <n-form-item-gi :span="15" :label="t('queryData.bounds')">
                        <n-input v-model:value="model.bounds" :placeholder="t('queryData.boundsPlaceholder')" clearable />
                    </n-form-item-gi>
                    <n-gi>
                        <n-button round type="info" ghost size="tiny" @click="pickBounds">
                            {{ t('queryData.pickBounds') }}
                        </n-button>
                    </n-gi>
                    <n-gi :offset="3">
                        <n-switch v-model:value="model.isContains" style="width:60px">
                            <template #checked>
                                {{ t('queryData.contain') }}
                            </template>
                            <template #unchecked>
                                {{ t('queryData.intersect') }}
                            </template>
                        </n-switch>
                    </n-gi>
                </n-grid>
                <n-grid :cols="24" :x-gap="24">
                    <n-form-item-gi :span="13" :label="t('queryData.coord')">
                        <n-radio-group v-model:value="model.coordType" name="radiogroup">
                            <n-space>
                                <n-radio :value="0" name="posCoord">{{ t('queryData.posCoord') }}</n-radio>
                                <n-radio :value="1" name="geomCoord">{{ t('queryData.geomCoord') }}</n-radio>
                            </n-space>
                        </n-radio-group>
                    </n-form-item-gi>
                    <n-gi>
                        <n-switch v-model:value="model.clearPropData" style="width:120px">
                            <template #checked>
                                {{ t('queryData.noAttrData') }}
                            </template>
                            <template #unchecked>
                                {{ t('queryData.withAttrData') }}
                            </template>
                        </n-switch>
                    </n-gi>
                    <n-gi :offset="5">
                        <n-button round color="#ff69b4" @click="queryData">
                            {{ t('queryData.queryData') }}
                        </n-button>
                    </n-gi>
                </n-grid>
            </n-form>
        </n-card>
        <n-card :title="t('queryData.queryResult')" size="small">
            <monaco-editor :style="queryJsonStyle" :wordWrap="false" :lineNumbers="true" v-model="queryJson"
                ref="queryJsonEditor"></monaco-editor>
        </n-card>
    </n-space>

    <n-modal v-model:show="sqlCondShowModal" preset="dialog" :title="t('queryData.addSqlCondition')" :positive-text="t('common.confirm')" :negative-text="t('common.cancelAlt')"
        @positive-click="sqlCondSubmitCallback" :style="{ width: '850px' }">
        <FormCreate v-model="sqlCondfApi" ref="sqlCondForm" :rule="sqlCondRule" :option="formOption"></FormCreate>
    </n-modal>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core';
import MonacoEditor from "@/components/MonacoEditor.vue";
import { computed, inject, onUnmounted, reactive, ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import type MapApp from '@vjmap/common';
import { cacheStorage } from '@vjmap/common';
import vjmap, { GeoBounds } from 'vjmap';
import type { Map } from 'vjmap';
import formCreate from "@form-create/naive-ui"
import { clearHighlight, getHighlightEntities } from '@vjmap/common';
const props = defineProps({
    modelValue: {
        type: Object,
        required: true,
        default: () => {}
    }
})
const { t } = useI18n();
const FormCreate = formCreate.$form();
const model = ref({
    condition: '',
    bounds: '',
    isContains: false,
    coordType: 1,
    clearPropData: false,
})
model.value = {...model.value, ...props.modelValue};
const queryJsonEditor = ref()
const queryJsonStyle = reactive({ height: '400px' });
const queryJson = ref('');
useResizeObserver(document.body, (entries) => {
    queryJsonStyle.height = (entries[0].contentRect.height - 400) + 'px';
})
const mMap = inject<MapApp>('interactiveMap');
const map = mMap?.map as Map;

const sqlCondShowModal = ref(false);
let sqlCondfApi = reactive<any>({});
const loadingSql = ref(false)
const pickBounds = async () => {
    window.$message.info(t('queryData.drawBoundsPrompt'));
    clearHighlight(map); // 清除之前高亮的图层
    let actionRect = await vjmap.Draw.actionDrawRectangle(map, {});
    if (actionRect.cancel) {
        return;
    }
    let co = map.fromLngLat(actionRect.features[0].geometry.coordinates[0]);
    model.value.bounds = vjmap.GeoBounds.fromDataExtent(co).toString();

    drawPolygons(map, model.value.bounds);
}

function isSQLCondition(str: string) {
  // 仅进行修剪，不转换大小写
  const input = str.trim();
  
  // 如果为空，则既不是SQL条件也不是自然语言
  if (!input) return false;
  
  // 常见的SQL运算符和关键字（不考虑大小写）
  const sqlOperators = [
    '=', '<>', '!=', '>', '<', '>=', '<=', 
    'like', 'LIKE', 'between', 'BETWEEN', 'in', 'IN', 
    'is null', 'IS NULL', 'is not null', 'IS NOT NULL',
    'and', 'AND', 'or', 'OR', 'not', 'NOT', 
    'exists', 'EXISTS', 'all', 'ALL', 'any', 'ANY'
  ];
  
  const sqlKeywords = [
    'select', 'SELECT', 'where', 'WHERE', 'from', 'FROM', 
    'join', 'JOIN', 'having', 'HAVING', 'group by', 'GROUP BY', 
    'order by', 'ORDER BY', 'union', 'UNION', 'insert', 'INSERT', 
    'update', 'UPDATE', 'delete', 'DELETE'
  ];
  
  // 检查字符串开头是否有SQL关键字（不考虑大小写）
  for (const keyword of sqlKeywords) {
    if (input.toUpperCase().startsWith(keyword.toUpperCase())) return true;
  }
  
  // 检查是否包含常见的SQL运算符（不考虑大小写）
  for (const op of sqlOperators) {
    const pattern = new RegExp(`\\s${op}\\s`, 'i');
    if (pattern.test(input)) return true;
  }
  
  // 检查是否有"字段-值"模式与常见操作符（不考虑大小写）
  const operatorPattern = /\w+\s*(=|<>|!=|>|<|>=|<=|like|in)\s*[\w'"(]/i;
  if (operatorPattern.test(input)) return true;
  
  // 检查常见的SQL函数调用（不考虑大小写）
  const functionPattern = /(count|sum|avg|min|max|len|concat)\s*\(/i;
  if (functionPattern.test(input)) return true;
  
  // 检查表.列表示法，这在SQL中很常见（不考虑大小写）
  const tableColumnPattern = /\w+\.\w+/;
  if (tableColumnPattern.test(input)) return true;
  
  // 检查SQL注释
  if (input.includes('--') || input.includes('/*')) return true;
  
  // 如果没有匹配项，假设它是自然语言
  return false;
}


const queryData = async () => {
    if (!model.value.condition && !model.value.bounds) {
        window.$message.warning(t('queryData.inputConditionOrBounds'));
        return
    }
    if (!isSQLCondition(model.value.condition)) {
        window.$message.warning(t('queryData.notSqlClickAi'));
        return
    }
    clearHighlight(map); // 清除之前高亮的图层
    let bounds: any;
    if (model.value.bounds) {
        bounds = vjmap.GeoBounds.fromString(model.value.bounds).toArray();
    }
    let svc = map.getService();
    // 先从缓存中去查询。如果缓存中有，则直接从缓存中获取就可能了
    const cacheKey = {
        ...model.value,
        mapId: svc.currentMapParam()?.mapid,
        version: svc.currentMapParam()?.version,
        workspace: svc.getCurWorkspaceName()
    };
    let geom = await getHighlightEntities(map, bounds, model.value.coordType == 1, {
        condition: model.value.condition ?? '',
        isContains: model.value.isContains
    })
    if (model.value.clearPropData) {
        // 如果不需要属性数据
        geom.features.forEach((f: any) => f.properties = {})
    }
    geom = map.fromLngLat(geom)
    await cacheStorage.setValueByKey(cacheStorage.toStringKey(cacheKey, "query_"), geom, true);
   
    
    queryJsonEditor.value.setValue(JSON.stringify(geom, null, 4));
    window.$message.info(t('queryData.queryCount', { count: geom.features.length }))
}

let drawBounds: any;
const drawPolygons = (map: Map, strBounds?: string) => {
    if (drawBounds) {
        drawBounds.remove();
        drawBounds = null;
    }
    let bounds: any;
    if (strBounds) {
        bounds = vjmap.GeoBounds.fromString(model.value.bounds);
    }
    if (!bounds) return;
    let points = [bounds.toPointArray()];
    points.forEach((p: any) => p.push(p[0]));// 闭合
    let polygons = points.map((p: any) => {
        return {
            points: map.toLngLat(p),
            properties: {
                color: "#f00"
            }
        }
    })
    drawBounds = vjmap.createAntPathAnimateLineLayer(map, polygons, {
        fillColor1: "#f00",
        fillColor2: "#0ffb",
        canvasWidth: 128,
        canvasHeight: 32,
        frameCount: 4,
        lineWidth: 4,
        lineOpacity: 0.2
    });
}
if (model.value.bounds) {
    drawPolygons(map, model.value.bounds);
}
const formOption = reactive({
    form: {
        labelWidth: "100px",
        size: 'small'
    },
    submitBtn: false
});

const numSqlCondOptions = [{
    label: "=",
    value: "="
}, {
    label: "!=",
    value: "!="
}, {
    label: ">",
    value: ">"
}, {
    label: "<",
    value: "<"
}, {
    label: "in",
    value: "in"
}, {
    label: "not in",
    value: "not in"
}, {
    label: "",
    value: ""
}];

const strSqlCondOptions = [{
    label: "=",
    value: "="
}, {
    label: "!=",
    value: "!="
}, {
    label: "like",
    value: "like"
}, {
    label: "not like",
    value: "not like"
}, {
    label: "in",
    value: "in"
}, {
    label: "not in",
    value: "not in"
}, {
    label: "",
    value: ""
}];
const getLayerProps = () => {
    let layers = map.getService().getMapLayers();
    return layers.map(ly => {
        return {
            label: ly.name,
            value: ly.index
        }
    })
}
const getEntnameTypeProps = () => {
    return [{
        label: t('queryData.entityType1'),
        value: "1"
    },
    { label: t('queryData.entityType2'), value: "2" },
    { label: t('queryData.entityType3'), value: "3" },
    { label: t('queryData.entityType4'), value: "4" },
    { label: t('queryData.entityType5'), value: "5" },
    { label: t('queryData.entityType6'), value: "6" },
    { label: t('queryData.entityType7'), value: "7" },
    { label: t('queryData.entityType8'), value: "8" },
    { label: t('queryData.entityType9'), value: "9" },
    { label: t('queryData.entityType10'), value: "10" },
    { label: t('queryData.entityType11'), value: "11" },
    { label: t('queryData.entityType12'), value: "12" },
    { label: t('queryData.entityType13'), value: "13" },
    { label: t('queryData.entityType14'), value: "14" },
    { label: t('queryData.entityType15'), value: "15" },
    { label: t('queryData.entityType16'), value: "16" },
    { label: t('queryData.entityType17'), value: "17" },
    { label: t('queryData.entityType18'), value: "18" },
    { label: t('queryData.entityType19'), value: "19" },
    { label: t('queryData.entityType20'), value: "20" },
    { label: t('queryData.entityType21'), value: "21" },
    { label: t('queryData.entityType22'), value: "22" },
    { label: t('queryData.entityType23'), value: "23" },
    { label: t('queryData.entityType24'), value: "24" },
    { label: t('queryData.entityType25'), value: "25" },
    { label: t('queryData.entityType26'), value: "26" },
    { label: t('queryData.entityType27'), value: "27" }
    ]
}
const sqlCondRule = computed(() => [{
    type: 'select',
    field: 'id',
    title: t('queryData.fieldId'),
    options: numSqlCondOptions,
    value: "",
    col: { span: 8 }
},
{ type: "Input", field: 'id_value', title: t('queryData.value'), value: '', col: { span: 12 }, props: { placeholder: '' } },
{ type: 'switch', field: 'id_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 'objectid', title: t('queryData.fieldObjectid'), options: strSqlCondOptions, value: "", col: { span: 8 } },
{ type: "Input", field: 'objectid_value', title: t('queryData.value'), value: '', info: t('queryData.likeInfo'), col: { span: 12 }, props: { placeholder: '' } },
{ type: 'switch', field: 'objectid_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 'layerindex', title: t('queryData.fieldLayerindex'), options: numSqlCondOptions, value: "", col: { span: 8 } },
{ type: 'select', field: 'layerindex_value', title: t('queryData.value'), options: getLayerProps(), value: "", col: { span: 12 }, props: { placeholder: '', multiple: true } },
{ type: 'switch', field: 'layerindex_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 'name', title: t('queryData.fieldName'), options: strSqlCondOptions, value: "", col: { span: 8 } },
{ type: 'select', field: 'name_value', title: t('queryData.value'), options: getEntnameTypeProps(), value: "", col: { span: 12 }, props: { placeholder: '', multiple: true } },
{ type: 'switch', field: 'name_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 'color', title: t('queryData.fieldColor'), options: numSqlCondOptions, value: "", col: { span: 8 } },
{ type: "Input", field: 'color_value', title: t('queryData.value'), value: '', info: t('queryData.colorInfo'), col: { span: 12 }, props: { placeholder: '' } },
{ type: 'switch', field: 'color_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 's2', title: t('queryData.fieldS2'), options: strSqlCondOptions, value: "", col: { span: 8 } },
{ type: "Input", field: 's2_value', title: t('queryData.value'), value: '', info: t('queryData.likeInfo'), col: { span: 12 }, props: { placeholder: '' } },
{ type: 'switch', field: 's2_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 's3', title: t('queryData.fieldS3'), options: strSqlCondOptions, value: "", col: { span: 8 } },
{ type: "Input", field: 's3_value', title: t('queryData.value'), value: '', info: t('queryData.s3Info'), col: { span: 12 }, props: { placeholder: '' } },
{ type: 'switch', field: 's3_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 's4', title: t('queryData.fieldS4'), options: strSqlCondOptions, value: "", col: { span: 8 } },
{ type: "Input", field: 's4_value', title: t('queryData.value'), value: '', info: t('queryData.s4Info'), col: { span: 12 }, props: { placeholder: '' } },
{ type: 'switch', field: 's4_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 's5', title: t('queryData.fieldS5'), options: strSqlCondOptions, value: "", col: { span: 8 } },
{ type: "Input", field: 's5_value', title: t('queryData.value'), value: '', info: t('queryData.s5Info'), col: { span: 12 }, props: { placeholder: '' } },
{ type: 'switch', field: 's5_cond', title: t('queryData.orAnd'), value: false, info: t('queryData.orAndInfo'), col: { span: 4 } },
{ type: 'select', field: 'n1', title: t('queryData.fieldN1'), options: numSqlCondOptions, value: "", col: { span: 8 } },
{ type: "Input", field: 'n1_value', title: t('queryData.value'), value: '', col: { span: 12 }, props: { placeholder: '' } },
])

const sqlCondSubmitCallback = () => {
    let param = toRaw(sqlCondfApi);
    let sql= "";
    let items = ['id', 'objectid', 'layerindex', 'name', 'color', 's2', 's3', 's4', 's5', 'n1'];
    let lastJoin;
    for(let key of items) {
        let cond = param[key];
        let val = param[key + "_value"];
        let join = param[key + "_cond"];
        if (!cond || !val) continue;
        val = toRaw(val);
        if (Array.isArray(val)) {
            // 如果是数组，则只能于用in和not in。如果不是的话，则只取第一个
            if (!(cond == "in" || cond == "not in")) {
                val = val[0]
                if (typeof val == "string") {
                    val = `"${val}"`
                }
            } else {
                val = JSON.stringify(val, null, 0).replace("[", "(").replace("]", ")")
            }
        } else if (typeof val == "string") {
            val = `"${val}"`
        }
        if (lastJoin) {
            sql += " " + lastJoin + " ";
        }
        sql += ` ${key} ${cond} ${val}`;
        lastJoin = join ? "and" : "or";
    }
    model.value.condition = model.value.condition + " " + sql;
}

onUnmounted(() => {
    if (drawBounds) {
        drawBounds.remove();
        drawBounds = null;
    }
})


function queryMapData(map: Map, sql: string) {
    let layerMap: any = {}, layerNameMap: any = {};
    let layers = map.getService().currentMapParam()?.layers
    if (layers) {
        layers = map.getService().getMapLayers();
        for(let n = 0; n < layers.length; n++) {
            layerMap[layers[n].index] = layers[n].name;
            layerNameMap[layers[n].name] = layers[n].index
        }
    }
    // 实体类型映射字典
    const entityTypeMap: Record<string, any> = {
        'AcDbLine': 1,
        'AcDbPolyline': 2,
        'AcDb2dPolyline': 3,
        'AcDb3dPolyline': 4,
        'AcDbSpline': 5,
        'AcDbArc': 6,
        'AcDbCircle': 7,
        'AcDbEllipse': 8,
        'AcDbCurve': 9,
        'AcDbBlockReference': 10,
        'AcDbHatch': 11,
        'AcDbMText': 12,
        'AcDbText': 13,
        'AcDbShape': 14,
        'AcDbRasterImage': 15,
        'AcDbWipeout': 16,
        'AcDbAttributeDefinition': 26,
        'AcDbAttribute': 27,
        'AcDbTable': 28,
        'AcDbRegion': 30,
        'AcDbPolyFaceMesh': 31,
        'AcDbPolygonMesh': 32,
        'AcDbSurface': 33,
        'AcDb3dSolid': 34,
        'AcDbFace': 35,
        'points': "s3",
        'center': "s3",
        'content': "s4",
        'blockname': "s5",
        'area': "n5",
        'length': "n5",
        'radius': "n7",
        'thickness':"n8",
        'elevation': "n9",
        'isclosed': "n6",
        'textWidth': "n6",
        'textHeight':"n5",
    };

    for(let name in layerNameMap) {
        entityTypeMap[`layername = '${name}'`] = `layerindex = ${layerNameMap[name]}`
        entityTypeMap[`layername = "${name}"`] = `layerindex = ${layerNameMap[name]}`
    }

    

    for (const [srcValue, destValue] of Object.entries(entityTypeMap)) {
        const regex = new RegExp(`${srcValue}`, 'g');
        if (typeof(destValue) == "number") {
            sql = sql.replace(regex, destValue.toString());

        } else {
            sql = sql.replace(regex, destValue);
        }
    }

    let options: Record<string, any> = {};
    
    // 如果sql最后一个字符是分号，则去掉
    sql = sql.trim();
    sql = sql.replace(/;$/, '');
     // Extract where clause if present
     let whereIndex = sql.toLowerCase().indexOf('where');
     if (whereIndex !== -1) {
         sql = sql.substring(whereIndex + 5).trim();
     }
     // Extract bounds condition if present
     const boundsRegex = /bounds\s*=\s*'([^']+)'|bounds\s*=\s*"([^"]+)"/i;
     const boundsMatch = sql.match(boundsRegex);
     
     if (boundsMatch) {
         // Get the bounds value (either from single or double quotes match)
         let boundsValue: any = boundsMatch[1] || boundsMatch[2];
         // Check if boundsValue is in [minX, minY, maxX, maxY] format
         const boundsArrayRegex = /^\[([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\]$/;
         const boundsArrayMatch = boundsValue.match(boundsArrayRegex);
         if (boundsArrayMatch) {
             boundsValue = [
                 Number(boundsArrayMatch[1]),
                 Number(boundsArrayMatch[2]), 
                 Number(boundsArrayMatch[3]),
                 Number(boundsArrayMatch[4])
             ];
         } else {
             // Convert bounds string format "[[x1,y1],[x2,y2],...]" to number array
            if (boundsValue.startsWith('[') && boundsValue.endsWith(']')) {
                try {
                    let boundsArray = JSON.parse(boundsValue);
                    if (Array.isArray(boundsArray) && boundsArray.every(point => 
                        Array.isArray(point) && 
                        point.length === 2 &&
                        point.every(coord => typeof coord === 'number')
                    )) {
                        boundsValue = boundsArray;
                        // Check if boundsArray forms a rectangle (4 points in clockwise/counter-clockwise order)
                        if (boundsArray.length === 4 || boundsArray.length === 5) {
                            // Get x and y coordinates
                            const xCoords = boundsArray.map(p => p[0]);
                            const yCoords = boundsArray.map(p => p[1]);
                            
                            // Get unique x and y values
                            const uniqueX = [...new Set(xCoords.map(x => Number(x.toFixed(8))))];
                            const uniqueY = [...new Set(yCoords.map(y => Number(y.toFixed(8))))];
                            
                            // If there are exactly 2 unique x and y coordinates, it's a rectangle
                            if (uniqueX.length === 2 && uniqueY.length === 2) {
                                // Convert to [minX, minY, maxX, maxY] format
                                boundsValue = [
                                    Math.min(...xCoords),
                                    Math.max(...yCoords),
                                    Math.max(...xCoords),
                                    Math.min(...yCoords)
                                ];
                            }
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse bounds value:', e);
                }
            }
         }
        
         options.bounds = boundsValue;
         
         // Remove the bounds condition from sql
         sql = sql.replace(boundsRegex, '');
         
         // Clean up any leftover AND/OR operators
         sql = sql.replace(/\s+(AND|OR)\s+(?=\s*(AND|OR)\s+)/gi, ' ');
         sql = sql.replace(/^\s*(AND|OR)\s+/i, '');
         sql = sql.replace(/\s+(AND|OR)\s*$/i, '');
     }

    // Extract isContains condition if present
    const isContainsRegex = /isContains\s*=\s*(true|false|\d+)/i;
    const isContainsMatch = sql.match(isContainsRegex);
    
    if (isContainsMatch) {
        // Get the isContains value
        const isContainsValue = isContainsMatch[1].toLowerCase() === 'true' || isContainsMatch[1] === '1';
        options.isContains = isContainsValue;
        
        // Remove the isContains condition from sql
        sql = sql.replace(isContainsRegex, '');
        
        // Clean up any leftover AND/OR operators
        sql = sql.replace(/\s+(AND|OR)\s+(?=\s*(AND|OR)\s+)/gi, ' ');
        sql = sql.replace(/^\s*(AND|OR)\s+/i, '');
        sql = sql.replace(/\s+(AND|OR)\s*$/i, '');
    }
   
    // Extract coordType condition if present
    const coordTypeRegex = /coordType\s*=\s*(true|false|\d+)/i;
    const coordTypeMatch = sql.match(coordTypeRegex);
    
    if (coordTypeMatch) {
        // Get the coordType value
        const coordTypeValue = coordTypeMatch[1].toLowerCase() === 'true' || coordTypeMatch[1] === '1';
        options.coordType = coordTypeValue ? 1 : 0;
        
        // Remove the coordType condition from sql
        sql = sql.replace(coordTypeRegex, '');
        
        // Clean up any leftover AND/OR operators
        sql = sql.replace(/\s+(AND|OR)\s+(?=\s*(AND|OR)\s+)/gi, ' ');
        sql = sql.replace(/^\s*(AND|OR)\s+/i, '');
        sql = sql.replace(/\s+(AND|OR)\s*$/i, '');
    }

    // Extract color condition if present and convert string value to number
    const colorRegex = /color\s*=\s*['"]([^'"]+)['"]/i;
    const colorMatch = sql.match(colorRegex);
    
    if (colorMatch) {
        // Get the color value and convert to number
        let clr = colorMatch[1];
        let colorValue: any = clr;
        if (clr.startsWith('#') || clr.length == 6) {
            // 提取 rr、gg 和 bb 部分
            const rr = clr.slice(1, 3);
            const gg = clr.slice(3, 5);
            const bb = clr.slice(5, 7);

            // 重新组合为 #bbggrr
            const swappedColor = `#${bb}${gg}${rr}`;
            colorValue = vjmap.htmlColorToEntColor(swappedColor);
            colorValue = (colorValue | 0xFF000000)  << 0
        }
        // Replace the quoted color value with number in sql
        sql = sql.replace(colorRegex, `color = ${colorValue}`);
    }

    return sql
   
}
const aiSql = async () => {
    if (model.value.condition.trim() == '') {
        window.$message.warning(t('queryData.inputDescFirst'));
        return
    }
    if (isSQLCondition(model.value.condition)) {
        window.$message.warning(t('queryData.alreadySql'));
        return
    }
    try {
      const messages = [];
      let systemPrompt = `
      <instruction>
<instructions>
你是一个资深的 JavaScript 程序员和SQL专家,在通过自然语言生成SQL语句 方面有很丰富的经验，负责根据给出的文档帮助开发者实现功能。你的任务是根据用户提供的文档内容（包含在<docs></docs>标签中）生成符合要求的JavaScript代码，以下是完成任务的具体步骤：

1. 仔细阅读用户提供的文档内容。
2. 根据文档内容，生成符合要求的SQL语句。
3. 文档中的函数已经在上下文中实现，您的任务是直接调用这些函数，而不需要重新实现它们，不得调用与需求无关的函数
4. 确保输出的JavaScript代码清晰、简洁且无语法错误。
5. 仅输出符合要求的 JavaScript 代码，不添加任何解释性文字、注释或额外内容。

</instructions>

<docs>
### 函数描述：查询图中数据
函数名: __queryMapData

- 参数:
  - \`sql\` (string): sql语句，数据库表名称为geom, 表结构如下
|字段名|类型|说明|
|:---|:---|:---|
|id|integer|索引id|
|objectid|text|实体id|
|layerindex|integer|图层索引|
|layername|text|图层名称|
|name|text|实体类型,实体类型值说明(类型名 类型说明): (AcDbLine 直线),(AcDbPolyline 多段线),(AcDb2dPolyline 二维折线),(AcDb3dPolyline 三维多段线),(AcDbSpline 样条曲线),(AcDbArc 圆弧),(AcDbCircle 圆),(AcDbEllipse 椭圆), (AcDbCurve 曲线),(AcDbBlockReference 块参照), (AcDbHatch 填充),(AcDbMText 多行文本), (AcDbText 单行文本),(AcDbShape 型实体),(AcDbRasterImage 栅格图片), (AcDbWipeout 遮罩实体), (AcDbAttributeDefinition 属性注记),(AcDbAttribute 块属性),(AcDbTable 表格), (AcDbRegion 面域),  (AcDbPolyFaceMesh 多面网格实体), (AcDbPolygonMesh 多边形网格), (AcDbSurface 曲面), (AcDb3dSolid 三维实体), (AcDbFace 三维面)|
|color|string|颜色,格式为#RRGGBB|
|s1|text|线型|
|s2|text|扩展字典数据|
|n1|float|颜色索引|
|n2|float|线型比例|
|n3|float|线宽|
|n4|float|透明度|
|points|text|坐标|
|center|text|中心点|
|content|text|文本|
|blockname|text|块名称|
|area|float|面积|
|length|float|长度|
|radius|float|半径|
|thickness|float|厚度|
|elevation|float|高程|
|isclosed|integer|是否闭合(0不闭合,1闭合)|
|textWidth|float|文本宽|
|textHeight|float|文本高|
|bounds|string|范围(格式为[[x1,y1],[x2,y2],[x3,y3],[x4,y4]...],如果范围是矩形，则格式为[minX, minY, maxX, maxY])|
|isContains|boolean|范围是相交还是包含，false 相交, true 包含, 默认false|
|coordType|boolean|坐标类型false 查询位置坐标, true 查询几何坐标, 默认false|
- 返回值:
  - (Object): 返回标准的GeoJson格式的FeatureCollection对象, 包含features属性, 每个feature包含geometry和properties属性,properties属性中包含如下字段:
|字段名|类型|说明|
|:---|:---|:---|
|id|integer|索引id|
|objectid|string| 实体id|
|layerindex|integer| 图层索引 |
|layername|string| 图层名称 |
|name|string| 实体类型 |
|bounds|[number,number,number,number]| 外包矩形范围|
|boundsCenter|[number,number]| 外包矩形中心点[x,y]|
|color|string| 颜色,格式为#RRGGBB  |
|linetype|string| 线型   |
|linetypeScale|float| 线型比例  |
|lineWidth|float| 线宽 |
|alpha|float| 透明度  |
|xdata|string| 扩展数据 |
|thickness|float| 厚度  |
|area|float| 面积   |
|isclosed|boolean| 是否闭合   |
|polyType|string| 多段线类型 |
|center|[number,number]| 圆中心点 |
|radius|float| 圆半径  |
|startAngle|float| 圆弧开始角度|
|endAngle|float| 圆弧结束角度 |
|rotate|float| 旋转角度  |
|positon|[number,number]| 位置 |
|normal|float| 法向量|
|elevation|float| 高度  |
|location|[number,number]| 位置|
|text|string| 文本值 |
|contents|string| 文本样式值|
|height|float| 文本高|
|width|float| 文本宽  |
|textHeight|float| 文字高度 |
|actualHeight|float| 多行文本实际高|
|actualWidth|float| 多行文本实际宽 |
|bulge|float| 凸度 |
|origin|[number,number]| 基点 |
|isFit|boolean| 是否拟合 |
|fitTol|float| 拟合值 |
- 示例代码:
  \`\`\`js
// 示例一
// 查询图中类型为 line 且图层索引为 2 的记录
await  __queryMapData("SELECT * FROM geom WHERE name = 'AcDbLine' AND layerIndex = 2");

// 示例二
// 查询图中全部文本
await __queryMapData("SELECT * FROM geom WHERE (name = 'AcDbText' or name = 'AcDbMText' or name = 'AcDbAttributeDefinition' or name = 'AcDbAttribute') ");
       
// 示例三 
// 查询图中全部线
await __queryMapData("SELECT * FROM geom WHERE  (name = 'AcDbLine' or name = 'AcDbPolyline' or name = 'AcDb2dPolyline' or name = 'AcDb3dPolyline') ");


</docs>
</instruction>
      `;
      messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: t('queryData.queryPrompt') + model.value.condition });

      let svc = map.getService()
      loadingSql.value = true
      let baseUrl = svc.baseUrl();
      if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
      const response = await fetch(`${baseUrl}/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer no-key`
        },
        body: JSON.stringify({
          model: '',
          messages: messages,
          stream: false
        })
      });
      loadingSql.value = false
      if (response.status >= 400) {
        const errorData = await response.json();
        const errorMessage = t('queryData.errorPrefix') + (errorData.error?.message || errorData?.msg || `${t('queryData.aiRequestFailed')}: ${response.statusText}`);
        window.$message.error(errorMessage)
        return
      }


      if (!response.ok) {
        const errorMessage = `${t('queryData.aiRequestFailed')}: ${response.statusText}`;
        window.$message.error(errorMessage)
        return
      }
      const jsonResponse = await response.json();
      const content = jsonResponse.choices?.[0]?.message?.content || '';
    
    
      const extractQueryMapDataParam = (code: string) => {
        // 定义正则表达式匹配__queryMapData函数调用
        // 这个正则表达式查找__queryMapData后面跟着的括号中的内容
        const regex = /__queryMapData\s*\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*\)/;
        
        // 执行匹配
        const match = code.match(regex);
        
        // 如果找到匹配
        if (match && match[1]) {
            // 去除参数的引号（开头和结尾的引号）
            let param = match[1];
            // 如果参数使用单引号或双引号括起来，则去除它们
            if ((param.startsWith('"') && param.endsWith('"')) || 
                (param.startsWith("'") && param.endsWith("'"))) {
            param = param.substring(1, param.length - 1);
            }
            return param;
        }
        
        // 如果没有找到匹配，返回null
        return null;
      }
      let param = extractQueryMapDataParam(content);
      if (!param) {
        window.$message.error(t('queryData.aiSqlFailed') + content)
        return
      }
      let sql = queryMapData(map, param);
      if (!sql) {
        window.$message.error(t('queryData.parseSqlFailed') + param)
        return
      }
      model.value.condition = sql;
    } catch (error) {
     loadingSql.value = false
      // 处理其他未知错误
      const errorMessage = `${t('queryData.aiError')}: ${error instanceof Error ? error.message : t('queryData.unknownError')}`
      window.$message.error(errorMessage)
      return
    }
    loadingSql.value = false
}

const getResult = () => {
    return toRaw(model.value);
}


// 如果对话框要返回值，则必须导出此方法
defineExpose({
    getResult
})
</script>

<style>
.uicontainer {
    opacity: 0.9;
    width: 600px;
}

.model {
    width: 500px;
}
</style>