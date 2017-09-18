import React, { Component } from 'react';
import addons from 'react-addons';
// import './App.css';
// import _ from 'lodash';


class App extends Component {
  constructor(props){
    super(props);

  }

  var Dungeon = {
      map: null,
      map_size: 64,
      rooms: [],
      Generate: function () {
          this.map = [];
          for (var x = 0; x < this.map_size; x++) {
              this.map[x] = [];
              for (var y = 0; y < this.map_size; y++) {
                  this.map[x][y] = 0;
              } //for loop
          } //for loop

          var room_count = Helpers.GetRandom(10, 20);
          var min_size = 5;
          var max_size = 15;

          for (var i = 0; i < room_count; i++) {
              var room = {};

              room.x = Helpers.GetRandom(1, this.map_size - max_size - 1);
              room.y = Helpers.GetRandom(1, this.map_size - max_size - 1);
              room.w = Helpers.GetRandom(min_size, max_size);
              room.h = Helpers.GetRandom(min_size, max_size);

              if (this.DoesCollide(room)) {
                  i--;
                  continue;
              } // if statement
              room.w--;
              room.h--;

              this.rooms.push(room);
          } //for loop

          this.SquashRooms();

          for (i = 0; i < room_count; i++) {
              var roomA = this.rooms[i];
              var roomB = this.FindClosestRoom(roomA);

              pointA = {
                  x: Helpers.GetRandom(roomA.x, roomA.x + roomA.w),
                  y: Helpers.GetRandom(roomA.y, roomA.y + roomA.h)
              };

              pointB = {
                  x: Helpers.GetRandom(roomB.x, roomB.x + roomB.w),
                  y: Helpers.GetRandom(roomB.y, roomB.y + roomB.h)
              };

              while ((pointB.x != pointA.x) || (pointB.y != pointA.y)) {
                  if (pointB.x != pointA.x) {
                      if (pointB.x > pointA.x) pointB.x--;
                      else pointB.x++;
                  } else if (pointB.y != pointA.y) {
                      if (pointB.y > pointA.y) pointB.y--;
                      else pointB.y++;
                  }

                  this.map[pointB.x][pointB.y] = 1;
              } //while
          } //for loop

          for (i = 0; i < room_count; i++) {
              var room = this.rooms[i];
              for (var x = room.x; x < room.x + room.w; x++) {
                  for (var y = room.y; y < room.y + room.h; y++) {
                      this.map[x][y] = 1;
                  } //for loop
              } //for loop
          } //for loop

          for (var x = 0; x < this.map_size; x++) {
              for (var y = 0; y < this.map_size; y++) {
                  if (this.map[x][y] == 1) {
                      for (var xx = x - 1; xx <= x + 1; xx++) {
                          for (var yy = y - 1; yy <= y + 1; yy++) {
                              if (this.map[xx][yy] == 0) this.map[xx][yy] = 2;
                          }
                      } //for loop
                  }
              }//for loop
          } //for loop

      }, //Generate Function
      FindClosestRoom: function (room) {
          var mid = {
              x: room.x + (room.w / 2),
              y: room.y + (room.h / 2)
          };
          var closest = null;
          var closest_distance = 1000;
          for (var i = 0; i < this.rooms.length; i++) {
              var check = this.rooms[i];
              if (check == room) continue;
              var check_mid = {
                  x: check.x + (check.w / 2),
                  y: check.y + (check.h / 2)
              };
              var distance = Math.min(Math.abs(mid.x - check_mid.x) - (room.w / 2) - (check.w / 2), Math.abs(mid.y - check_mid.y) - (room.h / 2) - (check.h / 2));
              if (distance < closest_distance) {
                  closest_distance = distance;
                  closest = check;
              } //if statement
          } //for loop
          return closest;
      },
      SquashRooms: function () {
          for (var i = 0; i < 10; i++) {
              for (var j = 0; j < this.rooms.length; j++) {
                  var room = this.rooms[j];
                  while (true) {
                      var old_position = {
                          x: room.x,
                          y: room.y
                      };
                      if (room.x > 1) room.x--;
                      if (room.y > 1) room.y--;
                      if ((room.x == 1) && (room.y == 1)) break;
                      if (this.DoesCollide(room, j)) {
                          room.x = old_position.x;
                          room.y = old_position.y;
                          break;
                      } //if statement
                  } //while true
              } //for loop
          } //for loop
      },
      DoesCollide: function (room, ignore) {
          for (var i = 0; i < this.rooms.length; i++) {
              if (i == ignore) continue;
              var check = this.rooms[i];
              if (!((room.x + room.w < check.x) || (room.x > check.x + check.w) || (room.y + room.h < check.y) || (room.y > check.y + check.h))) return true;
          } //for loop

          return false;
      } //DoesCollide
  } //Dungeon


  render(){
    var Renderer = {
        canvas: null,
        ctx: null,
        size: 512,
        scale: 0,
        Initialize: function () {
            this.canvas = document.getElementById('canvas');
            this.canvas.width = this.size;
            this.canvas.height = this.size;
            this.ctx = canvas.getContext('2d');
            this.scale = this.canvas.width / Dungeon.map_size;
        },
        Update: function () {
            for (var y = 0; y < Dungeon.map_size; y++) {
                for (var x = 0; x < Dungeon.map_size; x++) {
                    var tile = Dungeon.map[x][y];
                    if (tile == 0) this.ctx.fillStyle = '#351330';
                    else if (tile == 1) this.ctx.fillStyle = '#64908A';
                    else this.ctx.fillStyle = '#424254';
                    this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
                }
            }
        }
    };

    var Helpers = {
        GetRandom: function (low, high) {
            return~~ (Math.random() * (high - low)) + low;
        }
    };
    return(


    )

  }

} //App


Dungeon.Generate();
Renderer.Initialize();
Renderer.Update(Dungeon.map);