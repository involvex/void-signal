import type {RGB} from '../engine/screen-buffer.ts'
import {Entity} from './entity.ts'

export class NPC extends Entity {
	dialogueTreeId: string
	dialogueStartNode: string
	isMerchant: boolean

	constructor(
		x: number,
		y: number,
		glyph: string,
		color: RGB,
		name: string,
		dialogueTreeId: string,
		dialogueStartNode: string,
		isMerchant = false,
	) {
		super(x, y, glyph, color, name)
		this.dialogueTreeId = dialogueTreeId
		this.dialogueStartNode = dialogueStartNode
		this.isMerchant = isMerchant
	}
}
