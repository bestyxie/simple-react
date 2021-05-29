import { TAG_ROOT, TAG_TEXT, TAG_HOST, PLACEMENT } from "../constants"
import { createDOM } from '../utils'

let currentRoot = null
let workInprogressRoot = null
let nextUnitOfWork = null

export function scheduleRoot(rootFiber) {
  if (currentRoot && !currentRoot.alternate) { // 已完成第一次渲染，现在是第二次渲染
    workInprogressRoot = rootFiber
    workInprogressRoot.alternate = currentRoot
  } else if (currentRoot) { // 已经完成两次及以上次数的渲染
    workInprogressRoot = currentRoot.alternate
    workInprogressRoot.props = rootFiber.props
  } else { // 第一次渲染
    workInprogressRoot = rootFiber
  }

  nextUnitOfWork = workInprogressRoot
}

function workLoop(time) {
  let shouldYield = false
  while (!shouldYield && nextUnitOfWork) {
    nextUnitOfWork = beginWork(nextUnitOfWork)
    shouldYield = time.timeRemaining() < 1
  }
  if (!nextUnitOfWork && workInprogressRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop, { timeout: 500 })
}

function commitRoot() {
  let currentFiber = workInprogressRoot.firstEffect

  while(currentFiber) {
    commitWork(currentFiber)
    currentFiber = currentFiber.nextEffect
  }

  workInprogressRoot.firstEffect = null
  workInprogressRoot.lastEffect = null
  workInprogressRoot.alternate = currentRoot
  currentRoot = workInprogressRoot
  workInprogressRoot = null
}

function commitWork(currentFiber) {
  console.log(currentFiber.return)
  let parentDOM = currentFiber.return.stateNode
  if (currentFiber.tag === TAG_HOST) {
    parentDOM.appendChild(currentFiber.stateNode)
  } else if (currentFiber.tag === TAG_TEXT) {
    parentDOM.innerText = currentFiber.props.text
  }
}

function beginWork(currentFiber) {
  performUnitOfWork(currentFiber)

  if (currentFiber.child) {
    return currentFiber.child
  }

  while(currentFiber) {
    completeUnitOfWork(currentFiber)

    if (currentFiber.sibling) {
      return currentFiber.sibling
    }
    currentFiber = currentFiber.return
  }
}

function performUnitOfWork(currentFiber) {
  if (currentFiber.tag === TAG_HOST) {
    currentFiber.stateNode = createDOM(currentFiber)
  }

  reconcileChildren(currentFiber, currentFiber.props.children)
}

// 收集 effect list
function completeUnitOfWork(currentFiber) {
  const returnFiber = currentFiber.return
  if (returnFiber) {
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect
    }

    if (currentFiber.lastEffect) {
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect
      }
      returnFiber.lastEffect = currentFiber.lastEffect
    }

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

function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0
  // let oldChild = currentFiber.alternate && currentFiber.alternate.child
  let newChild = newChildren[newChildIndex]
  let prevChild = null

  while(newChild) {
    let tag = newChild.type
    if (newChild.type !== TAG_ROOT && newChild.type !== TAG_TEXT) {
      tag = TAG_HOST
    }

    let newFiber = {
      tag,
      type: newChild.type,
      child: null,
      stateNode: null,
      props: newChild.props,
      return: currentFiber,
      sibling: null,
      alternate: null,
      firstEffect: null,
      nextEffect: null,
      lastEffect: null,
      effectTag: PLACEMENT,
    }
    if (prevChild) {
      prevChild.sibling = newFiber
    } else {
      currentFiber.child = newFiber
    }
    prevChild = newFiber
    newChildIndex ++
    newChild = newChildren[newChildIndex]
  }
}

requestIdleCallback(workLoop, { timeout: 500 })