import {TAG_ROOT} from './constants'
import {schedualRoot} from './schedual'

/**
 * render 是要把一个元素渲染到一个容器内部
 */
function render(element, container) {
  let rootFiber = {
    tag: TAG_ROOT, // 每个 fiber 会有一个 tag，标志此元素的类型
    stateNode: container, // 一般情况下如果这个元素是一个原生节点，stateNode 指向真实 DOM 元素
    // props.children 是一个数组，里面放的是 react 元素 虚拟DOM，后面会根据每个 React 元素创建对应的 fiber
    props: {children: [element]} // 这个 fiber 的属性对象 children属性，里面放的是要渲染的元素
  }
  schedualRoot(rootFiber);
}

export default {
  render
}
/**
 * concil
 */
