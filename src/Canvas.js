import React, { Component } from 'react';
import './App.css';
import _ from 'lodash';


class App extends Component {
//Our grids parameters are created here...
  constructor(props){
    super(props);
      this.state={
        rows:50,
        cols: 50,
        h : 50,
    	   w : 50,
         x : 5,
         y : 5,
    	roomAmount : 20,
    	roomRanges: [4,8],
        grid:[],
        rooms:[],
      } //state
      let roomAmount = this.state.roomAmount; //number of rooms to create.
      let gridHeight = this.state.rows; //grid height size
      let gridWidth = this.state.cols;  //grid width size
    //1. Creates our grid, pushes empty brackets [ ]
    for (let row = 0; row < this.state.rows; row++) {
      this.state.grid.push([]);
      for (let col = 0; col < this.state.cols; col++) {
        this.state.grid[row].push({type: 0, opacity: Math.floor(Math.random(0.3,0.8))});
        this.state[[row, col]] = 0
      } //for loop
    } //for loop


// Functions ========================================================================

function roomSetting(roomAmount, gridHeight, gridWidth, state){
  let roomSizes = [];
  for (let n=2; n<7; n++) {
      for (let m=2; m<7; m++) {
          let thisSize = new Array(2);
          thisSize[0] = n;
          thisSize[1] = m;
          roomSizes.push(thisSize);
      } //for loop
  } //for loop
  let numbs = roomAmount;
  let rooms = state.rooms;
for (let i = 0; i < numbs; i++) {
  var randX = utilsRandomInt(20, gridWidth - 20) //a range near the center
  var randY = utilsRandomInt(20, gridHeight - 20) //a range near the center
  var thisRSI = utilsRandomInt(0, roomSizes.length - 1); //takes room array to get random room size.
  var x1 = randX - 1 ;
  var x2 = roomSizes[thisRSI][0] + randX + 1;
  var y1 = randY - 1;
  var y2 = roomSizes[thisRSI][1] + randY + 1;
  var height = roomSizes[thisRSI][0];
  var width = roomSizes[thisRSI][1];
//put our random room in rooms array
  let room = {x1:x1 , y1:y1, x2:x2, y2:y2, "width":width,"height":height, type:"room", fill:"white"};
  rooms.push(room);
  // console.log("ROOMS: ", rooms);
} // for loop

clashedRooms(rooms, state);
} //roomSetting

function utilsRandomInt( min, max){  //creates a random function
  return Math.floor(min + Math.random() * (max - min + 1));
}

function clashedRooms(rooms,state){
  let r1;
  let r2;
  let shift1;
  let shift2;
  let continueLoop = false;
  let loopTimeout = 50;
  let roomChange = [];
  do{
    continueLoop = false;
    for (let q = 0; q < rooms.length; q++) { //rooms array is looped through starting at 0
      for (let j = q + 1; j < rooms.length; j++) { //rooms array is looped through again, starting at 1
           //Get the first room r1, Get the second room r2
          r1 = rooms[q];
          r2 = rooms[j];

        let xCollide = rangeIntersect(r1.x1, r1.x2, r2.x1, r2.x2);  //send our high and low xAxis of both rooms
        let yCollide = rangeIntersect(r1.y1, r1.y2, r2.y1, r2.y2);  //send our high and low yAxis of both rooms

        if(xCollide != 0 && yCollide != 0){   // if x & y axis shows a collision...then we enter the if statement.
          continueLoop = true;

          if(Math.abs(xCollide) < Math.abs(yCollide)){ //xAxis is less than yAxis
          shift1 = Math.floor(xCollide * 0.5);
          shift2 = -1 * (xCollide - shift1);
          r1.x1 += shift1;
          r1.x2 += shift1;
          r2.x1 += shift2;
          r2.x2 += shift2;
          r1.id = q;
          r2.id = j;

            let addedRoomQ = {x1:r1.x1 , y1:r1.y1, x2:r1.x2, y2:r1.y2, "width":r1.width,"height":r1.height, type:"room", fill:"white", id:r1.id};
            let addedRoomJ = {x1:r2.x1 , y1:r2.y1, x2:r2.x2, y2:r2.y2, "width":r2.width,"height":r2.height, type:"room", fill:"white", id:r2.id};
            roomAdditions(addedRoomQ,addedRoomJ);

        } //if/else statement
          else{
            //Get distance to shift both rooms by splitting the returned collision amount in half
                shift1 = Math.floor(yCollide * 0.5);
                shift2 = -1 * (yCollide - shift1);
                //Add shift amounts to both room's location data
                r1.y1 += shift1;
                r1.y2 += shift1;
                r2.y1 += shift2;
                r2.y2 += shift2;

          } // if/else statement
        } //if statement
  } //for loop
} //for loop
// console.log("roomChange ARRAY:", roomChange);
// console.log("After Changes:", rooms);
        for (var row = r1.x1; row < r1.x2; row++) {
          for (var col = r1.y1; col < r1.y2; col++) {
        state[[row ,col]] = 1;
          }
        }
        for (var row = r2.x1; row < r2.x2; row++) {
          for (var col = r2.y1; col < r2.y2; col++) {
        state[[row ,col]] = 1;
          }
        }
loopTimeout--;
if(loopTimeout <=0){
  continueLoop = false;
}
} while (continueLoop == true);


let grid = []
console.log("PASSING from clashedRooms:", rooms);
 updateGrid(rooms,grid);

} //clashedRooms

       //  we take two different rooms and compare x-axis to x-axis and y-axis to y-axis
      function rangeIntersect(low1, high1, low2, high2) {
        // console.log("low1:", low1, " high1:", high1, " low2:",low2, " high2:",high2 );
        var min1 = Math.min(low1, high1);
        var max1 = Math.max(low1, high1);
        var min2 = Math.min(low2, high2);
        var max2 = Math.max(low2, high2);
        //if the end of first room collides with the start of the second room
        //AND..if the start of the first room is less than/equal to the end of second room.
        // we're looking for intersects in rooms.
        //!note, with min1 being less than the max of two, this could me that they are not intersecting.
        if((max1 >= min2) && (min1 <= max2)){
          //we get the difference between the sections
          var dist1 = max2 - min1;
          var dist2 = max1 - min2;
          // console.log("dist1:", dist1, " dist2:", dist2);
              //here we look for the smallest distance we need to take in order to
              //seperate the rooms. We are then returning that number
              if(dist2 < dist1){
                //we then return our dist2
                // console.log("dist2 < dist1 - dist2 * -1:", dist2 * -1);

                return dist2 * -1;
              } else {
                // console.log("dist1:", dist1)
                return dist1;
              }

        } else {
          return 0;
        }
      } //rangeIntersect

function roomAdditions(roomQ,roomJ){
  // console.log("ROOM-ID Q:", roomQ.id, " J:", roomJ.id );
  // console.log("roomChange--In Additions:",roomChange);
  let finalRooms = [];
  let count;
  console.log()
  if(finalRooms.length < 1){
    count = 1;
  }
  else if(finalRooms.length > 10){
  count = 10;
  }
  for(let k = 0; k < count;k++){
    console.log("INSIDE: roomChange:", count);
    console.log("K:", k);
    finalRooms.push(roomQ);
  }
  console.log("finalRooms:", finalRooms);
//     if(roomChange[k].id !== roomQ.id){
//   //   addedRoomQ
//     roomChange.push(addedRoomQ)
//     } // if statement
//     else if(roomChange[k].id === k){
//     roomChange.splice([k],1, addedRoomQ)
//     }// else if statement
//     // if(roomChange[k].id !== j){
//     // roomChange.push(addedRoomJ)
// //     } // if statement
// //     else if(roomChange[k].id === j){
// //     roomChange.splice([k],1, addedRoomJ)
// //   } // else if statement
//   // } //for statement

}
// updateGrid gives us our division of rooms ================================================================
        function updateGrid(rooms,grid){
          console.log("UPDATEGRID: ", rooms);
          for(let roomDetail = 0; roomDetail < rooms.length; roomDetail++){

                      let roomStartX = rooms[roomDetail].x1;
                      let roomHeight = rooms[roomDetail].height;
                      let roomStartY = rooms[roomDetail].y1;
                      let roomWidth = rooms[roomDetail].width;
                      let fullHeight = roomStartX + roomHeight;
                      let fullWidth = roomStartY + roomWidth;
              //take where the room starts, then loop until we reach our height.
            for( let walkRoomX = roomStartX; walkRoomX < fullHeight; walkRoomX ++){
                for(let walkRoomY = roomStartY; walkRoomY  < fullWidth; walkRoomY ++){
                    grid[[walkRoomX ,walkRoomY]] = grid[[walkRoomX ,walkRoomY]]? 0 : 1;
                } //for loop
            } //for loop
          } //for loop
        } //updateGrid
    roomSetting(roomAmount, gridHeight, gridWidth, this.state);
} //constructor




      render(){
        //Uses window width&height for size.
              let width = window.innerWidth;
              let height = window.innerHeight;
        //determine cell size.
              let ratio = (width * 2 / 3 - 40) / (height - 40);
              let boardRatio = this.state.cols / this.state.rows;
              let boardW = (width * 2 / 3) - 40;
              let boardH = boardW * (this.state.rows / this.state.cols);
              let a = [];
              let cellLength = Math.min(boardW, boardH) / Math.min(this.state.rows, this.state.cols);

                  let svgStyle = {
                    width: boardW,
                    height: boardH
                  }
        //Disperse cells with different colors...
              for (let r = 0; r < this.state.rows; r++) {
                for (let c = 0; c < this.state.cols; c++) {
                  a.push(<Cell  type={this.state[[r,c]] ? "room" : "wall"} dim={cellLength} col={c} row={r} key={r + "," + c}  fill={this.state[[r, c]] ? "white" : 'brown'}/>);
                } //2nd For Loop
              } //1st For Loop

                          return(
                            <div onKeyPress={this.handleKey} className='map'>
                          <svg
                            width={svgStyle.width}
                            height={svgStyle.height}
                            className="col svg"
                          >
                            {a}
                          </svg>
                              </div>
                          ); //return
                    } //render
                } //App

class Cell extends Component {
  constructor(prop) {
    super(prop);
  } //constructor

  render() {
    let dim = this.props.dim;
    let r = this.props.row;
    let c = this.props.col;

    return (
      <rect  name={[r,c]} width={dim} height={dim} ref={[r,c]}  stroke="black" stroke={/*this.props.fill==="white" ? "white" : */'black'} strokeWidth='0.5' x={dim * this.props.col} y={dim * this.props.row} fill={this.props.fill} ></rect>
    ) //return
  }; //render

} //Cell






export default App;
