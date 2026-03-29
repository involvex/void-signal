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
	private onDataBound: (data: Buffer | string) => void
	private active: boolean
	private isTTY: boolean

	constructor() {
		this.listeners = new Map()
		this.anyListeners = new Set()
		this.onDataBound = this.onData.bind(this)
		this.active = false
		this.isTTY = Boolean(process.stdin.isTTY)
	}

	start(): void {
		if (this.active) return
		this.active = true

		if (!this.isTTY) {
			// stdin is not a TTY (piped input, non-interactive shell)
			// Try to enable anyway — Bun sometimes reports isTTY=false but still works
			try {
				process.stdin.setRawMode(true)
				this.isTTY = true
			} catch {
				// Truly non-interactive — input will not work
				return
			}
		} else {
			try {
				process.stdin.setRawMode(true)
			} catch {
				// setRawMode failed even though isTTY was true
				return
			}
		}

		process.stdin.resume()
		process.stdin.setEncoding('utf8')
		process.stdin.on('data', this.onDataBound)
	}

	stop(): void {
		if (!this.active) return
		this.active = false

		try {
			process.stdin.removeListener('data', this.onDataBound)
			if (this.isTTY) {
				process.stdin.setRawMode(false)
			}
			process.stdin.pause()
		} catch {
			// Ignore cleanup errors
		}
	}

	get active_(): boolean {
		return this.active
	}

	get inputAvailable(): boolean {
		return this.active && this.isTTY
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

	private onData(data: Buffer | string): void {
		const raw = typeof data === 'string' ? data : data.toString('utf8')
		if (raw.length === 0) return

		// Handle multiple key events in a single data event (rapid typing)
		const events = this.splitKeyEvents(raw)
		for (const event of events) {
			const action = this.parseKey(event)
			if (!action) continue

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
	}

	private splitKeyEvents(raw: string): string[] {
		const events: string[] = []
		let i = 0
		while (i < raw.length) {
			if (raw[i] === '\x1b') {
				// Escape sequence — try to find the longest matching sequence
				let seqEnd: number
				// CSI sequences: ESC [ ... letter
				if (raw[i + 1] === '[') {
					seqEnd = i + 2
					while (seqEnd < raw.length) {
						const c = raw.charCodeAt(seqEnd)
						if (c >= 0x40 && c <= 0x7e) {
							seqEnd++
							break
						}
						seqEnd++
					}
				}
				// SS3 sequences: ESC O letter
				else if (raw[i + 1] === 'O') {
					seqEnd = Math.min(i + 3, raw.length)
				}
				// Alt+key: ESC + single char
				else {
					seqEnd = Math.min(i + 2, raw.length)
				}
				events.push(raw.slice(i, seqEnd))
				i = seqEnd
			} else {
				// Single byte key
				events.push(raw[i]!)
				i++
			}
		}
		return events
	}

	private parseKey(raw: string): KeyAction | null {
		if (raw.length === 0) return null

		const code = raw.charCodeAt(0)

		// Ctrl+letter (0x01-0x1a map to ctrl+a through ctrl+z)
		// Exclude \t (9), \n (10), \r (13) — they have dedicated key names below
		if (raw.length === 1 && code >= 1 && code <= 26 && code !== 9 && code !== 10 && code !== 13) {
			return {
				key: String.fromCharCode(code + 96), // 'a' = 97
				ctrl: true,
				shift: false,
				raw,
			}
		}

		// Escape sequences
		if (raw[0] === '\x1b') {
			// Arrow keys
			if (raw === '\x1b[A')
				return {key: 'arrowup', ctrl: false, shift: false, raw}
			if (raw === '\x1b[B')
				return {key: 'arrowdown', ctrl: false, shift: false, raw}
			if (raw === '\x1b[C')
				return {key: 'arrowright', ctrl: false, shift: false, raw}
			if (raw === '\x1b[D')
				return {key: 'arrowleft', ctrl: false, shift: false, raw}

			// Shift+Arrow keys
			if (raw === '\x1b[1;2A')
				return {key: 'arrowup', ctrl: false, shift: true, raw}
			if (raw === '\x1b[1;2B')
				return {key: 'arrowdown', ctrl: false, shift: true, raw}
			if (raw === '\x1b[1;2C')
				return {key: 'arrowright', ctrl: false, shift: true, raw}
			if (raw === '\x1b[1;2D')
				return {key: 'arrowleft', ctrl: false, shift: true, raw}

			// Ctrl+Arrow keys
			if (raw === '\x1b[1;5A')
				return {key: 'arrowup', ctrl: true, shift: false, raw}
			if (raw === '\x1b[1;5B')
				return {key: 'arrowdown', ctrl: true, shift: false, raw}
			if (raw === '\x1b[1;5C')
				return {key: 'arrowright', ctrl: true, shift: false, raw}
			if (raw === '\x1b[1;5D')
				return {key: 'arrowleft', ctrl: true, shift: false, raw}

			// Home, End
			if (raw === '\x1b[H' || raw === '\x1b[1~')
				return {key: 'home', ctrl: false, shift: false, raw}
			if (raw === '\x1b[F' || raw === '\x1b[4~')
				return {key: 'end', ctrl: false, shift: false, raw}

			// Page Up/Down
			if (raw === '\x1b[5~')
				return {key: 'pageup', ctrl: false, shift: false, raw}
			if (raw === '\x1b[6~')
				return {key: 'pagedown', ctrl: false, shift: false, raw}

			// Function keys
			if (raw === '\x1bOP') return {key: 'f1', ctrl: false, shift: false, raw}
			if (raw === '\x1bOQ') return {key: 'f2', ctrl: false, shift: false, raw}
			if (raw === '\x1bOR') return {key: 'f3', ctrl: false, shift: false, raw}
			if (raw === '\x1bOS') return {key: 'f4', ctrl: false, shift: false, raw}

			// F5-F12: ESC [15~ etc
			if (raw.length >= 5 && raw.startsWith('\x1b[') && raw.endsWith('~')) {
				const num = parseInt(raw.slice(2, -1), 10)
				const fMap: Record<number, string> = {
					15: 'f5',
					17: 'f6',
					18: 'f7',
					19: 'f8',
					20: 'f9',
					21: 'f10',
					23: 'f11',
					24: 'f12',
				}
				const fKey = fMap[num]
				if (fKey) return {key: fKey, ctrl: false, shift: false, raw}
			}

			// Alt+letter (2-char escape sequence)
			if (raw.length === 2) {
				const ch = raw[1]!.toLowerCase()
				if (ch >= 'a' && ch <= 'z') {
					return {key: `alt-${ch}`, ctrl: false, shift: false, raw}
				}
			}

			// Plain Escape
			return {key: 'escape', ctrl: false, shift: false, raw}
		}

		// Special single chars
		if (raw === '\r' || raw === '\n')
			return {key: 'enter', ctrl: false, shift: false, raw}
		if (raw === '\t') return {key: 'tab', ctrl: false, shift: false, raw}
		if (raw === ' ') return {key: 'space', ctrl: false, shift: false, raw}
		if (raw === '\x7f' || raw === '\x08')
			return {key: 'backspace', ctrl: false, shift: false, raw}
		if (raw === '\x1b') return {key: 'escape', ctrl: false, shift: false, raw}

		// Regular printable characters
		if (raw.length === 1 && code >= 32) {
			const lower = raw.toLowerCase()
			return {
				key: lower,
				ctrl: false,
				shift: raw !== lower,
				raw,
			}
		}

		return null
	}
}
