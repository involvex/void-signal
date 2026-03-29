import {ArtManager, type ArtPiece} from '../systems/art-manager.ts'
import {InputManager, type KeyAction} from '../engine/input.ts'
import {ScreenBuffer} from '../engine/screen-buffer.ts'
import {DialogueSystem} from '../systems/dialogue.ts'
import {MessageLog} from '../systems/messages.ts'
import {CombatSystem} from '../systems/combat.ts'
import {HUD, type HUDLayout} from '../ui/hud.ts'
import type {Enemy} from '../entities/enemy.ts'
import {Renderer} from '../engine/renderer.ts'
import {WorldManager} from '../world/world.ts'
import {Player} from '../entities/player.ts'
import {Menus} from '../ui/menus.ts'
export type GameState =
	| 'title'
	| 'playing'
	| 'combat'
	| 'dialogue'
	| 'inventory'
	| 'paused'

const TORCH_CHARS = ['\u25b2', '\u25b3', '\u2666', '\u25b2'] // ▲ △ ✦ ▲

export class GameEngine {
	screen: ScreenBuffer
	renderer: Renderer
	input: InputManager
	hud: HUD
	world: WorldManager
	player: Player
	messages: MessageLog
	state: GameState
	tickCount: number
	private intervalId: ReturnType<typeof setInterval> | null
	private combat: CombatSystem | null
	private dialogue: DialogueSystem
	private hudLayout: HUDLayout
	private invSelectedIndex: number
	private pauseSelectedIndex: number
	private artManager: ArtManager
	private heldMove: {dx: number; dy: number} | null
	private heldMoveReceivedAt: number
	private lastMovedAt: number

	constructor() {
		const cols = process.stdout.columns || 90
		const rows = process.stdout.rows || 28

		this.screen = new ScreenBuffer(cols, rows)
		this.renderer = new Renderer(this.screen)
		this.input = new InputManager()
		this.hud = new HUD()
		this.world = new WorldManager()
		this.player = new Player(20, 9)
		this.messages = new MessageLog()
		this.state = 'title'
		this.tickCount = 0
		this.intervalId = null
		this.combat = null
		this.dialogue = new DialogueSystem()
		this.hudLayout = HUD.calculateLayout(cols, rows)
		this.invSelectedIndex = 0
		this.pauseSelectedIndex = 0
		this.heldMove = null
		this.heldMoveReceivedAt = 0
		this.lastMovedAt = 0

		this.artManager = new ArtManager()
		this.setupInput()
	}

	private setupInput(): void {
		this.input.onAny((action: KeyAction) => {
			switch (this.state) {
				case 'title':
					this.handleTitleInput(action)
					break
				case 'playing':
					this.handlePlayingInput(action)
					break
				case 'combat':
					this.handleCombatInput(action)
					break
				case 'dialogue':
					this.handleDialogueInput(action)
					break
				case 'inventory':
					this.handleInventoryInput(action)
					break
				case 'paused':
					this.handlePauseInput(action)
					break
			}
		})
	}

	private async initializeArt(): Promise<void> {
		await this.artManager.initialize()
	}

	private handleTitleInput(action: KeyAction): void {
		if (action.key === 'e') {
			this.startGame()
		} else if (action.ctrl && action.key === 'c') {
			this.quit()
		}
	}

	private handlePlayingInput(action: KeyAction): void {
		if (action.ctrl && action.key === 'c') {
			this.quit()
			return
		}

		switch (action.key) {
			case 'w':
			case 'arrowup':
				this.heldMove = {dx: 0, dy: -1}
				this.heldMoveReceivedAt = Date.now()
				this.movePlayer(0, -1)
				break
			case 's':
			case 'arrowdown':
				this.heldMove = {dx: 0, dy: 1}
				this.heldMoveReceivedAt = Date.now()
				this.movePlayer(0, 1)
				break
			case 'a':
			case 'arrowleft':
				this.heldMove = {dx: -1, dy: 0}
				this.heldMoveReceivedAt = Date.now()
				this.movePlayer(-1, 0)
				break
			case 'd':
			case 'arrowright':
				this.heldMove = {dx: 1, dy: 0}
				this.heldMoveReceivedAt = Date.now()
				this.movePlayer(1, 0)
				break
			case 'f':
			case 'e':
				this.interact()
				break
			case 'i':
			case 'tab':
				this.state = 'inventory'
				this.invSelectedIndex = 0
				break
			case 'escape':
				this.state = 'paused'
				this.pauseSelectedIndex = 0
				break
		}
	}

	private handleCombatInput(action: KeyAction): void {
		if (!this.combat) return

		if (action.ctrl && action.key === 'c') {
			this.quit()
			return
		}

		if (
			this.combat.state === 'victory' ||
			this.combat.state === 'defeat' ||
			this.combat.state === 'fled'
		) {
			if (action.key === 'enter' || action.key === 'escape') {
				if (this.combat.state === 'defeat') {
					this.player.stats.hp = this.player.stats.maxHp
					this.player.stats.mp = this.player.stats.maxMp
					this.player.x = 20
					this.player.y = 9
					this.world.switchScene('town')
					this.messages.add('You awaken in town...', 'system')
				}
				this.combat = null
				this.state = 'playing'
				this.renderer.forceRedraw()
			}
			return
		}

		if (this.combat.state === 'player_turn') {
			switch (action.key) {
				case 'w':
				case 'arrowup':
					this.combat.moveSelection(-1)
					break
				case 's':
				case 'arrowdown':
					this.combat.moveSelection(1)
					break
				case 'enter': {
					const result = this.combat.executeAction()
					if (result) {
						for (const msg of this.combat.log.slice(-3)) {
							this.messages.add(msg, result.killed ? 'loot' : 'combat')
						}
					}
					// After executeAction, state may have changed to enemy_turn via side effect
					const combatState = this.combat.state as string
					if (combatState === 'enemy_turn') {
						this.combat.enemyTurn()
						for (const msg of this.combat.log.slice(-1)) {
							this.messages.add(msg, 'combat')
						}
					}
					break
				}
			}
		}
	}

	private handleDialogueInput(action: KeyAction): void {
		if (action.ctrl && action.key === 'c') {
			this.quit()
			return
		}

		if (action.key === 'escape') {
			this.dialogue.close()
			this.state = 'playing'
			this.renderer.forceRedraw()
			return
		}

		const node = this.dialogue.getCurrentNode()
		if (!node) {
			this.dialogue.close()
			this.state = 'playing'
			this.renderer.forceRedraw()
			return
		}

		// Number keys for choices
		const num = parseInt(action.key)
		if (num >= 1 && num <= node.choices.length) {
			const cont = this.dialogue.selectChoice(num - 1)
			if (!cont) {
				this.state = 'playing'
				this.renderer.forceRedraw()
			} else {
				this.tickCount = 0 // Reset typewriter
			}
		}
	}

	private handleInventoryInput(action: KeyAction): void {
		if (action.ctrl && action.key === 'c') {
			this.quit()
			return
		}

		switch (action.key) {
			case 'escape':
			case 'tab':
				this.state = 'playing'
				this.renderer.forceRedraw()
				break
			case 'w':
			case 'arrowup':
				this.invSelectedIndex = Math.max(0, this.invSelectedIndex - 1)
				break
			case 's':
			case 'arrowdown':
				this.invSelectedIndex = Math.min(
					this.player.inventory.length - 1,
					this.invSelectedIndex + 1,
				)
				break
			case 'enter':
				if (this.player.inventory.length > 0) {
					const item = this.player.inventory[this.invSelectedIndex]
					if (item) {
						this.player.useItem(item)
						this.messages.add(`Used ${item.name}`, 'info')
						this.invSelectedIndex = Math.min(
							this.player.inventory.length - 1,
							this.invSelectedIndex,
						)
					}
				}
				break
		}
	}

	private handlePauseInput(action: KeyAction): void {
		if (action.ctrl && action.key === 'c') {
			this.quit()
			return
		}

		switch (action.key) {
			case 'w':
			case 'arrowup':
				this.pauseSelectedIndex = Math.max(0, this.pauseSelectedIndex - 1)
				break
			case 's':
			case 'arrowdown':
				this.pauseSelectedIndex = Math.min(1, this.pauseSelectedIndex + 1)
				break
			case 'enter':
				if (this.pauseSelectedIndex === 0) {
					this.state = 'playing'
					this.renderer.forceRedraw()
				} else {
					this.quit()
				}
				break
			case 'escape':
				this.state = 'playing'
				this.renderer.forceRedraw()
				break
		}
	}

	private movePlayer(dx: number, dy: number): void {
		this.lastMovedAt = Date.now()
		const newX = this.player.x + dx
		const newY = this.player.y + dy
		const scene = this.world.currentScene

		// Check NPC collision
		const npc = scene.getNPCAt(newX, newY)
		if (npc) {
			this.startDialogue(npc.dialogueTreeId, npc.dialogueStartNode, npc.name)
			return
		}

		// Check enemy collision
		const enemy = scene.getEnemyAt(newX, newY)
		if (enemy && !enemy.isDead()) {
			this.startCombat(enemy)
			return
		}

		// Check walkability
		if (scene.isSolid(newX, newY)) return

		// Move
		this.player.move(dx, dy)

		// Check item pickup
		const item = scene.getItemAt(this.player.x, this.player.y)
		if (item) {
			this.player.pickup(item.item)
			this.messages.add(`Picked up ${item.item.name}`, 'loot')
			scene.removeItem(item)
		}

		// Check exits
		const exit = scene.getExitAt(this.player.x, this.player.y)
		if (exit) {
			const newScene = this.world.switchScene(exit.targetScene)
			if (newScene) {
				this.player.x = exit.targetX
				this.player.y = exit.targetY
				this.messages.add(`Entered ${newScene.name}`, 'system')
				this.renderer.forceRedraw()
			}
		}
	}

	private interact(): void {
		// Check adjacent cells for NPCs
		const dirs = [
			[0, -1],
			[0, 1],
			[-1, 0],
			[1, 0],
		]
		for (const [dx, dy] of dirs) {
			const nx = this.player.x + (dx ?? 0)
			const ny = this.player.y + (dy ?? 0)
			const npc = this.world.currentScene.getNPCAt(nx, ny)
			if (npc) {
				this.startDialogue(npc.dialogueTreeId, npc.dialogueStartNode, npc.name)
				return
			}
			const enemy = this.world.currentScene.getEnemyAt(nx, ny)
			if (enemy && !enemy.isDead()) {
				this.startCombat(enemy)
				return
			}
		}
	}

	private startDialogue(
		treeId: string,
		nodeId: string,
		_npcName: string,
	): void {
		this.dialogue.start(treeId, nodeId)
		this.state = 'dialogue'
		this.tickCount = 0
		this.renderer.forceRedraw()
	}

	private startCombat(enemy: Enemy): void {
		this.combat = new CombatSystem(this.player, enemy)
		this.state = 'combat'
		this.renderer.forceRedraw()
	}

	startGame(): void {
		this.state = 'playing'
		this.player.x = 20
		this.player.y = 9
		this.messages.add('Welcome to the void, Signal Bearer.', 'system')
		this.messages.add('Move with WASD. Press E to interact.', 'info')
		this.renderer.forceRedraw()
	}

	quit(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = null
		}
		this.input.stop()
		this.renderer.cleanup()
		process.exit(0)
	}

	tick(): void {
		this.tickCount++
		this.update()
		this.render()
		this.renderer.render()
	}

	private update(): void {
		if (this.state === 'playing' && this.heldMove) {
			const now = Date.now()
			// Key still held (OS auto-repeat keeps this timestamp fresh every ~30ms)
			// and move cooldown elapsed (80ms ≈ 12 moves/sec)
			if (now - this.heldMoveReceivedAt < 150 && now - this.lastMovedAt >= 80) {
				this.movePlayer(this.heldMove.dx, this.heldMove.dy)
			}
		}
	}

	private render(): void {
		const {screen} = this
		const {width: _width, height: _height} = screen

		switch (this.state) {
			case 'title':
				Menus.renderTitleScreen(screen, this.tickCount)
				break

			case 'playing':
				this.renderPlaying()
				break

			case 'combat': {
				if (this.combat) {
					// Get enemy art dynamically based on enemy type
					const enemyType = this.combat.enemy.name.toLowerCase()
					let enemyArt: ArtPiece | undefined
					if (enemyType.includes('wolf') || enemyType.includes('dog')) {
						enemyArt =
							this.artManager.getRandomArt('animals/wolves') ?? undefined
					} else if (enemyType.includes('cat') || enemyType.includes('lion')) {
						enemyArt = this.artManager.getRandomArt('animals/cats') ?? undefined
					} else if (enemyType.includes('bat')) {
						enemyArt = this.artManager.getRandomArt('animals/bats') ?? undefined
					} else if (enemyType.includes('spider')) {
						enemyArt =
							this.artManager.getRandomArt('animals/spiders') ?? undefined
					} else if (enemyType.includes('frog')) {
						enemyArt =
							this.artManager.getRandomArt('animals/frogs') ?? undefined
					} else {
						enemyArt = this.artManager.getRandomArt('animals') ?? undefined
					}
					Menus.renderCombatScreen(screen, this.combat, enemyArt)
				}
				break
			}

			case 'dialogue': {
				const npc = this.world.currentScene.npcs.find(
					n => n.dialogueTreeId === this.dialogue['currentTree'],
				)
				const npcName = npc?.name ?? 'NPC'
				// Get NPC art dynamically
				const npcArt = this.artManager.getRandomArt('people') ?? undefined
				Menus.renderDialogueScreen(
					screen,
					this.dialogue,
					npcName,
					this.tickCount,
					npcArt,
				)
				break
			}

			case 'inventory':
				Menus.renderInventoryScreen(screen, this.player, this.invSelectedIndex)
				break

			case 'paused':
				Menus.renderPauseMenu(screen, this.pauseSelectedIndex)
				break
		}
	}

	private renderPlaying(): void {
		const {screen, world, player} = this
		const {width: _width, height: _height} = screen
		const scene = world.currentScene
		const layout = this.hudLayout

		screen.clear([200, 200, 200], scene.ambientColor)

		// Calculate viewport offset to center on player
		const vpX = Math.max(0, player.x - Math.floor(layout.viewportW / 2))
		const vpY = Math.max(0, player.y - Math.floor(layout.viewportH / 2))

		// Render tiles
		for (let sy = 0; sy < layout.viewportH; sy++) {
			for (let sx = 0; sx < layout.viewportW; sx++) {
				const wx = vpX + sx
				const wy = vpY + sy
				const screenX = layout.viewportX + sx
				const screenY = layout.viewportY + sy

				if (wx < 0 || wx >= scene.width || wy < 0 || wy >= scene.height) {
					screen.set(screenX, screenY, ' ', [50, 50, 50], scene.ambientColor)
					continue
				}

				const tile = scene.tiles[wy]?.[wx] ?? ' '
				const fg = scene.tileFg[wy]?.[wx] ?? [100, 100, 100]
				const bg = scene.tileBg[wy]?.[wx] ?? scene.ambientColor

				// Animated torches
				if (scene.animatedTorches.some(t => t.x === wx && t.y === wy)) {
					const torchChar =
						TORCH_CHARS[Math.floor(this.tickCount / 4) % 4] ?? '\u25b2'
					screen.set(screenX, screenY, torchChar, [255, 200, 50], bg)
					continue
				}

				screen.set(screenX, screenY, tile, fg, bg)
			}
		}

		// Render ground items
		for (const item of scene.items) {
			const sx = layout.viewportX + item.x - vpX
			const sy = layout.viewportY + item.y - vpY
			if (
				sx >= layout.viewportX &&
				sx < layout.viewportX + layout.viewportW &&
				sy >= layout.viewportY &&
				sy < layout.viewportY + layout.viewportH
			) {
				screen.set(sx, sy, item.item.glyph, item.item.color, scene.ambientColor)
			}
		}

		// Render NPCs
		for (const npc of scene.npcs) {
			const sx = layout.viewportX + npc.x - vpX
			const sy = layout.viewportY + npc.y - vpY
			if (
				sx >= layout.viewportX &&
				sx < layout.viewportX + layout.viewportW &&
				sy >= layout.viewportY &&
				sy < layout.viewportY + layout.viewportH
			) {
				screen.set(sx, sy, npc.glyph, npc.color, scene.ambientColor)
			}
		}

		// Render enemies
		for (const enemy of scene.enemies) {
			if (enemy.isDead()) continue
			const sx = layout.viewportX + enemy.x - vpX
			const sy = layout.viewportY + enemy.y - vpY
			if (
				sx >= layout.viewportX &&
				sx < layout.viewportX + layout.viewportW &&
				sy >= layout.viewportY &&
				sy < layout.viewportY + layout.viewportH
			) {
				screen.set(sx, sy, enemy.glyph, enemy.color, scene.ambientColor)
			}
		}

		// Render player
		const px = layout.viewportX + player.x - vpX
		const py = layout.viewportY + player.y - vpY
		if (
			px >= layout.viewportX &&
			px < layout.viewportX + layout.viewportW &&
			py >= layout.viewportY &&
			py < layout.viewportY + layout.viewportH
		) {
			screen.set(px, py, player.glyph, player.color, [20, 60, 40])
		}

		// Render HUD
		this.hud.render(
			screen,
			player,
			scene,
			this.messages,
			layout,
			this.tickCount,
		)
	}

	run(): void {
		this.renderer.initTerminal()
		this.input.start()

		if (!this.input.inputAvailable) {
			// Non-interactive mode — still render but warn
			process.stderr.write(
				'\x1b[33mWarning: stdin is not a TTY. Input will not work.\x1b[0m\n',
			)
			process.stderr.write(
				'Run this in a real terminal for interactive play.\n',
			)
		}

		// Initialize art system
		this.initializeArt().catch(console.error)

		// Handle resize
		const onResize = () => {
			const cols = process.stdout.columns || 90
			const rows = process.stdout.rows || 28
			if (cols < 40 || rows < 16) return // too small, skip resize
			this.screen = new ScreenBuffer(cols, rows)
			this.renderer = new Renderer(this.screen)
			this.hudLayout = HUD.calculateLayout(cols, rows)
			this.renderer.forceRedraw()
		}
		process.stdout.on('resize', onResize)

		// Clean exit handlers
		const cleanup = () => this.quit()
		process.on('SIGINT', cleanup)
		process.on('SIGTERM', cleanup)
		process.on('uncaughtException', err => {
			console.error('Uncaught exception:', err)
			cleanup()
		})

		this.intervalId = setInterval(() => this.tick(), 50) // 20fps
	}
}
