import {createItem} from '../entities/item.ts'
import {Enemy} from '../entities/enemy.ts'
import {NPC} from '../entities/npc.ts'
import {Scene} from './scene.ts'

type RGBTuple = [number, number, number]

const C = {
	wall: [120, 100, 80] as RGBTuple,
	door: [200, 160, 80] as RGBTuple,
	floor: [80, 80, 90] as RGBTuple,
	grass: [40, 140, 40] as RGBTuple,
	tree: [20, 100, 20] as RGBTuple,
	treeTrunk: [100, 70, 30] as RGBTuple,
	water: [40, 80, 180] as RGBTuple,
	stone: [100, 100, 110] as RGBTuple,
	torch: [255, 200, 50] as RGBTuple,
	npc: [200, 200, 100] as RGBTuple,
	enemy: [255, 60, 60] as RGBTuple,
	item: [255, 200, 0] as RGBTuple,
	exit: [100, 200, 255] as RGBTuple,
	sign: [180, 150, 100] as RGBTuple,
}

function tc(fg: RGBTuple, bg?: RGBTuple) {
	return {fg, bg}
}

// Town map (40x20)
const TOWN_MAP = [
	'╔════════════════════════════════════════╗',
	'║........................................║',
	'║..###...###...###...###..N...............║',
	'║..#.#...#.#...#.#...#.#.................║',
	'║..#+#...#.#...#.#...#.#.................║',
	'║..###...#+#...#+#...#+#.................║',
	'║...........................N............║',
	'║..T.T.T.........T.T.T...................║',
	'║........................................║',
	'║..................@.....................║',
	'║........................................║',
	'║..T.T.T.........T.T.T...................║',
	'║........................................║',
	'║..N.....................................║',
	'║..###...###...###...###.................║',
	'║..#.#...#.#...#.#...#.#.................║',
	'║..#+#...#+#...#+#...#+#.................║',
	'║..###...###...###...###.................║',
	'║........................................║',
	'╚════════════════════════════════════════╝',
]

const TOWN_COLORS: Record<string, {fg: RGBTuple; bg?: RGBTuple}> = {
	'#': tc(C.wall),
	'+': tc(C.door),
	'.': tc(C.floor),
	T: tc(C.tree),
	N: tc(C.npc),
	'@': tc([0, 255, 153]),
	'!': tc(C.item),
	E: tc(C.enemy),
	'╔': tc(C.wall),
	'═': tc(C.wall),
	'╗': tc(C.wall),
	'║': tc(C.wall),
	'╚': tc(C.wall),
	'╝': tc(C.wall),
}

// Forest map (60x25)
const FOREST_MAP: string[] = (() => {
	const lines: string[] = []
	lines.push('╔════════════════════════════════════════════════════════════╗')
	for (let y = 1; y < 24; y++) {
		let line = '║'
		for (let x = 1; x < 59; x++) {
			if (y === 1 && x > 20 && x < 40) {
				line += '.' // path from town
			} else if (x > 25 && x < 35 && y > 10 && y < 15) {
				line += '.' // clearing
			} else {
				const r = Math.random()
				if (r < 0.15) line += 'T'
				else if (r < 0.18) line += 'E'
				else if (r < 0.2) line += '!'
				else line += '.'
			}
		}
		line += '║'
		lines.push(line)
	}
	lines.push('╚════════════════════════════════════════════════════════════╝')
	return lines
})()

const FOREST_COLORS: Record<string, {fg: RGBTuple; bg?: RGBTuple}> = {
	'#': tc(C.wall),
	'.': tc([30, 100, 30], [10, 40, 10]),
	T: tc(C.tree, [10, 40, 10]),
	E: tc(C.enemy),
	'!': tc(C.item),
	N: tc(C.npc),
	'╔': tc([60, 80, 40]),
	'═': tc([60, 80, 40]),
	'╗': tc([60, 80, 40]),
	'║': tc([60, 80, 40]),
	'╚': tc([60, 80, 40]),
	'╝': tc([60, 80, 40]),
}

// Cave map (50x20)
const CAVE_MAP: string[] = (() => {
	const lines: string[] = []
	lines.push('╔══════════════════════════════════════════════════╗')
	for (let y = 1; y < 19; y++) {
		let line = '║'
		for (let x = 1; x < 49; x++) {
			if (y === 1 && x > 20 && x < 30) {
				line += '.' // entrance
			} else if (x > 5 && x < 45 && y > 3 && y < 17) {
				const r = Math.random()
				if (r < 0.06)
					line += '#' // stalactite
				else if (r < 0.1)
					line += 'T' // torch
				else if (r < 0.14) line += 'E'
				else if (r < 0.16) line += '!'
				else line += '.'
			} else {
				line += Math.random() < 0.4 ? '#' : '.'
			}
		}
		line += '║'
		lines.push(line)
	}
	lines.push('╚══════════════════════════════════════════════════╝')
	return lines
})()

const CAVE_COLORS: Record<string, {fg: RGBTuple; bg?: RGBTuple}> = {
	'#': tc([60, 55, 50], [30, 25, 20]),
	'.': tc([100, 95, 90], [20, 18, 15]),
	T: tc(C.torch, [20, 18, 15]),
	E: tc(C.enemy),
	'!': tc(C.item),
	'╔': tc([70, 65, 60]),
	'═': tc([70, 65, 60]),
	'╗': tc([70, 65, 60]),
	'║': tc([70, 65, 60]),
	'╚': tc([70, 65, 60]),
	'╝': tc([70, 65, 60]),
}

// Ruins map (55x22)
const RUINS_MAP: string[] = (() => {
	const lines: string[] = []
	lines.push('╔═════════════════════════════════════════════════════╗')
	for (let y = 1; y < 21; y++) {
		let line = '║'
		for (let x = 1; x < 54; x++) {
			if (y === 21 && x > 20 && x < 35) {
				line += '.'
			} else if (x > 10 && x < 45 && y > 4 && y < 18) {
				const r = Math.random()
				if (r < 0.08) line += '▓'
				else if (r < 0.12) line += 'T'
				else if (r < 0.16) line += 'E'
				else if (r < 0.18) line += '!'
				else line += '.'
			} else {
				line += Math.random() < 0.3 ? '▓' : '.'
			}
		}
		line += '║'
		lines.push(line)
	}
	lines.push('╚═════════════════════════════════════════════════════╝')
	return lines
})()

const RUINS_COLORS: Record<string, {fg: RGBTuple; bg?: RGBTuple}> = {
	'#': tc([80, 50, 120], [14, 4, 48]),
	'.': tc([120, 90, 180], [14, 4, 48]),
	'▓': tc([90, 60, 140], [14, 4, 48]),
	T: tc([255, 180, 40], [14, 4, 48]),
	E: tc(C.enemy),
	'!': tc(C.item),
	'╔': tc([100, 70, 160]),
	'═': tc([100, 70, 160]),
	'╗': tc([100, 70, 160]),
	'║': tc([100, 70, 160]),
	'╚': tc([100, 70, 160]),
	'╝': tc([100, 70, 160]),
}

export function createTownScene(): Scene {
	const scene = new Scene(
		'Town',
		40,
		20,
		TOWN_MAP,
		TOWN_COLORS,
		'#╔═╗║╚╝',
		[20, 18, 25],
		'A quiet settlement at the edge of the void.',
	)

	// NPCs
	scene.npcs.push(
		new NPC(18, 2, 'N', [200, 200, 100], 'Merchant', 'merchant', 'start', true),
	)
	scene.npcs.push(
		new NPC(17, 6, 'N', [180, 150, 100], 'Elder', 'elder', 'start'),
	)
	scene.npcs.push(
		new NPC(28, 6, 'N', [160, 160, 200], 'Guard', 'guard', 'start'),
	)
	scene.npcs.push(new NPC(3, 13, 'N', [150, 200, 150], 'Sage', 'sage', 'start'))

	// Items
	scene.items.push({x: 10, y: 8, item: createItem('health_potion')})
	scene.items.push({x: 30, y: 12, item: createItem('rusty_sword')})

	// Exits — north to forest
	scene.exits.push({
		x: 0,
		y: 0,
		w: 40,
		h: 1,
		targetScene: 'forest',
		targetX: 30,
		targetY: 22,
	})

	// Add torches for animation
	scene.animatedTorches.push({x: 6, y: 5})
	scene.animatedTorches.push({x: 13, y: 5})
	scene.animatedTorches.push({x: 20, y: 5})
	scene.animatedTorches.push({x: 27, y: 5})

	return scene
}

export function createForestScene(): Scene {
	const scene = new Scene(
		'Forest',
		60,
		25,
		FOREST_MAP,
		FOREST_COLORS,
		'╔═╗║╚╝',
		[10, 40, 10],
		'Dense forest with strange signals pulsing through the trees.',
	)

	// Enemies
	scene.enemies.push(
		new Enemy(
			15,
			5,
			'G',
			[255, 60, 60],
			'Glitch Wolf',
			{hp: 40, maxHp: 40, atk: 10, def: 3},
			[{itemId: 'health_potion', chance: 0.4, min: 1, max: 1}],
			30,
			10,
		),
	)
	scene.enemies.push(
		new Enemy(
			40,
			10,
			'G',
			[255, 60, 60],
			'Glitch Wolf',
			{hp: 40, maxHp: 40, atk: 10, def: 3},
			[{itemId: 'health_potion', chance: 0.4, min: 1, max: 1}],
			30,
			10,
		),
	)
	scene.enemies.push(
		new Enemy(
			25,
			18,
			'S',
			[200, 100, 50],
			'Signal Spider',
			{hp: 55, maxHp: 55, atk: 13, def: 5},
			[{itemId: 'echo_core', chance: 0.2, min: 1, max: 1}],
			45,
			15,
		),
	)

	// Items
	scene.items.push({x: 30, y: 12, item: createItem('health_potion')})
	scene.items.push({x: 45, y: 8, item: createItem('ether_flask')})

	// Exits — south to town, north to cave
	scene.exits.push({
		x: 0,
		y: 24,
		w: 60,
		h: 1,
		targetScene: 'town',
		targetX: 20,
		targetY: 2,
	})
	scene.exits.push({
		x: 0,
		y: 0,
		w: 60,
		h: 1,
		targetScene: 'cave',
		targetX: 25,
		targetY: 17,
	})

	return scene
}

export function createCaveScene(): Scene {
	const scene = new Scene(
		'Cave',
		50,
		20,
		CAVE_MAP,
		CAVE_COLORS,
		'╔═╗║╚╝#',
		[20, 18, 15],
		'Dark caverns echo with distant rumbles.',
	)

	// Enemies
	scene.enemies.push(
		new Enemy(
			15,
			8,
			'C',
			[180, 120, 80],
			'Cave Sentinel',
			{hp: 80, maxHp: 80, atk: 15, def: 7},
			[
				{itemId: 'health_potion', chance: 0.5, min: 1, max: 2},
				{itemId: 'echo_core', chance: 0.3, min: 1, max: 1},
			],
			60,
			20,
		),
	)
	scene.enemies.push(
		new Enemy(
			35,
			12,
			'B',
			[150, 80, 80],
			'Bat Swarm',
			{hp: 30, maxHp: 30, atk: 8, def: 2},
			[{itemId: 'ether_flask', chance: 0.3, min: 1, max: 1}],
			20,
			8,
		),
	)

	// Items
	scene.items.push({x: 25, y: 5, item: createItem('signal_blade')})
	scene.items.push({x: 40, y: 15, item: createItem('health_potion')})

	// Torches
	for (let i = 0; i < 6; i++) {
		scene.animatedTorches.push({x: 8 + i * 7, y: 3})
	}

	// Exits — south to forest, north to ruins
	scene.exits.push({
		x: 0,
		y: 19,
		w: 50,
		h: 1,
		targetScene: 'forest',
		targetX: 30,
		targetY: 2,
	})
	scene.exits.push({
		x: 0,
		y: 0,
		w: 50,
		h: 1,
		targetScene: 'ruins',
		targetX: 27,
		targetY: 19,
	})

	return scene
}

export function createRuinsScene(): Scene {
	const scene = new Scene(
		'Void Ruins',
		55,
		22,
		RUINS_MAP,
		RUINS_COLORS,
		'╔═╗║╚╝▓',
		[14, 4, 48],
		'Ancient ruins pulsing with void energy.',
	)

	// Boss enemy
	scene.enemies.push(
		new Enemy(
			27,
			10,
			'V',
			[200, 50, 255],
			'Void Warden',
			{hp: 150, maxHp: 150, atk: 20, def: 10},
			[
				{itemId: 'void_cloak', chance: 1.0, min: 1, max: 1},
				{itemId: 'echo_core', chance: 1.0, min: 1, max: 2},
			],
			200,
			50,
		),
	)

	// Regular enemies
	scene.enemies.push(
		new Enemy(
			15,
			6,
			'E',
			[160, 40, 200],
			'Echo Wraith',
			{hp: 60, maxHp: 60, atk: 14, def: 6},
			[{itemId: 'ether_flask', chance: 0.5, min: 1, max: 1}],
			50,
			18,
		),
	)
	scene.enemies.push(
		new Enemy(
			40,
			14,
			'E',
			[160, 40, 200],
			'Echo Wraith',
			{hp: 60, maxHp: 60, atk: 14, def: 6},
			[{itemId: 'health_potion', chance: 0.5, min: 1, max: 1}],
			50,
			18,
		),
	)

	// Items
	scene.items.push({x: 20, y: 15, item: createItem('health_potion')})
	scene.items.push({x: 35, y: 8, item: createItem('ether_flask')})

	// Torches
	for (let i = 0; i < 8; i++) {
		scene.animatedTorches.push({x: 6 + i * 6, y: 3})
	}

	// Exit south to cave
	scene.exits.push({
		x: 0,
		y: 21,
		w: 55,
		h: 1,
		targetScene: 'cave',
		targetX: 25,
		targetY: 2,
	})

	return scene
}
