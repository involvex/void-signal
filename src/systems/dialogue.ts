import type {DialogueChoice, DialogueNode} from '../types.ts'
import type {RGB} from '../engine/screen-buffer.ts'

const MERCHANT_DIALOGUE: Record<string, DialogueNode> = {
	start: {
		text: 'Welcome, traveler. I have wares if you have coin.',
		choices: [
			{text: 'Show me your weapons.', next: 'weapons'},
			{text: 'I need healing potions.', next: 'potions'},
			{text: 'What news of the ruins?', next: 'ruins_news'},
			{text: 'Goodbye.', next: 'exit'},
		],
	},
	weapons: {
		text: 'A fine Signal Blade — forged from void crystals. 50 gold.',
		choices: [
			{text: "I'll take it.", next: 'buy_blade'},
			{text: 'Too expensive.', next: 'start'},
		],
	},
	buy_blade: {
		text: 'A wise purchase. May it serve you well in the void.',
		choices: [{text: 'Thank you.', next: 'exit'}],
	},
	potions: {
		text: 'Health potions, 15 gold each. Ether flasks, 20 gold.',
		choices: [
			{text: 'Health potion please.', next: 'buy_hp'},
			{text: 'An ether flask.', next: 'buy_mp'},
			{text: 'Maybe later.', next: 'start'},
		],
	},
	buy_hp: {
		text: 'Here you are. Stay alive out there.',
		choices: [{text: 'Thanks.', next: 'exit'}],
	},
	buy_mp: {
		text: 'Ether — liquid magic. Handle with care.',
		choices: [{text: 'Will do.', next: 'exit'}],
	},
	ruins_news: {
		text: 'The ruins to the north... they pulse with strange energy. The Warden grows stronger.',
		choices: [
			{text: 'Tell me more about the Warden.', next: 'warden'},
			{text: "I'll handle it.", next: 'start'},
		],
	},
	warden: {
		text: 'An ancient guardian. It hoards Echo Cores — artifacts of immense power.',
		choices: [
			{text: 'How do I defeat it?', next: 'warden_hint'},
			{text: "I'll find my own way.", next: 'start'},
		],
	},
	warden_hint: {
		text: 'Get strong in the forest and cave first. Collect Signal Blades and potions.',
		choices: [{text: 'I understand.', next: 'exit'}],
	},
	exit: {
		text: '',
		choices: [],
	},
}

const ELDER_DIALOGUE: Record<string, DialogueNode> = {
	start: {
		text: 'The signal weakens with each passing cycle. You must restore it.',
		choices: [
			{text: 'What signal?', next: 'signal'},
			{text: 'How can I help?', next: 'help'},
			{text: "I'll do what I can.", next: 'exit'},
		],
	},
	signal: {
		text: 'The signal connects all things. Without it, the void consumes.',
		choices: [
			{text: 'Where does it come from?', next: 'origin'},
			{text: "I'll investigate.", next: 'exit'},
		],
	},
	origin: {
		text: 'Deep in the ruins, the Echo Cores sustain it. But the Warden guards them.',
		choices: [{text: "I'll get them back.", next: 'exit'}],
	},
	help: {
		text: 'Venture north. Forest, cave, ruins. Collect Echo Cores. Defeat the Warden.',
		choices: [{text: 'I will.', next: 'exit'}],
	},
	exit: {text: '', choices: []},
}

const GUARD_DIALOGUE: Record<string, DialogueNode> = {
	start: {
		text: "The path north leads to the forest. It's dangerous beyond level 2.",
		choices: [
			{text: 'What dangers await?', next: 'dangers'},
			{text: 'I can handle it.', next: 'exit'},
		],
	},
	dangers: {
		text: 'Glitch wolves in the forest. Cave sentinels deeper. And the Void Warden in the ruins.',
		choices: [
			{text: 'Any advice?', next: 'advice'},
			{text: 'Thanks for the warning.', next: 'exit'},
		],
	},
	advice: {
		text: 'Stock up on potions at the merchant. And watch for items dropped by enemies.',
		choices: [{text: 'Will do.', next: 'exit'}],
	},
	exit: {text: '', choices: []},
}

const SAGE_DIALOGUE: Record<string, DialogueNode> = {
	start: {
		text: 'You carry the mark of the Signal. Few do anymore.',
		choices: [
			{text: 'What mark?', next: 'mark'},
			{text: 'You speak in riddles.', next: 'riddles'},
			{text: 'Goodbye, sage.', next: 'exit'},
		],
	},
	mark: {
		text: 'The ability to channel Echo Cores. To bend the void. It chose you.',
		choices: [
			{text: 'Why me?', next: 'why'},
			{text: 'I accept this burden.', next: 'exit'},
		],
	},
	why: {
		text: 'The signal does not explain itself. It simply... calls.',
		choices: [{text: 'Then I answer.', next: 'exit'}],
	},
	riddles: {
		text: 'Truth often hides in riddles. Look for the hidden paths in the forest.',
		choices: [{text: "I'll look carefully.", next: 'exit'}],
	},
	exit: {text: '', choices: []},
}

export const DIALOGUE_TREES: Record<string, Record<string, DialogueNode>> = {
	merchant: MERCHANT_DIALOGUE,
	elder: ELDER_DIALOGUE,
	guard: GUARD_DIALOGUE,
	sage: SAGE_DIALOGUE,
}

export class DialogueSystem {
	trees: Record<string, Record<string, DialogueNode>>
	currentTree: string | null
	currentNode: string | null
	isActive: boolean

	constructor() {
		this.trees = DIALOGUE_TREES
		this.currentTree = null
		this.currentNode = null
		this.isActive = false
	}

	start(treeId: string, nodeId: string): void {
		const tree = this.trees[treeId]
		if (!tree) return
		const node = tree[nodeId]
		if (!node) return
		this.currentTree = treeId
		this.currentNode = nodeId
		this.isActive = true
	}

	getCurrentNode(): DialogueNode | null {
		if (!this.currentTree || !this.currentNode) return null
		return this.trees[this.currentTree]?.[this.currentNode] ?? null
	}

	selectChoice(index: number): boolean {
		const node = this.getCurrentNode()
		if (!node) return false
		const choice = node.choices[index]
		if (!choice) return false
		if (choice.action) choice.action()
		if (choice.next === 'exit') {
			this.isActive = false
			this.currentTree = null
			this.currentNode = null
			return false
		}
		this.currentNode = choice.next
		return true
	}

	close(): void {
		this.isActive = false
		this.currentTree = null
		this.currentNode = null
	}
}
