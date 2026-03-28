import type {ItemDef} from '../types.ts'

export const ITEMS: Record<string, ItemDef> = {
	rusty_sword: {
		id: 'rusty_sword',
		name: 'Rusty Sword',
		glyph: '/',
		color: [180, 160, 120] as [number, number, number],
		type: 'weapon',
		atk: 4,
		description: 'A worn blade, still sharp enough to cut.',
	},
	signal_blade: {
		id: 'signal_blade',
		name: 'Signal Blade',
		glyph: '/',
		color: [0, 255, 153] as [number, number, number],
		type: 'weapon',
		atk: 12,
		description: 'A blade humming with static energy.',
	},
	leather_armor: {
		id: 'leather_armor',
		name: 'Leather Armor',
		glyph: '[',
		color: [139, 90, 43] as [number, number, number],
		type: 'armor',
		def: 4,
		description: 'Basic leather protection.',
	},
	void_cloak: {
		id: 'void_cloak',
		name: 'Void Cloak',
		glyph: '[',
		color: [80, 40, 120] as [number, number, number],
		type: 'armor',
		def: 8,
		description: 'A cloak woven from void energy.',
	},
	health_potion: {
		id: 'health_potion',
		name: 'Health Potion',
		glyph: '!',
		color: [255, 60, 60] as [number, number, number],
		type: 'potion',
		healHp: 30,
		description: 'Restores 30 HP.',
	},
	ether_flask: {
		id: 'ether_flask',
		name: 'Ether Flask',
		glyph: '!',
		color: [60, 100, 255] as [number, number, number],
		type: 'potion',
		healMp: 20,
		description: 'Restores 20 MP.',
	},
	town_key: {
		id: 'town_key',
		name: 'Town Key',
		glyph: '\u00b6',
		color: [255, 200, 0] as [number, number, number],
		type: 'key',
		description: 'Opens the gate to the north.',
	},
	echo_core: {
		id: 'echo_core',
		name: 'Echo Core',
		glyph: '\u25c8',
		color: [130, 80, 200] as [number, number, number],
		type: 'quest',
		description: 'A pulsing core of void energy.',
	},
}

export function getItem(id: string): ItemDef | null {
	return ITEMS[id] ?? null
}

export function createItem(id: string): ItemDef {
	const def = ITEMS[id]
	if (!def) throw new Error(`Unknown item: ${id}`)
	return {...def}
}
