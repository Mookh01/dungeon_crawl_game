import React, { Component } from 'react';
import update from 'immutability-helper';    //npm install --save immutability-helper
import { createStore, applyMiddleware, combineReducers } from 'redux';
import {Provider, connect } from 'react-redux';  //npm install --save react-redux
import thunk from 'redux-thunk';    //npm install --save redux-thunk
import {batch, batching} from 'redux-batched-actions';
import _ from 'lodash';
// import {batch, batching, batchActions, enableBatching} from 'redux-batched-actions';  //npm install --save redux-batched-actions


///////////////////////////////////////////Game Board section//////////////////////////////////
const boardHeight = 50;
const boardWidth = 50;
const numberOfRooms = 7;
const roomRange = [6, 10];

function batchActions(actions){
	return {type: 'BATCH_ACTIONS', payload: actions}
} //batchActions

function enableBatching(reducer){
		return function batchingReducer(state, action){
			switch(action.type){
				case 'BATCH_ACTIONS':
				return action.payload.reduce(batchingReducer, state);
				default:
					return reducer(state, action);
			} //switch
		} //batchingReducer
} //enableBatching
//////////////////////////////////////////////Create Dungeon////////////////////////////////////
const createDungeon = () => {
	// HELPER FUNCTIONS FOR CREATING THE MAP
	const checkRoomLocation = (grid, {x, y, width = 1, height = 1}) => {
		if (y < 1 || y + height > grid.length - 1) {
			return false;
		}
		if (x < 1 || x + width > grid[0].length - 1) {
			return false;
		}
		// check if on or adjacent to existing room
		for (let i = y - 1; i < y + height + 1; i++) {
			for (let j = x - 1; j < x + width + 1; j++) {
				if (grid[i][j].type === 'floor') {
					return false;
				}
			}
		}
		return true;

	}; //checkRoomLocation

	const createMap = (grid, {x, y, width = 1, height = 1}, type = 'floor') => {
		for (let i = y; i < y + height; i++) {
			for (let j = x; j < x + width; j++) {
				grid[i][j] = {type};
			}
		}
		return grid;
	}; // createMap

	const roomTemplate = (grid, {x, y, width, height}, range = roomRange) => {
	const [min, max] = range;
	const roomSettings = [];
	const alpha = { height: _.random(min, max), width: _.random(min, max) };
		alpha.x = _.random(x, x + width - 1);
		alpha.y = y - alpha.height - 1;
		alpha.doorx = _.random(alpha.x, (Math.min(alpha.x + alpha.width, x + width)) - 1);
		alpha.doory = y - 1;
		roomSettings.push(alpha);

		const bravo = { height: _.random(min, max), width: _.random(min, max) };
		bravo.x = x + width + 1;
		bravo.y = _.random(y, height + y - 1);
		bravo.doorx = bravo.x - 1;
		bravo.doory = _.random(bravo.y, (Math.min(bravo.y + bravo.height, y + height)) - 1);
		roomSettings.push(bravo);

		const charlie = { height: _.random(min, max), width: _.random(min, max) };
		charlie.x = _.random(x, width + x - 1);
		charlie.y = y + height + 1;
		charlie.doorx = _.random(charlie.x, (Math.min(charlie.x + charlie.width, x + width)) - 1);
		charlie.doory = y + height;
    charlie.id='S';
		roomSettings.push(charlie);

		const delta = { height: _.random(min, max), width: _.random(min, max) };
		delta.x = x - delta.width - 1;
		delta.y = _.random(y, height + y - 1);
		delta.doorx = x - 1;
		delta.doory = _.random(delta.y, (Math.min(delta.y + delta.height, y + height)) - 1);
    delta.id='W';
		roomSettings.push(delta);
		const createdRooms = [];

		roomSettings.forEach(room => {
			if (checkRoomLocation(grid, room)) {
				grid = createMap(grid, room);
				grid = createMap(grid, {x: room.doorx, y: room.doory}, 'door');
				createdRooms.push(room);
			}
		});
		return {grid, createdRooms};
	}; //roomTemplate

//////////////////////////////////////////////BUILD MAP////////////////////////////////////
	let grid = [];
	const [min, max] = roomRange;
	for (let i = 0; i < boardHeight; i++) {
		grid.push([]);
		for (let j = 0; j < boardWidth; j++) {
			grid[i].push({type: 0, opacity: 1});
		}  //for loop
	} //for loop
	const starterRoom = {
		x: _.random(1, boardWidth - max - 15),
		y: _.random(1, boardHeight - max - 15),
		height: _.random(min, max),
		width: _.random(min, max),
	}; //starterRoom

	grid = createMap(grid, starterRoom);

	const addRooms = (grid, roomSpawn, counter = 1, numberOfRooms) => {
		if (counter + roomSpawn.length > numberOfRooms || !roomSpawn.length) {
			return grid;
		}
		grid = roomTemplate(grid, roomSpawn.pop());
		roomSpawn.push(...grid.createdRooms);
		counter += grid.createdRooms.length;
		return addRooms(grid.grid, roomSpawn, counter);
	}; //addRooms
	return addRooms(grid, [starterRoom]);

}; //createDungeon
///////////////////////////////////////////AVATAR CREATE//////////////////////////////////
const createAvatars = (dungeonArea, level = 1) => {
	let playerXYLocation = [];
	const bossLoad = [];
	const enemyLoad = [];
	const portal = [];
	const playerLoad = [ {type: 'player'}];
	const weapons = [];
	const energy = [];
	const weaponTypes = [{name: 'Wooden Spear',damage: 15},{name: 'Baseball Bat',damage: 19},{name: 'Machete',damage: 26},{name: 'Hand Gun',damage: 30},
			{name: 'Rifle ',damage: 36},{name: 'Bazooka',damage: 46}];
	let avatarPlacement = [enemyLoad, energy, weapons, portal, playerLoad, bossLoad];
	//Gets the weapons.
	const weaponDamage = weaponTypes.filter(weapon => weapon.damage < level * 10 + 10).filter(weapon => weapon.damage > level * 10 - 10);
	if(level === 4){
		bossLoad.push({
			energy: 400,
			level: 5,
			type: 'boss'
		});
	}
	//Establishes enemyLoad
	for (let i = 0; i < 7; i++){
		enemyLoad.push({
			energy: level * 30 + 40,
			level: _.random(level,_.random(level - 1 ? level - 1 : level, level + 1 )),
			type: 'enemy'
		});
	}
	//Establishes portal
	if (level < 4) {
		portal.push({
			type: 'portal'
		});
	}
	for(let i = 0; i < 5; i++){
		energy.push({type: 'energy'});
	}
	//Establishes weapons
	for (let i = 0; i < 3; i++) {
	const weapon = Object.assign({}, weaponDamage[_.random(0, weaponDamage.length - 1)]);
		weapon.type = 'weapon';
		weapons.push(weapon);
	}

	avatarPlacement.forEach(avatars => {
		while (avatars.length){
			const x = Math.floor(Math.random() * boardWidth);
			const y = Math.floor(Math.random() * boardHeight);
			if (dungeonArea[y][x].type === 'floor'){
				if(avatars[0].type === 'player'){
						playerXYLocation = [x, y];

				}
				//with each successful floor placement of avatars we pop off the last item in the avatars array
				dungeonArea[y][x] = avatars.pop();
			}
		}
	});

	for (let i = 0; i < dungeonArea.length; i++) {
		for (let j = 0; j < dungeonArea[0].length; j++){
			if (dungeonArea[i][j].type === 'door'){
					dungeonArea[i][j].type = 'floor';
			}
		}
	}
	// finally we return an object with the newly created dungeonArea and the playerXYLocation
	return {avatars: dungeonArea, playerXYLocation};

} //createAvatars
//////////////////////////////REDUX ACTION-CREATORS ///////////////////////////////
function createLevel(level) {
	return {
		type: 'CREATE_LEVEL',
		payload: createAvatars(createDungeon(), level)
	};
}
function energyChange(payload) {
	return {
		type: 'ENERGY_CHANGE',
		payload
	}
}
function loadWeapon(payload) {
	return {
		type: 'LOAD_WEAPON',
		payload
	}
}
function xpPoints(payload) {
	return {
		type: 'XP_POINTS',
		payload
	}
}
function itemChange(entity, coords) {
	return {
		type: 'ITEM_CHANGE',
		payload: { entity, coords}
	};
}
function playerLocation(payload) {
	return {
		type: 'PLAYER_LOCATION',
		payload
	}
}
function newMessage(payload) {
	return {
		type: 'NEW_MESSAGE',
		payload
	}
}
function setDungeonLevel(payload) {
	return {
		type: 'SET_DUNGEON_LEVEL',
		payload
	}
}
function toggleFog() {
	return {
		type: 'TOGGLE_FOG',
	}
}
function restart() {
	return {
		type: 'RESTART',
	}
}
/////////////////////////////////// PLAYER INPUT & OUTPUT /////////////////////////////////////
const avatarMovement = (axis) => {
	return (dispatch, getState) => {
		const actions=[];
		const { grid, player} = getState();
		const [x, y] = grid.playerXYLocation.slice(0);
		const [axisX, axisY ]= axis;
		const newLocation = [axisX + x, axisY + y];
		const newPlayer = grid.avatars[y][x];
		const direction = grid.avatars[y + axisY][x + axisX];


		if (direction.type && direction.type !== 'enemy' && direction.type !== 'boss') {
			actions.push(
				itemChange({ type: 'floor' }, [x, y]),
				itemChange(newPlayer, newLocation),
				playerLocation(newLocation)
			);
		}
		switch (direction.type) {
			case 'boss':
			case 'enemy': {
				const playerLevel = Math.floor(player.xp / 100);
				const enemyEnergy = Math.floor(player.weapon.damage * _.random(1, 1.3) * playerLevel);
				direction.energy -= enemyEnergy;

				if (direction.energy > 0) {
					const playerEnergy = Math.floor(_.random(4, 8) * direction.level);
					actions.push(
						itemChange(direction, newLocation),
						energyChange(player.energy - playerEnergy),
						newMessage(`Enemy has [${direction.energy}] energy remaining.`)
					);

				if (player.energy - playerEnergy <= 0) {
					dispatch(energyChange(0));
					setTimeout(() => dispatch(setDungeonLevel('died')), 250);
					setTimeout(() => dispatch(newMessage(`YOU ARE DEAD`)),
					1000);
					setTimeout(() => dispatch(batchActions([
						restart(), createLevel(1), setDungeonLevel(1)
					])),
					2000);
					return;
				}
			} //if statement

			if (direction.energy <= 0) {
				if (direction.type === 'boss') {
					actions.push(
						xpPoints(10),
						itemChange({ type: 'floor'}, [x, y]),
						itemChange(newPlayer, newLocation),
						playerLocation(newLocation),
						newMessage('You defeated the Boss')
					);
						setTimeout(() => dispatch(setDungeonLevel('winner')), 250);
						setTimeout(() => dispatch(newMessage(`THE BOSS IS DEAD!`)),
						1000);
						setTimeout(() => dispatch(batchActions([
							restart(), createLevel(1), setDungeonLevel(1)
						])),
						2000);
					} else {
						actions.push(
							xpPoints(10),
							itemChange({ type: 'floor'}, [x, y]),
							itemChange(newPlayer, newLocation),
							playerLocation(newLocation),
							newMessage(`You defeated the Enemy`)
						);
						if ((player.xp + 10) % 100 === 0) {
							setTimeout(() => dispatch(newMessage(`Level Up`)), 3000);
						}
					}
				}
				break;
			}
			case 'portal':
				setTimeout(() => dispatch(batchActions([
					setDungeonLevel(grid.dungeonLevel + 1),
					createLevel(grid.dungeonLevel + 1)
				])), 2000);
				actions.push(
					newMessage(`Dungeon Level: ${grid.dungeonLevel + 1}`)
				);
				// setTimeout(() => dispatch(setDungeonLevel(`transit-${grid.dungeonLevel + 1}`)), 250);
				break;
			case 'energy':
				actions.push(
				energyChange(player.energy + 40),
				newMessage('Your Energy has Increased')
			);
			break;
			case 'weapon':
				actions.push(
					loadWeapon(direction),
					newMessage(`You now have a ${direction.name}`)
				);
				break;
			default:
				break;
		}
		dispatch(batchActions(actions));
	};

}; //avatarMovement

const restartGame = () => {
	return (dispatch) => {
		dispatch(newMessage(`Resetting Dungeon`));
		setTimeout(() => dispatch(batchActions([
			restart(), createLevel(1), setDungeonLevel(1)
		])),
		1000);
	};
} //restartGame

const Cell = ({ cell, distance, visible, zone }) => {
	let opacityValue = cell.opacity;
	let value;
	if (visible && distance > 14) {
		opacityValue = 0;
	} else if (visible && distance > 9){
		value = _.random(0, 0.06);
		console.log(value);
		opacityValue = value;
	}
	else if (visible && distance > 6){
	 value = _.random(0.1, 0.8)
	 opacityValue = value;
 }
	else if (cell.type !== 0) {
		opacityValue = 1;
	}

	return (
		<div
			className={cell.type ? `${cell.type} cell` : `bckgrnd-${zone} cell`}
			style={{opacity: opacityValue}}
			/>
	);
}; //Cell

const Header = ({level}) => {
	return (
		<div>
		<div className="titleArea">
			<h1>
				<span
					className={`title title-${level}`}
					>
				DUNGEON CRAWLER
				</span>
			</h1>
			</div>
			<div className="titleArea">
			<p>Move with WASD -or- Arrow Keys</p>
		</div>
		</div>
	);
}; //Header

const Score = ({ colorClass, title, value }) => {
	return (
		<div className="legendDetails">
			<div className={`colorIcon cell ${colorClass}`}/>
			<span>{`${title}: ${value}`}</span>
		</div>
	);
}; //Score

class Area extends Component {
	constructor() {
		super();
		this.state = {
			areaWidth: 0,
			areaHeight: 0
		};

		this.handleKeyPress = this.handleKeyPress.bind(this);
		this.handleResize = this.handleResize.bind(this);
		this.heightAbove = 5;
		this.minHeight = 22;
		this.viewWidth = 30;
		this.viewHeight = 21;
	}

	componentWillMount() {
		// set the initial veiwport size
		const areaWidth = window.innerWidth / this.viewWidth;
		const areaHeight = Math.max(
			this.minHeight,
			(window.innerHeight / this.viewHeight) - this.heightAbove
		);
		this.setState({ areaWidth, areaHeight });
		this.props.createLevel();
		this.props.setDungeonLevel(1);
	}

	componentDidMount() {
		window.addEventListener('keydown', _.throttle(this.handleKeyPress, 100));
		window.addEventListener('resize', _.debounce(this.handleResize, 500));
		// this.props.triggerOpeningMessages();
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', _.throttle(this.handleKeyPress, 100));
		window.removeEventListener('resize', _.debounce(this.handleResize, 500));
	}

	handleKeyPress(e) {
		if (typeof (this.props.grid.dungeonLevel) === 'number') {
			switch (e.keyCode) {
				// alpha
				case 38:
				case 87:
					this.props.avatarMovement([0, -1]);
					break;
				// bravo
				case 39:
				case 68:
					this.props.avatarMovement([1, 0]);
					break;
				// charlie
				case 40:
				case 83:
					this.props.avatarMovement([0, 1]);
					break;
				// delta
				case 37:
				case 65:
					this.props.avatarMovement([-1, 0]);
					break;
				default:
					return;
			}
		}
	}
	handleResize(e) {
		const areaWidth = e.target.innerWidth / this.viewWidth;
		const areaHeight = Math.max(
			this.minHeight,
			(e.target.innerHeight / this.viewHeight) - this.heightAbove
		);
		this.setState({ areaWidth, areaHeight });
	}

		render() {
			// ensure the viewport height and width is always even
			const areaHeight = this.state.areaHeight - this.state.areaHeight % 2;
			const areaWidth = this.state.areaWidth - this.state.areaWidth % 2;
			const { avatars } = this.props.grid;
			const [ playerX, playerY ] = this.props.grid.playerXYLocation;
			const top = _.clamp(playerY - areaHeight / 2, 0, avatars.length - areaHeight);
			const right = Math.max(playerX + areaWidth / 2, areaWidth);
			const bottom = Math.max(playerY + areaHeight / 2, areaHeight);
			const left = _.clamp(playerX - areaWidth / 2, 0, avatars[0].length - areaWidth);

			const newavatars = avatars.map((row, i) => row.map((cell, j) => {
				cell.distanceFromPlayer = (Math.abs(playerY - i)) + (Math.abs(playerX - j));
				return cell;
			}));

			const cells = newavatars.filter((row, i) => i >= top && i < bottom)
			.map((row, i) => {
				return (
					<div key={i} className="row">
						{
							row
							.filter((row, i) => i >= left && i < right)
							.map((cell, j) => {
								return (
									<Cell
										key={j}
										cell={cell}
										distance={cell.distanceFromPlayer}
										zone={this.props.grid.dungeonLevel}
										visible={this.props.fogMode}
										/>
								);
							})
						}
					</div>
				);
			});

			return (
				<div className="grid-wrapper">
						{cells}
				</div>
			);
		}
	} //Area

	const mapStateToGameProps = ({ inputs, grid, player }) => {
		return { fogMode: inputs.fogMode, grid, player };
	};

	const mapDispatchToGameProps = (dispatch) => {
		return {
			avatarMovement: (axis) => dispatch(avatarMovement(axis)),
			createLevel: () => dispatch(createLevel()),
			setDungeonLevel: (level) => dispatch(setDungeonLevel(level)),
		};
	};

const Action = connect(mapStateToGameProps, mapDispatchToGameProps)(Area);

const Messages_ = ({ messages }) => {
return (
	<div>
	<div className="messageArea">		<p>Message Board</p></div>
	<hr></hr>
	<div className=" messages">
		<ul>
			{
				messages.slice(-4).map((msg, i) => {
					return <li key={i}>{msg}</li>;
				})
			}
		</ul>
	</div>
	</div>
);
};

const mapStateToMessagesProps = ({ inputs }) => {
return {messages: inputs.messages};
};

const Messages = connect(mapStateToMessagesProps)(Messages_);


class PlayerSettings_ extends Component {
	constructor() {
		super();
		this.handleKeyPress = this.handleKeyPress.bind(this);
	}

	componentDidMount() {
		window.addEventListener('keydown', this.handleKeyPress);
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', this.handleKeyPress);
	}

	render() {
		const { fogMode, restartGame, toggleFog } = this.props;
		return (
			<div className="panel">
				<div className="legendDetails">
					<button
						onClick={toggleFog}
						type="button"
						checked={fogMode}>
					Toggle Fog
					</button>

					<button  onClick={restartGame} >
						Restart
					</button>
				</div>
			</div>
		);
	}

	handleKeyPress(e) {
		switch (e.keyCode) {
			// north
			case 70:
				this.props.toggleFog();
				break;
			case 82:
				this.props.restartGame();
				break;
			default:
				return;
		}
	}
} //PlayerSettings_

const mapStateToPlayerSettingsProps = ({ inputs }) => {
	return { fogMode: inputs.fogMode };
};

const mapDispatchToPlayerSettingsProps = (dispatch) => {
	return {
		toggleFog: () => dispatch(toggleFog()),
		restartGame: () => dispatch(restartGame())
	};
};

const PlayerSettings = connect(mapStateToPlayerSettingsProps, mapDispatchToPlayerSettingsProps)(PlayerSettings_);

const ScoreBoard = ({grid, player}) => {
	return (
		<div>
		<div className="panel scoreboard">

		<Score

			title="Points to level up"
			value={100 - player.xp % 100}
			/>
		<Score
			colorClass="player"
			title="Player Level"
			value={Math.floor(player.xp / 100)}
			/>
		<Score
			colorClass="energy"
			title="Health"
			value={player.energy}
			/>
		<Score
			colorClass={`bckgrnd-${grid.dungeonLevel}`}
			title="Dungeon"
			value={grid.dungeonLevel}
			/>
		<Score
			colorClass="weapon"
			title={"Weapon"}
			value={`${player.weapon.name} (DMG: ${player.weapon.damage})`}
			/>
		</div>
		<div className="panel scoreboard" >
		<Score
			colorClass="portal"
			title="Exit"
			value= ""
			/>
		<Score
			colorClass="enemy"
			title="Enemy"
			value= ""
			/>
		<Score
			colorClass="boss"
			title="Boss"
			value= ""
			/>
		</div>
		</div>
	);
};

const App_ = (props) => {
	return (
		<div>
			<Header level={ props.grid.dungeonLevel}/>
			<div id="app">
				<div className="legend">
					<ScoreBoard player={props.player} grid={props.grid}/>
					 <PlayerSettings/>
				</div>
				<Action/>
				<div className="msgboard">
					 <Messages/>
				</div>
			</div>
		</div>
	);
};

const mapStateToAppProps = ({ grid, player }) => {
	return { grid, player };
};

const App = connect(mapStateToAppProps)(App_);


const initialState = { avatars:[[]], dungeonLevel: 0, playerXYLocation: [] };
//REDUCERS
const grid = (state = initialState, { type, payload }) => {
	switch (type) {
		case 'ITEM_CHANGE': {
			const [x, y] = payload.coords;
			const avatars = update(state.avatars, {
				[y]: { [x]: {$set: payload.entity }
				}
			});
			return { ...state, avatars };
		}

		case 'PLAYER_LOCATION':
			return { ...state, playerXYLocation: payload };

		case 'CREATE_LEVEL':
			return {...state,playerXYLocation: payload.playerXYLocation, avatars: payload.avatars};

		case 'SET_DUNGEON_LEVEL':
			return { ...state, dungeonLevel: payload };
		default:
			return state;
	}
};


const playerInitialState = {
	energy: 100,
	xp: 100,
	weapon: {
		name: 'Wooden Spear',
		damage: 15
	}
};// playerInitialState

const player = (state = playerInitialState, { type, payload }) => {
	switch (type) {
		case 'LOAD_WEAPON':
			return { ...state, weapon: payload };
		case 'XP_POINTS':
			return { ...state, xp: state.xp + payload };
		case 'ENERGY_CHANGE':
			return { ...state, energy: payload };
		case 'RESTART':
			return playerInitialState;
		default:
			return state;
	}
}; //player

const messages = [];

const inputState = {
	fogMode: true,
	messages
};

const inputs = (state = inputState, { type, payload }) => {
	switch (type) {
		case 'NEW_MESSAGE':
			return { ...state, messages: [ ...state.messages, payload ]};
		case 'TOGGLE_FOG':
			return { ...state, fogMode: !state.fogMode };
		case 'RESTART':
			return inputState;
		default:
			return state;
	}
};//inputs


const reducers = combineReducers({ grid, player, inputs });

class Starter extends Component{
  render(){
    const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
    return(
      <Provider store={createStoreWithMiddleware(enableBatching(reducers))}>
      <App/>
      </Provider>
    )
  }
} //Starter

export default Starter;
