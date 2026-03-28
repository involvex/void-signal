import type {Cell, RGB} from './screen-buffer.ts'
import {ScreenBuffer} from './screen-buffer.ts'

const ESC = '\x1b'

function rgbFg(r: number, g: number, b: number): string {
	return `${ESC}[38;2;${r};${g};${b}m`
}

function rgbBg(r: number, g: number, b: number): string {
	return `${ESC}[48;2;${r};${g};${b}m`
}

const RESET = `${ESC}[0m`
const CURSOR_HIDE = `${ESC}[?25l`
const CURSOR_SHOW = `${ESC}[?25h`
const ALT_SCREEN_ON = `${ESC}[?1049h`
const ALT_SCREEN_OFF = `${ESC}[?1049l`
const CLEAR_SCREEN = `${ESC}[2J${ESC}[H`
const HOME = `${ESC}[H`

function cursorPos(row: number, col: number): string {
	return `${ESC}[${row + 1};${col + 1}H`
}

export class Renderer {
	buffer: ScreenBuffer
	private prevCells: Cell[][] | null
	private forceFull: boolean
	private firstFrame: boolean

	constructor(buffer: ScreenBuffer) {
		this.buffer = buffer
		this.prevCells = null
		this.forceFull = false
		this.firstFrame = true
	}

	forceRedraw(): void {
		this.forceFull = true
	}

	render(): void {
		const {width, height, cells} = this.buffer
		const out: string[] = []
		let prevFg: RGB | null = null
		let prevBg: RGB | null = null
		let prevCursorX = -1
		let prevCursorY = -1

		if (this.forceFull || !this.prevCells) {
			// Only use CLEAR_SCREEN on the very first frame
			if (this.firstFrame) {
				out.push(CLEAR_SCREEN)
				this.firstFrame = false
			} else {
				out.push(HOME)
			}
			this.forceFull = false

			for (let y = 0; y < height; y++) {
				out.push(cursorPos(y, 0))
				for (let x = 0; x < width; x++) {
					const cell = cells[y]?.[x]
					if (!cell) continue
					out.push(
						rgbFg(cell.fg[0], cell.fg[1], cell.fg[2]),
						rgbBg(cell.bg[0], cell.bg[1], cell.bg[2]),
						cell.char,
					)
				}
			}
		} else {
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					if (!this.buffer.isDirty(x, y)) continue

					const cell = cells[y]?.[x]
					const prev = this.prevCells[y]?.[x]
					if (!cell) continue

					if (
						prev &&
						cell.char === prev.char &&
						cell.fg[0] === prev.fg[0] &&
						cell.fg[1] === prev.fg[1] &&
						cell.fg[2] === prev.fg[2] &&
						cell.bg[0] === prev.bg[0] &&
						cell.bg[1] === prev.bg[1] &&
						cell.bg[2] === prev.bg[2]
					) {
						continue
					}

					if (y !== prevCursorY || x !== prevCursorX) {
						out.push(cursorPos(y, x))
					}

					if (
						!prevFg ||
						cell.fg[0] !== prevFg[0] ||
						cell.fg[1] !== prevFg[1] ||
						cell.fg[2] !== prevFg[2]
					) {
						out.push(rgbFg(cell.fg[0], cell.fg[1], cell.fg[2]))
						prevFg = cell.fg
					}
					if (
						!prevBg ||
						cell.bg[0] !== prevBg[0] ||
						cell.bg[1] !== prevBg[1] ||
						cell.bg[2] !== prevBg[2]
					) {
						out.push(rgbBg(cell.bg[0], cell.bg[1], cell.bg[2]))
						prevBg = cell.bg
					}

					out.push(cell.char)
					prevCursorX = x + 1
					prevCursorY = y
				}
			}
		}

		out.push(RESET)
		process.stdout.write(out.join(''))
		this.prevCells = this.buffer.snapshot()
		this.buffer.markClean()
	}

	initTerminal(): void {
		process.stdout.write(ALT_SCREEN_ON + CURSOR_HIDE + CLEAR_SCREEN)
	}

	cleanup(): void {
		process.stdout.write(RESET + CURSOR_SHOW + ALT_SCREEN_OFF)
	}
}
