import type {RGB} from '../engine/screen-buffer.ts'
import type {LootEntry, Stats} from '../types.ts'
import {Entity} from './entity.ts'

export class Enemy extends Entity {
	stats: Stats
	lootTable: LootEntry[]
	xpReward: number
	goldReward: number
	aggressive: boolean

	constructor(
		x: number,
		y: number,
		glyph: string,
		color: RGB,
		name: string,
		stats: Partial<Stats> & {hp: number; maxHp: number},
		lootTable: LootEntry[] = [],
		xpReward = 20,
		goldReward = 5,
		aggressive = true,
	) {
		super(x, y, glyph, color, name)
		this.stats = {
			hp: stats.hp,
			maxHp: stats.maxHp,
			mp: stats.mp ?? 0,
			maxMp: stats.maxMp ?? 0,
			atk: stats.atk ?? 8,
			def: stats.def ?? 3,
			xp: 0,
			xpToNext: 0,
			level: stats.level ?? 1,
			gold: 0,
		}
		this.lootTable = lootTable
		this.xpReward = xpReward
		this.goldReward = goldReward
		this.aggressive = aggressive
	}

	isDead(): boolean {
		return this.stats.hp <= 0
	}

	takeDamage(amount: number): number {
		const actual = Math.max(0, Math.min(this.stats.hp, amount))
		this.stats.hp -= actual
		return actual
	}

	attackDamage(): number {
		return Math.max(1, this.stats.atk + Math.floor(Math.random() * 5) - 2)
	}
}
