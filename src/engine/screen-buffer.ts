export type RGB = [number, number, number]

export interface Cell {
	char: string
	fg: RGB
	bg: RGB
}

const DEFAULT_FG: RGB = [255, 255, 255]
const DEFAULT_BG: RGB = [0, 0, 0]

function cloneCell(c: Cell): Cell {
	return {
		char: c.char,
		fg: [c.fg[0], c.fg[1], c.fg[2]],
		bg: [c.bg[0], c.bg[1], c.bg[2]],
	}
}

export class ScreenBuffer {
	readonly width: number
	readonly height: number
	cells: Cell[][]
	dirty: boolean[][]

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
		this.cells = []
		this.dirty = []
		for (let y = 0; y < height; y++) {
			const row: Cell[] = []
			const dRow: boolean[] = []
			for (let x = 0; x < width; x++) {
				row.push({char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG})
				dRow.push(true)
			}
			this.cells.push(row)
			this.dirty.push(dRow)
		}
	}

	clear(fg: RGB = DEFAULT_FG, bg: RGB = DEFAULT_BG): void {
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const cell = this.cells[y]?.[x]
				if (cell) {
					cell.char = ' '
					cell.fg = fg
					cell.bg = bg
				}
				const dRow = this.dirty[y]
				if (dRow) dRow[x] = true
			}
		}
	}

	set(x: number, y: number, char: string, fg: RGB, bg?: RGB): void {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
		const cell = this.cells[y]?.[x]
		if (!cell) return
		cell.char = char
		cell.fg = fg
		if (bg) cell.bg = bg
		const dRow = this.dirty[y]
		if (dRow) dRow[x] = true
	}

	write(x: number, y: number, text: string, fg: RGB, bg?: RGB): void {
		for (let i = 0; i < text.length; i++) {
			this.set(x + i, y, text[i]!, fg, bg)
		}
	}

	fillRect(
		x: number,
		y: number,
		w: number,
		h: number,
		char: string,
		fg: RGB,
		bg: RGB,
	): void {
		for (let dy = 0; dy < h; dy++) {
			for (let dx = 0; dx < w; dx++) {
				this.set(x + dx, y + dy, char, fg, bg)
			}
		}
	}

	drawBox(x: number, y: number, w: number, h: number, fg: RGB, bg?: RGB): void {
		// Top border
		this.set(x, y, '\u2554', fg, bg) // ╔
		for (let i = 1; i < w - 1; i++) {
			this.set(x + i, y, '\u2550', fg, bg) // ═
		}
		this.set(x + w - 1, y, '\u2557', fg, bg) // ╗

		// Sides
		for (let i = 1; i < h - 1; i++) {
			this.set(x, y + i, '\u2551', fg, bg) // ║
			this.set(x + w - 1, y + i, '\u2551', fg, bg) // ║
		}

		// Bottom border
		this.set(x, y + h - 1, '\u255A', fg, bg) // ╚
		for (let i = 1; i < w - 1; i++) {
			this.set(x + i, y + h - 1, '\u2550', fg, bg) // ═
		}
		this.set(x + w - 1, y + h - 1, '\u255D', fg, bg) // ╝
	}

	drawBar(
		x: number,
		y: number,
		w: number,
		current: number,
		max: number,
		fillChar: string,
		fg: RGB,
		bg: RGB,
	): void {
		const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0
		const filled = Math.round(ratio * (w - 2))
		this.set(x, y, '[', fg, bg)
		for (let i = 0; i < w - 2; i++) {
			this.set(x + 1 + i, y, i < filled ? fillChar : '\u2591', fg, bg)
		}
		this.set(x + w - 1, y, ']', fg, bg)
	}

	isDirty(x: number, y: number): boolean {
		return this.dirty[y]?.[x] ?? false
	}

	markClean(): void {
		for (let y = 0; y < this.height; y++) {
			const dRow = this.dirty[y]
			if (dRow) dRow.fill(false)
		}
	}

	markAllDirty(): void {
		for (let y = 0; y < this.height; y++) {
			const dRow = this.dirty[y]
			if (dRow) dRow.fill(true)
		}
	}

	isInBounds(x: number, y: number): boolean {
		return x >= 0 && x < this.width && y >= 0 && y < this.height
	}

	snapshot(): Cell[][] {
		return this.cells.map(row => row.map(cloneCell))
	}
}
