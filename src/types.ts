import type {RGB} from './engine/screen-buffer.ts'

export interface Position {
	x: number
	y: number
}

export interface Stats {
	hp: number
	maxHp: number
	mp: number
	maxMp: number
	atk: number
	def: number
	xp: number
	xpToNext: number
	level: number
	gold: number
}

export interface ItemDef {
	id: string
	name: string
	glyph: string
	color: RGB
	type: 'weapon' | 'armor' | 'potion' | 'key' | 'quest' | 'misc'
	atk?: number
	def?: number
	healHp?: number
	healMp?: number
	description: string
}

export interface GroundItem {
	x: number
	y: number
	item: ItemDef
}

export interface SceneExit {
	x: number
	y: number
	w: number
	h: number
	targetScene: string
	targetX: number
	targetY: number
}

export interface DialogueChoice {
	text: string
	next: string
	action?: () => void
}

export interface DialogueNode {
	text: string
	choices: DialogueChoice[]
}

export interface LootEntry {
	itemId: string
	chance: number
	min: number
	max: number
}
