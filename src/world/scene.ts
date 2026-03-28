import type {GroundItem, SceneExit} from '../types.ts'
import type {RGB} from '../engine/screen-buffer.ts'
import type {Enemy} from '../entities/enemy.ts'
import type {NPC} from '../entities/npc.ts'

export class Scene {
	name: string
	width: number
	height: number
	tiles: string[][]
	tileFg: RGB[][]
	tileBg: RGB[][]
	collision: boolean[][]
	npcs: NPC[]
	enemies: Enemy[]
	items: GroundItem[]
	exits: SceneExit[]
	ambientColor: RGB
	description: string
	animatedTorches: {x: number; y: number}[]

	constructor(
		name: string,
		width: number,
		height: number,
		tiles: string[],
		tileColors: Record<string, {fg: RGB; bg?: RGB}>,
		collisionChars: string,
		ambientColor: RGB,
		description: string,
	) {
		this.name = name
		this.width = width
		this.height = height
		this.ambientColor = ambientColor
		this.description = description
		this.npcs = []
		this.enemies = []
		this.items = []
		this.exits = []
		this.animatedTorches = []

		this.tiles = []
		this.tileFg = []
		this.tileBg = []
		this.collision = []

		for (let y = 0; y < height; y++) {
			const row: string[] = []
			const fgRow: RGB[] = []
			const bgRow: RGB[] = []
			const colRow: boolean[] = []
			const line = tiles[y] ?? ''

			for (let x = 0; x < width; x++) {
				const ch = line[x] ?? ' '
				const tc = tileColors[ch] ?? {fg: [100, 100, 100] as RGB}
				row.push(ch)
				fgRow.push(tc.fg)
				bgRow.push(tc.bg ?? ambientColor)
				colRow.push(collisionChars.includes(ch))
			}
			this.tiles.push(row)
			this.tileFg.push(fgRow)
			this.tileBg.push(bgRow)
			this.collision.push(colRow)
		}
	}

	isSolid(x: number, y: number): boolean {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true
		return this.collision[y]?.[x] ?? true
	}

	getNPCAt(x: number, y: number): NPC | null {
		for (const npc of this.npcs) {
			if (npc.x === x && npc.y === y) return npc
		}
		return null
	}

	getEnemyAt(x: number, y: number): Enemy | null {
		for (const enemy of this.enemies) {
			if (enemy.x === x && enemy.y === y) return enemy
		}
		return null
	}

	getItemAt(x: number, y: number): GroundItem | null {
		for (const item of this.items) {
			if (item.x === x && item.y === y) return item
		}
		return null
	}

	getExitAt(x: number, y: number): SceneExit | null {
		for (const exit of this.exits) {
			if (
				x >= exit.x &&
				x < exit.x + exit.w &&
				y >= exit.y &&
				y < exit.y + exit.h
			) {
				return exit
			}
		}
		return null
	}

	removeEnemy(enemy: Enemy): void {
		const idx = this.enemies.indexOf(enemy)
		if (idx >= 0) this.enemies.splice(idx, 1)
	}

	removeItem(item: GroundItem): void {
		const idx = this.items.indexOf(item)
		if (idx >= 0) this.items.splice(idx, 1)
	}
}
