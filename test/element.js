let A1 = {type: 'div', name: 'A1'}
let B1 = {type: 'div', name: 'B1', return: A1}
let B2 = {type: 'div', name: 'B2', return: A1}
let C1 = {name: 'C1', return: B1}
let C2 = {name: 'C2', return: B1}

A1.child = B1
B1.sibling = B2
B1.child = C1
C1.sibling = C2
module.exports = A1
