import type {RGB} from '../engine/screen-buffer.ts'
import type {Position} from '../types.ts'

export class Entity {
	x: number
	y: number
	glyph: string
	color: RGB
	name: string

	constructor(x: number, y: number, glyph: string, color: RGB, name: string) {
		this.x = x
		this.y = y
		this.glyph = glyph
		this.color = color
		this.name = name
	}

	get pos(): Position {
		return {x: this.x, y: this.y}
	}
}
