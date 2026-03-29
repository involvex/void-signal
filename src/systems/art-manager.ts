import {loadArtFromDirectory} from './art-loader.ts'
import type {RGB} from '../engine/screen-buffer.ts'
import type {DialogueNode} from '../types.ts'

export interface ArtPiece {
	id: string
	title: string
	artist: string
	category: string
	width: number
	height: number
	characters: number
	classification: string
	added: string
	views: number
	likes: number
	keywords: string[]
	art: string
}

export interface ArtCategory {
	name: string
	pieces: ArtPiece[]
}

export class ArtManager {
	private cache: Map<string, ArtPiece>
	private categories: Map<string, ArtPiece[]>

	constructor() {
		this.cache = new Map()
		this.categories = new Map()
	}

	// Load art from JSON files in the asciiart directory
	async initialize(): Promise<void> {
		try {
			const {pieces, categories} = await loadArtFromDirectory('../asciiart')
			pieces.forEach(piece => {
				this.cache.set(piece.id, piece)
			})
			categories.forEach(category => {
				this.categories.set(category.name, category.pieces)
			})
			console.log(
				`Loaded ${pieces.length} art pieces from ${categories.length} categories`,
			)
		} catch (error) {
			console.error('Failed to load art:', error)
		}
	}

	// Get a random art piece by category
	getRandomArt(category: string): ArtPiece | null {
		const pieces = this.categories.get(category)
		if (pieces === undefined || pieces.length === 0) {
			return null
		}
		const piece = pieces[Math.floor(Math.random() * pieces.length)]
		return piece !== undefined ? piece : null
	}

	// Get art by title (fuzzy match)
	getArtByTitle(title: string): ArtPiece | null {
		const lowerTitle = title.toLowerCase()
		for (const piece of this.cache.values()) {
			if (piece.title.toLowerCase().includes(lowerTitle)) {
				return piece
			}
		}
		return null
	}

	// Get art by ID (from cache)
	getArt(id: string): ArtPiece | null {
		return this.cache.get(id) || null
	}

	// Get categories with art counts
	getCategories(): ArtCategory[] {
		return Array.from(this.categories.entries()).map(([name, pieces]) => ({
			name,
			pieces,
		}))
	}

	// Get art for an NPC based on type
	getNPCPortrait(npc: {name: string; isMerchant: boolean}): ArtPiece | null {
		const baseCategory = npc.isMerchant ? 'objects' : 'people'
		const nameLower = npc.name.toLowerCase()

		// Try specific categories first
		if (nameLower.includes('merchant')) return this.getRandomArt('objects')
		if (nameLower.includes('guard') || nameLower.includes('warrior'))
			return this.getRandomArt('people')
		if (nameLower.includes('elder') || nameLower.includes('sage'))
			return this.getRandomArt('people')
		if (nameLower.includes('animal') || nameLower.includes('creature'))
			return this.getRandomArt('animals')

		// Fallback to general categories
		const art = this.getRandomArt(baseCategory)
		if (art !== null) {
			return art
		}
		return this.getRandomArt('people')
	}
}
