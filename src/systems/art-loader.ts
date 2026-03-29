import * as path from 'path'
import * as fs from 'fs'

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

export async function loadArtFromDirectory(
	dir: string,
): Promise<{pieces: ArtPiece[]; categories: ArtCategory[]}> {
	const pieces: ArtPiece[] = []
	const categoryMap = new Map<string, ArtPiece[]>()

	// Scan directory structure recursively
	await scanDirectory(dir, '', categoryMap)

	// Convert map to categories array
	const categories: ArtCategory[] = []
	for (const [name, categoryPieces] of categoryMap) {
		if (categoryPieces.length > 0) {
			categories.push({name, pieces: categoryPieces})
			pieces.push(...categoryPieces)
		}
	}

	return {pieces, categories}
}

async function scanDirectory(
	dir: string,
	categoryPrefix: string,
	categoryMap: Map<string, ArtPiece[]>,
): Promise<void> {
	const dirEntries = await fs.promises.readdir(dir, {withFileTypes: true})

	for (const entry of dirEntries) {
		const fullPath = path.join(dir, entry.name)

		if (entry.isDirectory()) {
			// Recursively scan subdirectories
			const newPrefix = categoryPrefix
				? `${categoryPrefix}/${entry.name}`
				: entry.name
			await scanDirectory(fullPath, newPrefix, categoryMap)
		} else if (entry.name.endsWith('.txt')) {
			// Found an art file
			const id = entry.name.replace('.txt', '')
			const art = await loadArtFile(fullPath)
			if (art) {
				const jsonPath = path.join(dir, `${id}.json`)
				const metadata = await loadMetadataFile(jsonPath)
				if (metadata) {
					const piece: ArtPiece = {
						...metadata,
						art,
						category: categoryPrefix || 'uncategorized',
					}

					// Add to category map
					if (!categoryMap.has(piece.category)) {
						categoryMap.set(piece.category, [])
					}
					categoryMap.get(piece.category)!.push(piece)
				}
			}
		}
	}
}

async function loadArtFile(filePath: string): Promise<string | null> {
	try {
		return await fs.promises.readFile(filePath, 'utf8')
	} catch (error) {
		console.warn(`Could not load art file: ${filePath}`)
		return null
	}
}

async function loadMetadataFile(filePath: string): Promise<any | null> {
	try {
		const data = await fs.promises.readFile(filePath, 'utf8')
		return JSON.parse(data)
	} catch (error) {
		console.warn(`Could not load metadata file: ${filePath}`)
		return null
	}
}
