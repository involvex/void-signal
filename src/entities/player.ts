import type {ItemDef, Stats} from '../types.ts'
import {Entity} from './entity.ts'

export class Player extends Entity {
	stats: Stats
	inventory: ItemDef[]
	equipment: {weapon: ItemDef | null; armor: ItemDef | null}

	constructor(x: number, y: number) {
		super(x, y, '@', [255, 255, 180], 'Player') // warm white/yellow — distinct from NPCs/enemies
		this.stats = {
			hp: 80,
			maxHp: 80,
			mp: 30,
			maxMp: 60,
			atk: 12,
			def: 5,
			xp: 0,
			xpToNext: 100,
			level: 1,
			gold: 25,
		}
		this.inventory = []
		this.equipment = {weapon: null, armor: null}
	}

	get totalAtk(): number {
		return this.stats.atk + (this.equipment.weapon?.atk ?? 0)
	}

	get totalDef(): number {
		return this.stats.def + (this.equipment.armor?.def ?? 0)
	}

	move(dx: number, dy: number): void {
		this.x += dx
		this.y += dy
	}

	pickup(item: ItemDef): void {
		this.inventory.push(item)
	}

	useItem(item: ItemDef): void {
		if (item.type === 'potion') {
			if (item.healHp) {
				this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + item.healHp)
			}
			if (item.healMp) {
				this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + item.healMp)
			}
			const idx = this.inventory.indexOf(item)
			if (idx >= 0) this.inventory.splice(idx, 1)
		} else if (item.type === 'weapon') {
			if (this.equipment.weapon) {
				this.inventory.push(this.equipment.weapon)
			}
			this.equipment.weapon = item
			const idx = this.inventory.indexOf(item)
			if (idx >= 0) this.inventory.splice(idx, 1)
		} else if (item.type === 'armor') {
			if (this.equipment.armor) {
				this.inventory.push(this.equipment.armor)
			}
			this.equipment.armor = item
			const idx = this.inventory.indexOf(item)
			if (idx >= 0) this.inventory.splice(idx, 1)
		}
	}

	tryLevelUp(): boolean {
		if (this.stats.xp >= this.stats.xpToNext) {
			this.stats.xp -= this.stats.xpToNext
			this.stats.level++
			this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.5)
			this.stats.maxHp += 10
			this.stats.hp = this.stats.maxHp
			this.stats.maxMp += 5
			this.stats.mp = this.stats.maxMp
			this.stats.atk += 2
			this.stats.def += 1
			return true
		}
		return false
	}
}
