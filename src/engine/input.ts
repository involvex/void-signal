export interface KeyAction {
	key: string
	ctrl: boolean
	shift: boolean
	raw: string
}

type KeyHandler = (action: KeyAction) => void

export class InputManager {
	private listeners: Map<string, Set<KeyHandler>>
	private anyListeners: Set<KeyHandler>
	private onDataBound: (data: Buffer) => void

	constructor() {
		this.listeners = new Map()
		this.anyListeners = new Set()
		this.onDataBound = this.onData.bind(this)
	}

	start(): void {
		process.stdin.setRawMode(true)
		process.stdin.resume()
		process.stdin.on('data', this.onDataBound)
	}

	stop(): void {
		process.stdin.setRawMode(false)
		process.stdin.pause()
		process.stdin.removeListener('data', this.onDataBound)
	}

	on(key: string, handler: KeyHandler): void {
		const k = key.toLowerCase()
		if (!this.listeners.has(k)) {
			this.listeners.set(k, new Set())
		}
		this.listeners.get(k)!.add(handler)
	}

	off(key: string, handler: KeyHandler): void {
		this.listeners.get(key.toLowerCase())?.delete(handler)
	}

	onAny(handler: KeyHandler): void {
		this.anyListeners.add(handler)
	}

	offAny(handler: KeyHandler): void {
		this.anyListeners.delete(handler)
	}

	private onData(data: Buffer): void {
		const raw = data.toString()
		const action = this.parseKey(raw)

		for (const handler of this.anyListeners) {
			handler(action)
		}

		const handlers = this.listeners.get(action.key)
		if (handlers) {
			for (const handler of handlers) {
				handler(action)
			}
		}
	}

	private parseKey(raw: string): KeyAction {
		let key = ''
		let ctrl = false
		let shift = false

		// Ctrl+letter (0x01-0x1a map to ctrl+a through ctrl+z)
		if (raw.length === 1 && raw.charCodeAt(0) >= 1 && raw.charCodeAt(0) <= 26) {
			ctrl = true
			key = String.fromCharCode(raw.charCodeAt(0) + 96) // 'a' = 97
			return {key, ctrl, shift, raw}
		}

		// Escape sequences
		if (raw.startsWith('\x1b')) {
			// Alt+key
			if (raw.length === 2) {
				key = raw[1]!.toLowerCase()
				return {key, ctrl: false, shift, raw}
			}

			// Arrow keys
			if (raw === '\x1b[A') return {key: 'arrowup', ctrl, shift, raw}
			if (raw === '\x1b[B') return {key: 'arrowdown', ctrl, shift, raw}
			if (raw === '\x1b[C') return {key: 'arrowright', ctrl, shift, raw}
			if (raw === '\x1b[D') return {key: 'arrowleft', ctrl, shift, raw}

			// Shift+Arrow keys
			if (raw === '\x1b[1;2A') return {key: 'arrowup', ctrl, shift: true, raw}
			if (raw === '\x1b[1;2B') return {key: 'arrowdown', ctrl, shift: true, raw}
			if (raw === '\x1b[1;2C')
				return {key: 'arrowright', ctrl, shift: true, raw}
			if (raw === '\x1b[1;2D') return {key: 'arrowleft', ctrl, shift: true, raw}

			// Home, End
			if (raw === '\x1b[H' || raw === '\x1b[1~')
				return {key: 'home', ctrl, shift, raw}
			if (raw === '\x1b[F' || raw === '\x1b[4~')
				return {key: 'end', ctrl, shift, raw}

			// Function keys
			if (raw === '\x1bOP') return {key: 'f1', ctrl, shift, raw}
			if (raw === '\x1bOQ') return {key: 'f2', ctrl, shift, raw}
			if (raw === '\x1bOR') return {key: 'f3', ctrl, shift, raw}
			if (raw === '\x1bOS') return {key: 'f4', ctrl, shift, raw}

			return {key: 'escape', ctrl, shift, raw}
		}

		// Special keys
		if (raw === '\r' || raw === '\n') return {key: 'enter', ctrl, shift, raw}
		if (raw === '\t') return {key: 'tab', ctrl, shift, raw}
		if (raw === ' ') return {key: 'space', ctrl, shift, raw}
		if (raw === '\x7f' || raw === '\x08')
			return {key: 'backspace', ctrl, shift, raw}

		// Regular characters
		key = raw.toLowerCase()
		if (raw.length === 1 && raw >= 'A' && raw <= 'Z') {
			shift = true
		}

		return {key, ctrl, shift, raw}
	}
}
