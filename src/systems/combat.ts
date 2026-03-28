import type {Player} from '../entities/player.ts'
import type {Enemy} from '../entities/enemy.ts'
import {createItem} from '../entities/item.ts'
import type {ItemDef} from '../types.ts'

export interface CombatResult {
	damage: number
	killed: boolean
	xpGained: number
	goldGained: number
	loot: ItemDef[]
}

export type CombatState =
	| 'player_turn'
	| 'enemy_turn'
	| 'victory'
	| 'defeat'
	| 'fled'

export class CombatSystem {
	player: Player
	enemy: Enemy
	state: CombatState
	selectedOption: number
	log: string[]

	constructor(player: Player, enemy: Enemy) {
		this.player = player
		this.enemy = enemy
		this.state = 'player_turn'
		this.selectedOption = 0
		this.log = [`A ${enemy.name} blocks your path!`]
	}

	get options(): string[] {
		return ['Attack', 'Use Item', 'Flee']
	}

	moveSelection(dir: number): void {
		this.selectedOption = Math.max(
			0,
			Math.min(this.options.length - 1, this.selectedOption + dir),
		)
	}

	executeAction(): CombatResult | null {
		if (this.state !== 'player_turn') return null

		switch (this.selectedOption) {
			case 0:
				return this.attack()
			case 1:
				return this.useItem()
			case 2:
				return this.flee()
			default:
				return null
		}
	}

	private attack(): CombatResult {
		const dmg = Math.max(
			1,
			this.player.totalAtk -
				this.enemy.stats.def +
				Math.floor(Math.random() * 5) -
				2,
		)
		const actual = this.enemy.takeDamage(dmg)
		this.log.push(`You strike for ${actual} damage.`)

		if (this.enemy.isDead()) {
			this.state = 'victory'
			this.player.stats.xp += this.enemy.xpReward
			this.player.stats.gold += this.enemy.goldReward
			this.log.push(
				`${this.enemy.name} defeated! +${this.enemy.xpReward} XP, +${this.enemy.goldReward} gold`,
			)

			const loot = this.rollLoot()
			for (const item of loot) {
				this.player.pickup(item)
				this.log.push(`Looted: ${item.name}`)
			}

			const leveled = this.player.tryLevelUp()
			if (leveled) {
				this.log.push(`Level up! Now level ${this.player.stats.level}!`)
			}

			return {
				damage: actual,
				killed: true,
				xpGained: this.enemy.xpReward,
				goldGained: this.enemy.goldReward,
				loot,
			}
		}

		this.state = 'enemy_turn'
		return {damage: actual, killed: false, xpGained: 0, goldGained: 0, loot: []}
	}

	private useItem(): CombatResult | null {
		const potions = this.player.inventory.filter(i => i.type === 'potion')
		if (potions.length === 0) {
			this.log.push('No usable items!')
			return null
		}
		const item = potions[0]!
		this.player.useItem(item)
		this.log.push(
			`Used ${item.name}. HP: ${this.player.stats.hp}/${this.player.stats.maxHp}`,
		)
		this.state = 'enemy_turn'
		return null
	}

	private flee(): CombatResult | null {
		const chance = Math.random()
		if (chance > 0.4) {
			this.state = 'fled'
			this.log.push('You fled successfully!')
			return null
		}
		this.log.push('Failed to flee!')
		this.state = 'enemy_turn'
		return null
	}

	enemyTurn(): void {
		if (this.state !== 'enemy_turn') return
		const dmg = this.enemy.attackDamage()
		const actual = Math.max(1, dmg - this.player.totalDef)
		this.player.stats.hp -= actual
		this.log.push(`${this.enemy.name} attacks for ${actual} damage.`)

		if (this.player.stats.hp <= 0) {
			this.player.stats.hp = 0
			this.state = 'defeat'
			this.log.push('You have fallen...')
		} else {
			this.state = 'player_turn'
		}
	}

	private rollLoot(): ItemDef[] {
		const loot: ItemDef[] = []
		for (const entry of this.enemy.lootTable) {
			if (Math.random() < entry.chance) {
				const count =
					entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1))
				for (let i = 0; i < count; i++) {
					try {
						loot.push(createItem(entry.itemId))
					} catch {
						// item not found, skip
					}
				}
			}
		}
		return loot
	}
}
