import {ScreenBuffer} from '../engine/screen-buffer.ts'
import type {MessageLog} from '../systems/messages.ts'
import type {RGB} from '../engine/screen-buffer.ts'
import type {Player} from '../entities/player.ts'
import type {Scene} from '../world/scene.ts'

const GREEN: RGB = [0, 255, 0]
const DARK_GREEN: RGB = [0, 160, 0]
const BLUE: RGB = [68, 102, 255]
const AMBER: RGB = [255, 170, 0]
const RED: RGB = [255, 68, 68]
const DIM: RGB = [100, 100, 100]
const WHITE: RGB = [200, 200, 200]
const BORDER_FG: RGB = [80, 80, 80]
const BG: RGB = [10, 10, 15]

export interface HUDLayout {
	viewportX: number
	viewportY: number
	viewportW: number
	viewportH: number
	sidebarX: number
	sidebarW: number
	topBarH: number
	bottomBarH: number
}

export class HUD {
	static calculateLayout(screenW: number, screenH: number): HUDLayout {
		const sidebarW = 18
		const topBarH = 3
		const bottomBarH = 5
		const viewportW = screenW - sidebarW
		const viewportH = screenH - topBarH - bottomBarH

		return {
			viewportX: 0,
			viewportY: topBarH,
			viewportW,
			viewportH,
			sidebarX: viewportW,
			sidebarW,
			topBarH,
			bottomBarH,
		}
	}

	render(
		buffer: ScreenBuffer,
		player: Player,
		scene: Scene,
		messages: MessageLog,
		layout: HUDLayout,
		_tickCount: number,
	): void {
		const {width, height} = buffer
		const {viewportW, sidebarX, sidebarW, topBarH, bottomBarH} = layout

		// Top bar background
		buffer.fillRect(0, 0, width, topBarH, ' ', WHITE, BG)

		// HP bar
		const hpLabel = `HP `
		buffer.write(1, 0, hpLabel, DIM)
		buffer.drawBar(
			4,
			0,
			18,
			player.stats.hp,
			player.stats.maxHp,
			'\u2588',
			GREEN,
			[5, 5, 5],
		)
		buffer.write(
			23,
			0,
			`${player.stats.hp}/${player.stats.maxHp}`,
			player.stats.hp < player.stats.maxHp * 0.3 ? RED : GREEN,
		)

		// MP bar
		buffer.write(1, 1, 'MP ', DIM)
		buffer.drawBar(
			4,
			1,
			18,
			player.stats.mp,
			player.stats.maxMp,
			'\u2588',
			BLUE,
			[5, 5, 5],
		)
		buffer.write(23, 1, `${player.stats.mp}/${player.stats.maxMp}`, BLUE)

		// XP bar
		buffer.write(1, 2, 'XP ', DIM)
		buffer.drawBar(
			4,
			2,
			18,
			player.stats.xp,
			player.stats.xpToNext,
			'\u2588',
			AMBER,
			[5, 5, 5],
		)
		buffer.write(23, 2, `${player.stats.xp}/${player.stats.xpToNext}`, AMBER)

		// Gold and Level
		buffer.write(42, 0, `Gold: ${player.stats.gold}`, AMBER)
		buffer.write(42, 1, `Lv: ${player.stats.level}`, WHITE)
		buffer.write(42, 2, `ATK:${player.totalAtk} DEF:${player.totalDef}`, DIM)

		// Sidebar border
		for (let y = 0; y < height; y++) {
			buffer.set(sidebarX - 1, y, '\u2551', BORDER_FG) // ║
		}

		// Sidebar background
		buffer.fillRect(sidebarX, 0, sidebarW, height, ' ', DIM, BG)

		// Sidebar — Location
		buffer.write(sidebarX + 1, 0, scene.name.toUpperCase(), GREEN)
		buffer.write(
			sidebarX + 1,
			1,
			scene.description.substring(0, sidebarW - 2),
			DIM,
		)

		// Sidebar — Vitals
		buffer.write(sidebarX + 1, 3, '-- Vitals --', DARK_GREEN)
		const hpPct =
			player.stats.maxHp > 0
				? Math.round((player.stats.hp / player.stats.maxHp) * 100)
				: 0
		buffer.write(
			sidebarX + 1,
			4,
			`HP: ${hpPct}%`,
			player.stats.hp < player.stats.maxHp * 0.3 ? RED : GREEN,
		)
		const mpPct =
			player.stats.maxMp > 0
				? Math.round((player.stats.mp / player.stats.maxMp) * 100)
				: 0
		buffer.write(sidebarX + 1, 5, `MP: ${mpPct}%`, BLUE)

		// Sidebar — Equipment
		buffer.write(sidebarX + 1, 7, '-- Equipment --', DARK_GREEN)
		const weapon = player.equipment.weapon
		const armor = player.equipment.armor
		buffer.write(
			sidebarX + 1,
			8,
			weapon ? weapon.name : 'No weapon',
			weapon ? weapon.color : DIM,
		)
		buffer.write(
			sidebarX + 1,
			9,
			armor ? armor.name : 'No armor',
			armor ? armor.color : DIM,
		)

		// Sidebar — Inventory preview
		buffer.write(sidebarX + 1, 11, '-- Inventory --', DARK_GREEN)
		const invCount = Math.min(player.inventory.length, 6)
		for (let i = 0; i < invCount; i++) {
			const item = player.inventory[i]
			if (item) {
				buffer.write(
					sidebarX + 1,
					12 + i,
					`${item.glyph} ${item.name}`,
					item.color,
				)
			}
		}
		if (player.inventory.length > 6) {
			buffer.write(
				sidebarX + 1,
				18,
				`...+${player.inventory.length - 6} more`,
				DIM,
			)
		}

		// Bottom bar
		buffer.fillRect(
			0,
			height - bottomBarH,
			viewportW,
			bottomBarH,
			' ',
			WHITE,
			BG,
		)
		// Separator line
		for (let x = 0; x < viewportW; x++) {
			buffer.set(x, height - bottomBarH, '\u2500', BORDER_FG)
		}

		// Message log
		const recentMsgs = messages.getRecent(bottomBarH - 1)
		for (let i = 0; i < recentMsgs.length; i++) {
			const msg = recentMsgs[i]
			if (msg) {
				const prefix =
					msg.type === 'combat' ? '> ' : msg.type === 'loot' ? '+ ' : '  '
				const line = (prefix + msg.text).substring(0, viewportW - 2)
				buffer.write(1, height - bottomBarH + 1 + i, line, msg.color)
			}
		}

		// Controls hint at bottom-right of sidebar
		buffer.write(sidebarX + 1, height - 4, '[WASD] Move', DIM)
		buffer.write(sidebarX + 1, height - 3, '[E] Interact', DIM)
		buffer.write(sidebarX + 1, height - 2, '[Tab] Inventory', DIM)
		buffer.write(sidebarX + 1, height - 1, '[ESC] Menu', DIM)
	}
}
