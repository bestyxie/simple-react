export class Update {
  constructor(payload) {
    this.payload = payload
  }
}

// 数据结构是个单链表 
export class UpdateQueue {
  constructor() {
    this.firstUpdate = null;
    this.lastUpdate = null;
  }

  enqueueUpdate(update) {
    if (!this.lastUpdate) {
      this.lastUpdate = this.firstUpdate = update
    } else {
      this.lastUpdate.nextUpdate = update
      this.lastUpdate = update
    }
  }

  forceUpdate(state) {
    let currentUpdate = this.firstUpdate
    while (currentUpdate) {
      let nextState = typeof currentUpdate.payload === 'function' ? currentUpdate.payload(state) : currentUpdate.payload
      state = { ...state, ...nextState }
      currentUpdate = currentUpdate.nextUpdate
    }
    this.firstUpdate = this.lastUpdate = null
    return state
  }
}

// const queue = [
//   {
//     a: state + 1,
//   },
//   {
//     a: state + 1,
//   },
//   prev => {
//     return {
//       a: prev.a + 1,
//     }
//   },
// ]

// queue.reduce((result, item) => {
//   if (!result || typeof item !== 'function') {
//     result = {
//       ...result,
//       ...item,
//     }
//   } else {
//     result = item(result)
//   }
//   return result
// }, null)