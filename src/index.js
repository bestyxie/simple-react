// import React from './react';
// import ReactDOM from './react-dom';
import React from './try-react/react'
import ReactDOM from './try-react/react-dom';
// import React from 'react'
// import ReactDOM from 'react-dom'

// class App extends React.Component {
//   state = {
//     count: 0
//   }
//   counter = () => {
//     const { count } = this.state
//     this.setState({ count: count + 1 })
//     // this.setState({ count: count + 1 })
//   }
//   render() {
//     const { count } = this.state

//     return (
//       <div>
//         {count}
//         <button onClick={this.counter}>加1</button>
//       </div>
//     )
//   }
// }

const App = (
  <div id="A">
    <div id="B">
      B1
      <div id="B2">B2-1</div>
    </div>
    <div id="C">C1</div>
  </div>
)
// console.log(App)

ReactDOM.render(App, document.getElementById('root'))