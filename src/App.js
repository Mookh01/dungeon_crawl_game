import React, { Component } from 'react';
import './App.css';





class App extends Component {
  constructor(props){
    super(props);
    this.state={
      x: 10,
      y: 10,
      w: 100,
      h: 100,
      speedX: 0,
      speedY: 0,
    }
    this.positionChange = this.positionChange.bind(this);
  } //constructor

  componentDidMount() {
      this.updateCanvas();
      window.addEventListener('keydown', this.handleKey);
  }

  updateCanvas() {
      const ctx = this.refs.canvas.getContext('2d');
      ctx.clearRect(0,0, this.refs.canvas.width, this.refs.canvas.height);
      ctx.fillRect(this.state.x,this.state.y, this.state.w, this.state.h);
  }

//left = 37, up = 38, right = 39, down = 40

positionChange(){
console.log("MADE IT")

}

handleKey(e){
  console.log("STATE: ", this);
  console.log("E: ", e);
  if (e.keyCode === 37) {
    console.log("KeyCode: ", e.keyCode)
    }
  else if(e.keyCode === 38){
   console.log("KeyCode: ", e.keyCode)
    }
  else if (e.keyCode === 39) {
   console.log("KeyCode: ", e.keyCode)
    }
  else if(e.keyCode === 40){
   console.log("KeyCode: ", e.keyCode)
    }
} //handleKeydown

render() {
      return (
        <div onKeyPress={this.handleKey.bind(this)} className='map'>
          <canvas ref="canvas" width={400} height={300}/>
          </div>
      ); //return
    }
} //App


export default App;

// <button onKeyDown={this.handleKeyDown} onKeyUp={this.updateCanvas.bind(this)}>LEFT</button>
// <button onKeyDown={this.handleKeyDown} onKeyUp={this.updateCanvas.bind(this)}>RIGHT</button>
// <button onKeyDown={this.handleKeyDown} onKeyUp={this.updateCanvas.bind(this)}>UP</button>
// <button onKeyDown={this.handleKeyDown} onKeyUp={this.updateCanvas.bind(this)}>DOWN</button>
