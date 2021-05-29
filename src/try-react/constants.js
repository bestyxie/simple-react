// 文本节点类型
export const TAG_TEXT = Symbol.for('ELEMENT_TAG')
// 根 fiber
export const TAG_ROOT = Symbol.for('TAG_ROOT')
// dom 节点类型，如：div span p 等
export const TAG_HOST = Symbol.for('TAG_HOST')

// 新增的 fiber 节点
export const PLACEMENT = 'PLACEMENT'