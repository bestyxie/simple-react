import { TAG_ROOT, ELEMENT_TAG, TAG_TEXT, TAG_HOST, PLACEMENT, DELETE, UPDATE, TAG_CLASS } from "./constants";
import { UpdateQueue } from "./UpdateQueue";
import { setProps } from './utils'

/**
 * 从根节点开始渲染和调度
 * 两个节点
 * diff 阶段 对比新旧的虚拟DOM，进行增量，更新或创建, render 阶段，
 * 这个阶段可能比较花时间，所以我们需要对任务进行拆分，拆分的纬度为一个虚拟DOM节点, 此阶段可以暂停
 * render 阶段的成功是 effect list，知道那些节点更新，哪些节点删除了，哪些节点增加了
 * commit 阶段，进行DOM 更新或创建阶段，此阶段不能暂停，要一气呵成
 */
let nextUnitOfWork = null
let workInProgressRoot = null // RootFiber 应用的根
let currentRoot = null // 当前渲染成功的 RootFiber
let deletions = [] // 删除的 fiber
export function schedualRoot(rootFiber) { // {tag: TAG_ROOT, stateNode: container, props: {children: [element]}}
  if (currentRoot && currentRoot.alternate) { // 第二次之后的渲染，复用变量（进行双缓冲）
    workInProgressRoot = currentRoot.alternate
    workInProgressRoot.alternate = currentRoot
    if (rootFiber) workInProgressRoot.props = rootFiber.props
  } else if (currentRoot) { // 说明至少渲染过一次了
    if (rootFiber) {
      rootFiber.alternate = currentRoot
      workInProgressRoot = rootFiber
    } else {
      workInProgressRoot = {
        ...currentRoot,
        alternate: currentRoot
      }
    }
  } else {
    workInProgressRoot = rootFiber
  }
  nextUnitOfWork = workInProgressRoot
}

// 循环执行工作 nextUnitOfWork
function workLoop(deadLine) {
  let shouldYield = false // 是否要让出时间片或者控制权
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadLine.timeRemaining < 1 // 没有时间的话要让出控制权
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    console.log('render 阶段结束')
    commitRoot()
  }
  // 不管有没有任务，都请求再次调度
  requestIdleCallback(workLoop, { timeout: 500 })
}

function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect
  deletions.map(commitWork)
  while (currentFiber) {
    commitWork(currentFiber)
    currentFiber = currentFiber.nextEffect
  }
  deletions.length = 0
  currentRoot = workInProgressRoot // 把当前渲染成功的根 fiber 赋给 currentRoot 
  currentRoot.firstEffect = null
  workInProgressRoot = null
}

function commitWork(currentFiber) {
  if (!currentFiber) return
  let parentFiber = currentFiber.return
  while (parentFiber.tag !== TAG_HOST
    && parentFiber.tag !== TAG_TEXT
    && parentFiber.tag !== TAG_ROOT) {
    parentFiber = parentFiber.return
  }
  const parentDOM = parentFiber.stateNode
  if (currentFiber.effectTag === PLACEMENT) {
    let nextFiber = currentFiber
    if (nextFiber.tag === TAG_CLASS) return
    while (nextFiber.tag !== TAG_TEXT && nextFiber.tag !== TAG_HOST) {
      nextFiber = nextFiber.child
    }
    parentDOM.appendChild(nextFiber.stateNode)
  } else if (currentFiber.effectTag === DELETE) {
    commitDeletion(parentDOM, currentFiber)
    // parentDOM.removeChild(currentFiber.stateNode)
  } else if (currentFiber.effectTag === UPDATE) {
    if (currentFiber.tag === TAG_TEXT) {
      if (currentFiber.props.text !== currentFiber.alternate.props.text) {
        currentFiber.stateNode.textContent = currentFiber.props.text
      } else {
        if (currentFiber.tag === TAG_CLASS) {
          return currentFiber.effectTag = null
        }
        updateDOM(currentFiber.stateNode, currentFiber.alternate.props, currentFiber.props)
      }
    }
  }
  currentFiber.effectTag = null
}

function commitDeletion(parentDOM, currentFiber) {
  if (currentFiber.tag === TAG_TEXT || currentFiber.tag === TAG_HOST) {
    parentDOM.removeChild(currentFiber.stateNode)
  } else {
    commitDeletion(parentDOM, currentFiber.child)
  }

}

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber)
  if (currentFiber.child) {
    return currentFiber.child
  }
  while (currentFiber) {
    // 没有儿子就表明当前 fiber 完成了
    completeUnitOfWork(currentFiber)
    if (currentFiber.sibling) {// 看有没有 弟弟，有就返回
      return currentFiber.sibling
    }
    currentFiber = currentFiber.return // 找到父亲，让父亲完成
  }
}

/**
 * 在完成的时候要收集有副作用的fiber，然后组成effect list
 */
function completeUnitOfWork(currentFiber) {
  const returnFiber = currentFiber.return
  // debugger
  if (returnFiber) {
    //把自己儿子的 effect 链挂到父亲身上 
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect
    }
    if (currentFiber.lastEffect) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect
      }
      returnFiber.lastEffect = currentFiber.lastEffect
    }
    /// 把自己挂到父亲身上
    if (returnFiber.firstEffect) {
      currentFiber.firstEffect = returnFiber.firstEffect
    }

    if (currentFiber.effectTag) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber
      } else {
        returnFiber.firstEffect = currentFiber
      }
      returnFiber.lastEffect = currentFiber
    }
  }
}

/**
 * beginWork 开始收下线的钱
 * completeUnitOfWork 把下线的钱收完了
 * 1、创建真实 DOM 元素
 * 2、创建子 fiber
 */
function beginWork(currentFiber) {
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber)
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber)
  } else if (currentFiber.tag === TAG_HOST) { // 原生 DOM节点
    updateHost(currentFiber)
  } else if (currentFiber.tag === TAG_CLASS) {
    updateClassComponent(currentFiber)
  }
}

function updateClassComponent(currentFiber) {
  console.log('updateClassComponent')
  if (!currentFiber.stateNode) { // 类组件的 stateNode 是组件的实例
    currentFiber.stateNode = new currentFiber.type(currentFiber.props)
    currentFiber.stateNode.internalFiber = currentFiber
    currentFiber.updateQueue = new UpdateQueue()
  }
  currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(currentFiber.stateNode.state)
  let newElement = currentFiber.stateNode.render()
  reconcileChildren(currentFiber, [newElement])
}

function updateHost(currentFiber) {
  // 如果此fiber没有创建 DOM 节点
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber)
  }
  const newChildren = currentFiber.props.children
  reconcileChildren(currentFiber, newChildren)
}

function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text)
  } else if (currentFiber.tag === TAG_HOST) {
    let stateNode = document.createElement(currentFiber.type)
    updateDOM(stateNode, {}, currentFiber.props)
    return stateNode
  }
}

function updateDOM(stateNode, oldProps, newProps) {
  if (stateNode.setAttribute) {
    setProps(stateNode, oldProps, newProps)
  }
}

function updateHostText(currentFiber) {
  // 如果此fiber没有创建 DOM 节点
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber)
  }
}

function updateHostRoot(currentFiber) {
  // 先处理自己，如果是原生节点，创建真实 DOM，2、创建子fiber
  let newChildren = currentFiber.props.children // [element]
  reconcileChildren(currentFiber, newChildren)
}

function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0 // 新子节点的索引
  let oldChild = currentFiber.alternate && currentFiber.alternate.child
  if (oldChild) oldChild.nextEffect = oldChild.lastEffect = oldChild.firstEffect = null
  let prevSibling // 上一个新的子 fiber
  while (newChildIndex < newChildren.length || oldChild) {
    let newChild = newChildren[newChildIndex] // 取出虚拟 DOM节点
    let sameType = oldChild && newChild && oldChild.type === newChild.type
    let newFiber
    let tag
    if (newChildren && typeof newChild.type === 'function' && newChild.type.prototype.isReactComponent) {
      tag = TAG_CLASS
    } else if (newChild && newChild.type === ELEMENT_TAG) {
      tag = TAG_TEXT
    } else if (newChild && typeof newChild.type === 'string') {
      tag = TAG_HOST // 如果type 是字符串，那么这是一个原生 DOM 节点
    }
    if (sameType) { // 说明旧 fiber 和新虚拟 DOM 的类型一样
      if (oldChild.alternate) { // 说明至少更新过一次了，则复用上上次的 fiber，以免造成内存泄漏
        newFiber = oldChild.alternate
        newFiber.props = newChild.props
        newFiber.alternate = oldChild
        newFiber.return = currentFiber
        newFiber.effectTag = UPDATE
        newFiber.nextEffect = null
        newFiber.updateQueue = oldChild.updateQueue || new UpdateQueue()
      } else {
        newFiber = {
          tag: oldChild.tag,
          type: oldChild.type,
          props: newChild.props,
          stateNode: oldChild.stateNode, // 复用旧的
          return: currentFiber, // 父 fiber，returnFiber
          effectTag: UPDATE, //副作用标识
          nextEffect: null, // effectList 也是个单链表
          updateQueue: oldChild.updateQueue || new UpdateQueue(),
          alternate: oldChild
        }
      }
    } else if (!newChild && oldChild) {
      oldChild.effectTag = DELETE
      deletions.push(oldChild)
    } else {
      newFiber = {
        tag,
        type: newChild.type,
        props: newChild.props,
        stateNode: null, // div 还没创建 DOM 元素
        return: currentFiber, // 父 fiber，returnFiber
        effectTag: PLACEMENT, //副作用标识
        nextEffect: null, // effectList 也是个单链表
        updateQueue: new UpdateQueue(),
        // effect list 顺序和完成顺序是一样，但是节点只放那些出钱的人的 fiber 节点，不出钱的绕过去
      }
    }
    if (oldChild) {
      oldChild = oldChild.sibling
    }
    if (newFiber) {
      if (newChildIndex === 0) {
        currentFiber.child = newFiber
      } else {
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
    }
    newChildIndex++
  }
}

// react 告诉浏览器，我现在有任务，请你在空闲的时候帮我执行
// 有一个优先级的概念，expirationTime
requestIdleCallback(workLoop, { timeout: 500 })