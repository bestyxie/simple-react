export function setProps(dom, oldProps, newProps) {
  for(let key in oldProps) {
    if (key !== 'children') {
      if (newProps.hasOwnProperty(key)) {
        setProp(dom, key, newProps[key])
      } else {
        dom.removeAttribute(key) // 旧 props 有，新 props 没有，则删除
      }
    }
  }

  for(let key in newProps) {
    if (key !== 'children') {
      if (!oldProps.hasOwnProperty(key)) {// 旧 props 没有，新 props 有，则新增
        setProp(dom, key, newProps[key])
      }
    }
  }
}

function setProp(dom, key, value) {
  if (/^on/.test(key)) {
    dom[key.toLowerCase()] = value // 没有用合成事件
  } else if (key === 'style') {
    if (value) {
      for (let styleName in value) {
        dom.style[styleName] = value[styleName]
      }
    }
  } else {
    dom.setAttribute(key, value)
  }
}