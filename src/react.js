import {ELEMENT_TAG} from './constants'
import {schedualRoot} from './schedual'
import {Update} from  './UpdateQueue'

function createElement(type, config, ...children) {
  delete config.__self
  delete config.__source
  return {
    type,
    props: {
      ...config,
      children: children.map(child => {
        return typeof child == 'object' ? child : {
          type: ELEMENT_TAG,
          props: {text: child, children: []}
        }
      })
    }
  }
}

class Component {
  constructor(props) {
    this.props = props
  }
  setState(payload) {
    let update = new Update(payload)
    this.internalFiber.updateQueue.enqueueUpdate(update)
    schedualRoot()
  }
}
Component.prototype.isReactComponent = {} // 类组件

export default {
  createElement,
  Component
}