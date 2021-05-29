import {TAG_TEXT} from './constants'

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        return typeof child === 'string'
          ? { type: TAG_TEXT, props: {text: child, children: []}}
          : child
      }),
    }
  }
}

export default {
  createElement
}