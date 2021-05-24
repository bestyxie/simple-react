import React from './react';
import ReactDOM from './react-dom';

class App extends React.Component {
  state = {
    count: 0
  }
  counter = () => {
    const { count } = this.state
    this.setState({ count: count + 1 })
    this.setState({ count: count + 1 })
  }
  render() {
    const { count } = this.state

    return (
      <div>
        {count}
        <button onClick={this.counter}>加1</button>
      </div>
    )
  }
}
console.log(<App />)

ReactDOM.render(<App />, document.getElementById('root'))