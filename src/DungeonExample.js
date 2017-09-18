// You may prefer to view the source at https://github.com/thepeted/dungeon-crawler

//REACT & REDUX LIBRARIES SET UP
const { Component } = React;
const { update } = React.addons;
const { createStore, applyMiddleware } = Redux;
const { Provider } = ReactRedux;
const { connect } = ReactRedux;
const { combineReducers } = Redux;
const thunk = ReduxThunk.default;

//redux-batched-actions
const BATCH = 'BATCHING_REDUCER.BATCH';

function batchActions(actions) {
	return {type: BATCH, payload: actions}
}

function enableBatching(reduce) {
	return function batchingReducer(state, action) {
		switch (action.type) {
			case BATCH:
				return action.payload.reduce(batchingReducer, state);
			default:
				return reduce(state, action);
		}
	}
}

// CONSTANTS
const c = {
  GRID_HEIGHT: 60,
  GRID_WIDTH: 80,
  MAX_ROOMS: 15,
  ROOM_SIZE_RANGE: [7, 12],
  STARTING_ROOM_POSITION: [40, 40]
};

// ACTION TYPES
const t = {
  ADD_WEAPON: 'ADD_WEAPON',
  ADD_XP: 'ADD_XP',
  CHANGE_ENTITY: 'CHANGE_ENTITY',
  CHANGE_PLAYER_POSITION: 'CHANGE_PLAYER_POSITION',
  CREATE_LEVEL: 'CREATE_LEVEL',
  MODIFY_HEALTH: 'MODIFY_HEALTH',
  NEW_MESSAGE: 'NEW_MESSAGE',
  RESTART: 'RESTART',
  SET_DUNGEON_LEVEL: 'SET_DUNGEON_LEVEL',
  TOGGLE_FOG_MODE: 'TOGGLE_FOG_MOD'
};

// MAP-CREATOR
const createMap = () => {
	// HELPER FUNCTIONS FOR CREATING THE MAP
	const isValidRoomPlacement = (grid, {x, y, width = 1, height = 1}) => {
		// check if on the edge of or outside of the grid
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
		// all grid cells are clear
		return true;
	};

	const placeCells = (grid, {x, y, width = 1, height = 1}, type = 'floor') => {
		for (let i = y; i < y + height; i++) {
			for (let j = x; j < x + width; j++) {
				grid[i][j] = {type};
			}
		}
		return grid;
	};

	const createRoomsFromSeed = (grid, {x, y, width, height}, range = c.ROOM_SIZE_RANGE) => {
		// range for generating the random room heights and widths
		const [min, max] = range;

		// generate room values for each edge of the seed room
		const roomValues = [];

		const north = { height: _.random(min, max), width: _.random(min, max) };
		north.x = _.random(x, x + width - 1);
		north.y = y - north.height - 1;
		north.doorx = _.random(north.x, (Math.min(north.x + north.width, x + width)) - 1);
		north.doory = y - 1;
		roomValues.push(north);

		const east = { height: _.random(min, max), width: _.random(min, max) };
		east.x = x + width + 1;
		east.y = _.random(y, height + y - 1);
		east.doorx = east.x - 1;
		east.doory = _.random(east.y, (Math.min(east.y + east.height, y + height)) - 1);
		roomValues.push(east);

		const south = { height: _.random(min, max), width: _.random(min, max) };
		south.x = _.random(x, width + x - 1);
		south.y = y + height + 1;
		south.doorx = _.random(south.x, (Math.min(south.x + south.width, x + width)) - 1);
		south.doory = y + height;
		roomValues.push(south);

		const west = { height: _.random(min, max), width: _.random(min, max) };
		west.x = x - west.width - 1;
		west.y = _.random(y, height + y - 1);
		west.doorx = x - 1;
		west.doory = _.random(west.y, (Math.min(west.y + west.height, y + height)) - 1);
		roomValues.push(west);

		const placedRooms = [];
		roomValues.forEach(room => {
			if (isValidRoomPlacement(grid, room)) {
				// place room
				grid = placeCells(grid, room);
				// place door
				grid = placeCells(grid, {x: room.doorx, y: room.doory}, 'door');
				// need placed room values for the next seeds
				placedRooms.push(room);
			}
		});
		return {grid, placedRooms};
	};

	// BUILD OUT THE MAP

	// 1. make a grid of 'empty' cells, with a random opacity value (for styling)
	let grid = [];
	for (let i = 0; i < c.GRID_HEIGHT; i++) {
		grid.push([]);
		for (let j = 0; j < c.GRID_WIDTH; j++) {
			grid[i].push({type: 0, opacity: _.random(0.3, 0.8)});
		}
	}

	// 2. random values for the first room
	const [min, max] = c.ROOM_SIZE_RANGE;
	const firstRoom = {
		x: _.random(1, c.GRID_WIDTH - max - 15),
		y: _.random(1, c.GRID_HEIGHT - max - 15),
		height: _.random(min, max),
		width: _.random(min, max)
	};

	// 3. place the first room on to grid
	grid = placeCells(grid, firstRoom);

	// 4. using the first room as a seed, recursivley add rooms to the grid
	const growMap = (grid, seedRooms, counter = 1, maxRooms = c.MAX_ROOMS) => {
		if (counter + seedRooms.length > maxRooms || !seedRooms.length) {
			return grid;
		}

		grid = createRoomsFromSeed(grid, seedRooms.pop());
		seedRooms.push(...grid.placedRooms);
		counter += grid.placedRooms.length;
		return growMap(grid.grid, seedRooms, counter);
	};
	return growMap(grid, [firstRoom]);
};

// ENTITY-CREATOR

const populateEntities = (gameMap, level = 1) => {
	// 1. create the entities
	const bosses = [];
	if (level === 4) {
		bosses.push({
			health: 400,
			level: 5,
			type: 'boss'
		});
	}

	const enemies = [];
	for (let i = 0; i < 7; i++) {
		enemies.push({
			health: level * 30 + 40,
			// half of the enememies will be a level higher or lower (except on
			// level 1, where ~1/4 enemies are a level higher)
			level: _.random(level, _.random(level - 1 ? level - 1 : level, level + 1)),
			type: 'enemy'
		});
	}

	const exits = [];
	if (level < 4) {
		exits.push({
			type: 'exit'
		});
	}

	const players = [
		{
			type: 'player'
		}
	];

	const potions = [];
	for (let i = 0; i < 5; i++) {
		potions.push({ type: 'potion' });
	}

	const weaponTypes = [
		{
			name: 'Laser Pistol',
			damage: 15
		},
		{
			name: 'Laser Rifle',
			damage: 19
		},
		{
			name: 'Plasma Pistol',
			damage: 26
		},
		{
			name: 'Plasma Rifle',
			damage: 28
		},
		{
			name: 'Electric ChainSaw',
			damage: 31
		},
		{
			name: 'Railgun',
			damage: 33
		},
		{
			name: 'Dark Energy Cannon',
			damage: 40
		},
		{
			name: 'B.F.G',
			damage: 43
		}
	];

	const weapons = [];
	// weapon types will vary based on the level passed to the parent function
	const qualifying = weaponTypes
		.filter(weapon => weapon.damage < level * 10 + 10)
			.filter(weapon => weapon.damage > level * 10 - 10);
	for (let i = 0; i < 3; i++) {
		const weapon = Object.assign({}, qualifying[_.random(0, qualifying.length - 1)]);
		weapon.type = 'weapon';
		weapons.push(weapon);
	}

	// 2. randomly place all the entities on to floor cells on the game map.

	// we'll need to return the players starting co-ordinates
	let playerPosition = [];
	[potions, enemies, weapons, exits, players, bosses].forEach(entities => {
		while (entities.length) {
			const x = Math.floor(Math.random() * c.GRID_WIDTH);
			const y = Math.floor(Math.random() * c.GRID_HEIGHT);
			if (gameMap[y][x].type === 'floor') {
				if (entities[0].type === 'player') {
					playerPosition = [x, y];
				}
				gameMap[y][x] = entities.pop();
			}
		}
	});

	// 3. we can now replace doors with floors
	for (let i = 0; i < gameMap.length; i++) {
		for (let j = 0; j < gameMap[0].length; j++) {
			if (gameMap[i][j].type === 'door') {
				gameMap[i][j].type = 'floor';
			}
		}
	}
	return {entities: gameMap, playerPosition};
};

//ACTION-CREATORS
function addWeapon(payload) {
	return {
		type: t.ADD_WEAPON,
		payload
	};
}

function addXP(payload) {
	return {
		type: t.ADD_XP,
		payload
	};
}

function changeEntity(entity, coords) {
	return {
		type: t.CHANGE_ENTITY,
		payload: { entity, coords }
	};
}

function changePlayerPosition(payload) {
	return {
		type: t.CHANGE_PLAYER_POSITION,
		payload
	};
}

function createLevel(level) {
	return {
		type: t.CREATE_LEVEL,
		payload: populateEntities(createMap(), level)
	};
}

function modifyHealth(payload) {
	return {
		type: t.MODIFY_HEALTH,
		payload
	};
}

function newMessage(payload) {
	return {
		type: t.NEW_MESSAGE,
		payload
	};
}

function restart() {
	return {
		type: t.RESTART
	};
}

function setDungeonLevel(payload) {
	return {
		type: t.SET_DUNGEON_LEVEL,
		payload
	};
}

function toggleFogMode() {
	return {
		type: t.TOGGLE_FOG_MODE
	};
}

// a thunk!
const playerInput = (vector) => {
	return (dispatch, getState) => {
		const { grid, player } = getState();

		// cache some useful variables
		const [ x, y ] = grid.playerPosition.slice(0); // get current location
		const [ vectorX, vectorY ] = vector; // get direction modifier
		const newPosition = [vectorX + x, vectorY + y]; // define where we're moving to
		const newPlayer = grid.entities[y][x];
		const destination = grid.entities[y + vectorY][x + vectorX]; // whats in the cell we're heading to
		// store the actions in array to be past to batchActions
		const actions = [];

		// move the player unless destination is an enemy or a '0' cell
		if (destination.type && destination.type !== 'enemy' && destination.type !== 'boss') {
			actions.push(
				changeEntity({ type: 'floor' }, [x, y]),
				changeEntity(newPlayer, newPosition),
				changePlayerPosition(newPosition)
			);
		}
		switch (destination.type) {
			case 'boss':
			case 'enemy': {
				const playerLevel = Math.floor(player.xp / 100);
				// player attacks enemy
				const enemyDamageTaken = Math.floor(player.weapon.damage * _.random(1, 1.3) * playerLevel);
				destination.health -= enemyDamageTaken;

				if (destination.health > 0) {
					// enemy attacks player
					const playerDamageTaken = Math.floor(_.random(4, 7) * destination.level);

					actions.push(
						changeEntity(destination, newPosition),
						modifyHealth(player.health - playerDamageTaken),
						newMessage(`FIGHT! You hurt the enemy with attack of [${enemyDamageTaken}].	The enemy hits back with an attack of [${playerDamageTaken}].  Enemy has [${destination.health}] health remaining.`)
					);

					if (player.health - playerDamageTaken <= 0) {
						// player dies
						dispatch(modifyHealth(0));
						setTimeout(() => dispatch(setDungeonLevel('death')), 250);
						setTimeout(() => dispatch(newMessage(`YOU DIED`)),
						1000);
						setTimeout(() => dispatch(newMessage(`Everything goes dark..`)),
						2000);
						setTimeout(() => dispatch(newMessage(`You resolve to try harder next time`)),
						4000);
						setTimeout(() => dispatch(newMessage(`The grid resets itself....`)),
						6000);
						setTimeout(() => dispatch(batchActions([
							restart(), createLevel(1), setDungeonLevel(1)
						])),
						8000);
						return;
					}
				}

				if (destination.health <= 0) {
					// the fight is over and the player has won
					// add XP and move the player
					if (destination.type === 'boss') {
						actions.push(
							addXP(10),
							changeEntity({ type: 'floor'}, [x, y]),
							changeEntity(newPlayer, newPosition),
							changePlayerPosition(newPosition),
							newMessage(`VICTORY! Your attack of [${enemyDamageTaken}] is too powerful for the enemy, who dissolves before your very eyes.`)
						);
						setTimeout(() => dispatch(setDungeonLevel('victory')), 250);
						setTimeout(() => dispatch(newMessage(`YOU DEFATED THE BOSS!`)),
						1000);
						setTimeout(() => dispatch(newMessage(`The BOSS emits an almighty scream`)),
						2000);
						setTimeout(() => dispatch(newMessage(`You bask momentarily in your glory`)),
						4000);
						setTimeout(() => dispatch(newMessage(`The grid resets itself....`)),
						6000);
						setTimeout(() => dispatch(batchActions([
							restart(), createLevel(1), setDungeonLevel(1)
						])),
						8000);
					} else {
						actions.push(
							addXP(10),
							changeEntity({ type: 'floor'}, [x, y]),
							changeEntity(newPlayer, newPosition),
							changePlayerPosition(newPosition),
							newMessage(`VICTORY! Your attack of [${enemyDamageTaken}] is too powerful for the enemy, who dissolves before your very eyes.`)
						);
						setTimeout(() => dispatch(newMessage(`You gain 10XP and feel yourself growing stronger..`)),
						2500);
						if ((player.xp + 10) % 100 === 0) {
							setTimeout(() => dispatch(newMessage(`LEVEL UP!`)), 5000);
						}
					}
				}
				break;
			}
			case 'exit':
				setTimeout(() => dispatch(batchActions([
					setDungeonLevel(grid.dungeonLevel + 1),
					createLevel(grid.dungeonLevel + 1)
				])), 3000);
				actions.push(
					newMessage(`The cells start to shift... you transit to zone ${grid.dungeonLevel + 1}`)
				);
				setTimeout(() => dispatch(setDungeonLevel(`transit-${grid.dungeonLevel + 1}`)), 250);
				break;
			case 'potion':
				actions.push(
					modifyHealth(player.health + 30),
					newMessage(`You drink a potion for [30] health`)
				);
				break;
			case 'weapon':
				actions.push(
					addWeapon(destination),
					newMessage(`You pick up a ${destination.name}`)
				);
				break;
			default:
				break;
		}
		dispatch(batchActions(actions));
	};
};

const openingMessages = () => {
	return (dispatch) => {
		dispatch(newMessage(`Welcome to The Grid...`));
		setTimeout(() => {
			dispatch(newMessage(`You find yourself in a world filled with strange cells`));
		}, 3000);
		setTimeout(() => {
			dispatch(newMessage(`'Hmm... there must be a way out of here..'`));
		}, 6000);
	};
}

const restartGame = () => {
	return (dispatch) => {
		dispatch(newMessage(`The grid resets itself....`));
		setTimeout(() => dispatch(batchActions([
			restart(), createLevel(1), setDungeonLevel(1)
		])),
		1000);
	};
}

// COMPONENTS
const Cell = ({ cell, distance, visible, zone }) => {
	let opacityValue = cell.opacity;
	if (visible && distance > 10) {
		opacityValue = 0;
	} else if (cell.type !== 0) {
		opacityValue = 1;
	}

	return (
		<div
			className={cell.type ? `${cell.type} cell` : `back-${zone} cell`}
			style={{opacity: opacityValue}}
			/>
	);
};

const Header = ({level}) => {
	return (
		<div className="strip">
			<h1>
				<span
					className={`title title-${level}`}
					>
				THE GRID
				</span> - Roguelike
			</h1>
		</div>
	);
};

const Score = ({ iconClass, title, value }) => {
	return (
		<div className="score-item">
			<div className={`icon cell ${iconClass}`}/>
			<span className="score-label">{`${title}: ${value}`}</span>
		</div>
	);
};


//CONTAINERS

class Game_ extends Component {
	constructor() {
		super();
		this.state = {
			viewportWidth: 0,
			viewportHeight: 0
		};

		this.handleKeyPress = this.handleKeyPress.bind(this);
		this.handleResize = this.handleResize.bind(this);

		this.VP_HEIGHT_OFFSET = 5; // in ems to match elements above this component
		this.VP_MINIMUM_HEIGHT = 22; // in ems
		// set ratios for determining the viewport size
		this.VP_WIDTH_RATIO = 30;
		this.VP_HEIGHT_RATIO = 21;
	}

	componentWillMount() {
		// set the initial veiwport size
		const viewportWidth = window.innerWidth / this.VP_WIDTH_RATIO;
		const viewportHeight = Math.max(
			this.VP_MINIMUM_HEIGHT,
			(window.innerHeight / this.VP_HEIGHT_RATIO) - this.VP_HEIGHT_OFFSET
		);
		this.setState({ viewportWidth, viewportHeight });
		this.props.createLevel();
		this.props.setDungeonLevel(1);
	}

	componentDidMount() {
		window.addEventListener('keydown', _.throttle(this.handleKeyPress, 100));
		window.addEventListener('resize', _.debounce(this.handleResize, 500));
		this.props.triggerOpeningMessages();
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', _.throttle(this.handleKeyPress, 100));
		window.removeEventListener('resize', _.debounce(this.handleResize, 500));
	}

	handleKeyPress(e) {
		if (typeof (this.props.grid.dungeonLevel) === 'number') {
			switch (e.keyCode) {
				// north
				case 38:
				case 87:
					this.props.playerInput([0, -1]);
					break;
				// east
				case 39:
				case 68:
					this.props.playerInput([1, 0]);
					break;
				// south
				case 40:
				case 83:
					this.props.playerInput([0, 1]);
					break;
				// west
				case 37:
				case 65:
					this.props.playerInput([-1, 0]);
					break;
				default:
					return;
			}
		}
	}

	handleResize(e) {
		const viewportWidth = e.target.innerWidth / this.VP_WIDTH_RATIO;
		const viewportHeight = Math.max(
			this.VP_MINIMUM_HEIGHT,
			(e.target.innerHeight / this.VP_HEIGHT_RATIO) - this.VP_HEIGHT_OFFSET
		);
		this.setState({ viewportWidth, viewportHeight });
	}

	render() {
		// ensure the viewport height and width is always even
		const viewportHeight = this.state.viewportHeight - this.state.viewportHeight % 2;
		const viewportWidth = this.state.viewportWidth - this.state.viewportWidth % 2;

		const { entities } = this.props.grid;
		const [ playerX, playerY ] = this.props.grid.playerPosition;

		// define the limits of the cells to be displayed in the viewport
		const top = _.clamp(playerY - viewportHeight / 2, 0, entities.length - viewportHeight);
		const right = Math.max(playerX + viewportWidth / 2, viewportWidth);
		const bottom = Math.max(playerY + viewportHeight / 2, viewportHeight);
		const left = _.clamp(playerX - viewportWidth / 2, 0, entities[0].length - viewportWidth);

		// create a new array of entities which includes the distance from the player
		// used to enable fog mode
		const newEntities = entities.map((row, i) => row.map((cell, j) => {
			cell.distanceFromPlayer = (Math.abs(playerY - i)) + (Math.abs(playerX - j));
			return cell;
		}));

		// create cell components from the entities that are in scope of the viewport
		const cells = newEntities.filter((row, i) => i >= top && i < bottom)
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
}

const mapStateToGameProps = ({ ui, grid, player }) => {
	return { fogMode: ui.fogMode, grid, player };
};

const mapDispatchToGameProps = (dispatch) => {
	return {
		playerInput: (vector) => dispatch(playerInput(vector)),
		createLevel: () => dispatch(createLevel()),
		setDungeonLevel: (level) => dispatch(setDungeonLevel(level)),
		triggerOpeningMessages: () => dispatch(openingMessages())
	};
};

const Game = connect(mapStateToGameProps, mapDispatchToGameProps)(Game_);

class Tips extends Component {
	constructor() {
		super();
		this.state = {
			tips: [
				`Use WASD or arrow keys to move`,
				`Defeat the Boss in Zone 4 to win`,
				`Toggle Fog Mode with the 'F' key`,
				`Restart the game with the 'R' key`,
				`Defeat enemies to increase your XP`,
				`Level up to increase your damage`,
				`A new weapon might not be as good as your current one `,
				`Be sure to gain as much XP as you can in each zone`
			],
			displayIdx: 0,
			intervalId: null
		};
	}

	componentDidMount() {
		let counter = 1;
		const intervalId = setInterval(() => {
			if (counter === this.state.tips.length) {
				counter = 0;
			}
			this.setState({
				displayIdx: counter
			});
			counter++;
		}, 10000);

		this.setState({
			intervalId
		});
	}

	componentWillUnmount() {
		clearInterval(this.state.intervalId);
	}

	render() {
		return (
			<div className="strip">
				<p> Tip: {this.state.tips[this.state.displayIdx]}</p>
			</div>
		);
	}
}

  const Messages_ = ({ messages }) => {
	return (
		<div className="panel messages">
			<ul>
				{
					messages.slice(-3).map((msg, i) => {
						return <li key={i}>{msg}</li>;
					})
				}
			</ul>
		</div>
	);
};

const mapStateToMessagesProps = ({ ui }) => {
	return {messages: ui.messages};
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
		const { fogMode, restartGame, toggleFogMode } = this.props;
		return (
			<div className="panel">
				<div className="score-item">
					<input
						onChange={toggleFogMode}
						id="toggle"
						type="checkbox"
						checked={fogMode}
						/>
					<label htmlFor="toggle">
					Toggle fog mode
					</label>
				</div>
				<div className="score-item">
					<div onClick={restartGame} className="restart-btn"></div>
					<span onClick={restartGame} className="setting-label">Restart</span>
				</div>
			</div>
		);
	}
	handleKeyPress(e) {
		switch (e.keyCode) {
			// north
			case 70:
				this.props.toggleFogMode();
				break;
			case 82:
				this.props.restartGame();
				break;
			default:
				return;
		}
	}
}

const mapStateToPlayerSettingsProps = ({ ui }) => {
	return { fogMode: ui.fogMode };
};

const mapDispatchToPlayerSettingsProps = (dispatch) => {
	return {
		toggleFogMode: () => dispatch(toggleFogMode()),
		restartGame: () => dispatch(restartGame())
	};
};

const PlayerSettings = connect(mapStateToPlayerSettingsProps, mapDispatchToPlayerSettingsProps)(PlayerSettings_);

const ScoreBoard = ({grid, player}) => {
	return (
		<div className="panel scoreboard">
			<Score
				iconClass="potion"
				title="Health"
				value={player.health}
				/>
			<Score
				iconClass={`back-${grid.dungeonLevel}`}
				title="Zone"
				value={grid.dungeonLevel}
				/>
			<Score
				iconClass="weapon"
				title={"Weapon"}
				value={`${player.weapon.name} (DMG: ${player.weapon.damage})`}
				/>
			<Score
				iconClass="player"
				title="Level"
				value={Math.floor(player.xp / 100)}
				/>
			<Score
				iconClass="triangle"
				title="XP to level up"
				value={100 - player.xp % 100}
				/>
		</div>
	);
};

const App_ = (props) => {
	return (
		<div>
			<Header level={ props.grid.dungeonLevel}/>
			<div id="app">
				<Game/>
				<div className="sidebar">
					<ScoreBoard player={props.player} grid={props.grid}/>
					<PlayerSettings/>
					<Messages/>
				</div>
			</div>
			<Tips/>
		</div>
	);
};

const mapStateToAppProps = ({ grid, player }) => {
	return { grid, player };
};

const App = connect(mapStateToAppProps)(App_);

//REDUCERS

const gridInitialState = {
	entities: [[]],
	dungeonLevel: 0,
	playerPosition: []
};

const grid = (state = gridInitialState, { type, payload }) => {
	switch (type) {
		case t.CHANGE_ENTITY: {
			const [x, y] = payload.coords;
			const entities =	update(state.entities, {
				[y]: {
					[x]: {$set: payload.entity }
				}
			});
			return { ...state, entities };
		}
		case t.CHANGE_PLAYER_POSITION:
			return { ...state, playerPosition: payload };
		case t.CREATE_LEVEL:
			return {
				...state,
				playerPosition: payload.playerPosition,
				entities: payload.entities
			};
		case t.SET_DUNGEON_LEVEL:
			return { ...state, dungeonLevel: payload };
		default:
			return state;
	}
};

const playerInitialState = {
	health: 100,
	xp: 100,
	weapon: {
		name: 'Taser',
		damage: 10
	}
};

const player = (state = playerInitialState, { type, payload }) => {
	switch (type) {
		case t.ADD_WEAPON:
			return { ...state, weapon: payload };
		case t.ADD_XP:
			return { ...state, xp: state.xp + payload };
		case t.MODIFY_HEALTH:
			return { ...state, health: payload };
		case t.RESTART:
			return playerInitialState;
		default:
			return state;
	}
};

const messages = [];

const uIInitialState = {
	fogMode: true,
	messages
};

const ui = (state = uIInitialState, { type, payload }) => {
	switch (type) {
		case t.NEW_MESSAGE:
			return { ...state, messages: [ ...state.messages, payload ]};
		case t.TOGGLE_FOG_MODE:
			return { ...state, fogMode: !state.fogMode };
		case t.RESTART:
			return uIInitialState;
		default:
			return state;
	}
};


//COMBINE REDUCERS
const reducers = combineReducers({ grid, player, ui });

//WRAP WITH STORE AND RENDER

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
  ReactDOM.render(
	<Provider store={createStoreWithMiddleware(enableBatching(reducers))}>
		<App/>
	</Provider>
	, document.querySelector('.container'));
