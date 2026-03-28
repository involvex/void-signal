import type {DialogueSystem} from '../systems/dialogue.ts'
import {ScreenBuffer} from '../engine/screen-buffer.ts'
import type {CombatSystem} from '../systems/combat.ts'
import type {RGB} from '../engine/screen-buffer.ts'
import type {Player} from '../entities/player.ts'

const GREEN: RGB = [0, 255, 0]
const DIM_GREEN: RGB = [0, 120, 0]
const WHITE: RGB = [200, 200, 200]
const DIM: RGB = [100, 100, 100]
const AMBER: RGB = [255, 170, 0]
const RED: RGB = [255, 68, 68]
const BLUE: RGB = [68, 102, 255]
const BG: RGB = [5, 5, 10]

const TITLE_ART = [
	' █████╗ ███████╗ ██████╗██╗██╗    ██████╗ ██████╗  ██████╗ ',
	'██╔══██╗██╔════╝██╔════╝██║██║    ██╔══██╗██╔══██╗██╔════╝ ',
	'███████║███████╗██║     ██║██║    ██║  ██║██████╔╝██║  ███╗',
	'██╔══██║╚════██║██║     ██║██║    ██║  ██║██╔══██╗██║   ██║',
	'██║  ██║███████║╚██████╗██║███████╗██████╔╝██║  ██║╚██████╔╝',
	'╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ',
]

export class Menus {
	static renderTitleScreen(buffer: ScreenBuffer, tickCount: number): void {
		const {width, height} = buffer
		buffer.clear(WHITE, BG)

		const artStartY = Math.floor((height - TITLE_ART.length - 6) / 2)
		const artStartX = Math.floor((width - 60) / 2)

		for (let i = 0; i < TITLE_ART.length; i++) {
			const line = TITLE_ART[i]
			if (line) {
				buffer.write(artStartX, artStartY + i, line, GREEN)
			}
		}

		const subtitle = 'A Narrative Tactical Roguelite'
		buffer.write(
			Math.floor((width - subtitle.length) / 2),
			artStartY + TITLE_ART.length + 1,
			subtitle,
			DIM_GREEN,
		)

		const version = 'v0.1.0'
		buffer.write(
			Math.floor((width - version.length) / 2),
			artStartY + TITLE_ART.length + 2,
			version,
			DIM,
		)

		// Blink "Press ENTER to start"
		if (Math.floor(tickCount / 10) % 2 === 0) {
			const prompt = '[ Press ENTER to start ]'
			buffer.write(
				Math.floor((width - prompt.length) / 2),
				artStartY + TITLE_ART.length + 4,
				prompt,
				AMBER,
			)
		}

		const controls = 'WASD: Move | E: Interact | Tab: Inventory | ESC: Menu'
		buffer.write(
			Math.floor((width - controls.length) / 2),
			height - 2,
			controls,
			DIM,
		)
	}

	static renderInventoryScreen(
		buffer: ScreenBuffer,
		player: Player,
		selectedIndex: number,
	): void {
		const {width, height} = buffer
		buffer.clear(WHITE, BG)

		const title = '== INVENTORY =='
		buffer.write(Math.floor((width - title.length) / 2), 1, title, GREEN)

		buffer.write(4, 3, `Gold: ${player.stats.gold}`, AMBER)
		buffer.write(4, 4, `ATK: ${player.totalAtk}  DEF: ${player.totalDef}`, DIM)

		// Equipment
		buffer.write(4, 6, '-- Equipped --', DIM_GREEN)
		const wep = player.equipment.weapon
		const arm = player.equipment.armor
		buffer.write(
			6,
			7,
			`Weapon: ${wep ? `${wep.name} (+${wep.atk} ATK)` : 'None'}`,
			wep ? wep.color : DIM,
		)
		buffer.write(
			6,
			8,
			`Armor:  ${arm ? `${arm.name} (+${arm.def} DEF)` : 'None'}`,
			arm ? arm.color : DIM,
		)

		// Items
		buffer.write(4, 10, '-- Items --', DIM_GREEN)
		if (player.inventory.length === 0) {
			buffer.write(6, 11, 'Empty', DIM)
		} else {
			const displayCount = Math.min(player.inventory.length, 12)
			for (let i = 0; i < displayCount; i++) {
				const item = player.inventory[i]
				if (!item) continue
				const prefix = i === selectedIndex ? '> ' : '  '
				const stats =
					item.type === 'weapon'
						? `(+${item.atk} ATK)`
						: item.type === 'armor'
							? `(+${item.def} DEF)`
							: item.type === 'potion'
								? `(HP+${item.healHp ?? 0} MP+${item.healMp ?? 0})`
								: ''
				buffer.write(
					6,
					11 + i,
					`${prefix}${item.glyph} ${item.name} ${stats}`,
					i === selectedIndex ? AMBER : item.color,
				)
			}
		}

		buffer.write(4, height - 3, '[ENTER] Use/Equip  [ESC] Close', DIM)
	}

	static renderPauseMenu(buffer: ScreenBuffer, selectedIndex: number): void {
		const {width, height} = buffer
		buffer.clear(WHITE, BG)

		const title = '== PAUSED =='
		buffer.write(
			Math.floor((width - title.length) / 2),
			Math.floor(height / 2) - 3,
			title,
			GREEN,
		)

		const options = ['Resume', 'Quit']
		for (let i = 0; i < options.length; i++) {
			const prefix = i === selectedIndex ? '> ' : '  '
			buffer.write(
				Math.floor((width - options[i]!.length - 4) / 2),
				Math.floor(height / 2) + i,
				`${prefix}${options[i]}`,
				i === selectedIndex ? AMBER : WHITE,
			)
		}
	}

	static renderCombatScreen(buffer: ScreenBuffer, combat: CombatSystem): void {
		const {width, height} = buffer
		buffer.clear(WHITE, BG)

		const title = `-- COMBAT: ${combat.enemy.name} --`
		buffer.write(Math.floor((width - title.length) / 2), 1, title, RED)

		// Enemy HP
		buffer.write(4, 3, `${combat.enemy.name}`, combat.enemy.color)
		buffer.drawBar(
			4,
			4,
			24,
			combat.enemy.stats.hp,
			combat.enemy.stats.maxHp,
			'\u2588',
			RED,
			[30, 5, 5],
		)
		buffer.write(
			29,
			4,
			`${combat.enemy.stats.hp}/${combat.enemy.stats.maxHp}`,
			RED,
		)

		// Player HP
		buffer.write(4, 6, 'You', GREEN)
		buffer.drawBar(
			4,
			7,
			24,
			combat.player.stats.hp,
			combat.player.stats.maxHp,
			'\u2588',
			GREEN,
			[5, 15, 5],
		)
		buffer.write(
			29,
			7,
			`${combat.player.stats.hp}/${combat.player.stats.maxHp}`,
			GREEN,
		)

		// Combat log
		buffer.write(4, 9, '-- Log --', DIM)
		const logLines = combat.log.slice(-5)
		for (let i = 0; i < logLines.length; i++) {
			const line = logLines[i]
			if (line) buffer.write(4, 10 + i, line, WHITE)
		}

		// Action menu
		if (combat.state === 'player_turn') {
			buffer.write(4, 16, '-- Actions --', DIM_GREEN)
			for (let i = 0; i < combat.options.length; i++) {
				const opt = combat.options[i]
				if (!opt) continue
				const prefix = i === combat.selectedOption ? '> ' : '  '
				buffer.write(
					6,
					17 + i,
					`${prefix}${opt}`,
					i === combat.selectedOption ? AMBER : WHITE,
				)
			}
		} else if (combat.state === 'victory') {
			buffer.write(4, 16, 'VICTORY!', GREEN)
			buffer.write(4, 17, 'Press ENTER to continue.', DIM)
		} else if (combat.state === 'defeat') {
			buffer.write(4, 16, 'DEFEATED...', RED)
			buffer.write(4, 17, 'Press ENTER to continue.', DIM)
		} else if (combat.state === 'fled') {
			buffer.write(4, 16, 'Escaped!', AMBER)
			buffer.write(4, 17, 'Press ENTER to continue.', DIM)
		}
	}

	static renderDialogueScreen(
		buffer: ScreenBuffer,
		dialogue: DialogueSystem,
		npcName: string,
		tickCount: number,
	): void {
		const {width, height} = buffer
		buffer.clear(WHITE, BG)

		const node = dialogue.getCurrentNode()
		if (!node) return

		// NPC portrait area
		buffer.write(4, 2, `[ ${npcName} ]`, AMBER)

		// Dialogue text with typewriter effect
		const charsToShow = Math.min(node.text.length, Math.floor(tickCount / 2))
		const visibleText = node.text.substring(0, charsToShow)
		const textLines = []
		for (let i = 0; i < visibleText.length; i += width - 10) {
			textLines.push(visibleText.substring(i, i + width - 10))
		}
		for (let i = 0; i < textLines.length; i++) {
			const line = textLines[i]
			if (line) buffer.write(5, 4 + i, line, WHITE)
		}

		// Choices
		if (charsToShow >= node.text.length) {
			const choiceStartY = 4 + textLines.length + 2
			buffer.write(4, choiceStartY - 1, '--', DIM)
			for (let i = 0; i < node.choices.length; i++) {
				const choice = node.choices[i]
				if (choice) {
					buffer.write(5, choiceStartY + i, `${i + 1}. ${choice.text}`, AMBER)
				}
			}
		}
	}
}
