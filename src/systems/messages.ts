import type {RGB} from '../engine/screen-buffer.ts'

export type MessageType =
	| 'info'
	| 'combat'
	| 'loot'
	| 'system'
	| 'warning'
	| 'danger'

export interface Message {
	text: string
	type: MessageType
	color: RGB
}

const COLORS: Record<MessageType, RGB> = {
	info: [200, 200, 200],
	combat: [255, 80, 80],
	loot: [255, 200, 50],
	system: [80, 140, 255],
	warning: [255, 160, 0],
	danger: [255, 60, 60],
}

export class MessageLog {
	private messages: Message[]
	private maxMessages: number

	constructor(maxMessages = 50) {
		this.messages = []
		this.maxMessages = maxMessages
	}

	add(text: string, type: MessageType = 'info'): void {
		this.messages.push({text, type, color: COLORS[type]})
		if (this.messages.length > this.maxMessages) {
			this.messages.shift()
		}
	}

	getRecent(count: number): Message[] {
		return this.messages.slice(-count)
	}

	getAll(): Message[] {
		return [...this.messages]
	}

	clear(): void {
		this.messages = []
	}
}
