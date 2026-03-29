const path = require('path')
const fs = require('fs')

const ASCIIART_DIR = path.join(__dirname, 'asciiart')

// Recursively find all JSON metadata files
function findMetadataFiles(dir, fileList = []) {
	const files = fs.readdirSync(dir)

	files.forEach(file => {
		const filePath = path.join(dir, file)
		const stat = fs.statSync(filePath)

		if (stat.isDirectory()) {
			findMetadataFiles(filePath, fileList)
		} else if (file.endsWith('.json')) {
			fileList.push(filePath)
		}
	})

	return fileList
}

// Build index from metadata files
function buildIndex() {
	console.log('Building index...\n')

	if (!fs.existsSync(ASCIIART_DIR)) {
		console.error('ASCII art directory not found. Run extraction first.')
		return
	}

	const metadataFiles = findMetadataFiles(ASCIIART_DIR)
	console.log(`Found ${metadataFiles.length} art pieces\n`)

	const index = {
		generated: new Date().toISOString(),
		totalPieces: metadataFiles.length,
		categories: {},
		artists: {},
		allPieces: [],
	}

	// Process each metadata file
	metadataFiles.forEach(filePath => {
		try {
			const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'))
			const relativePath = path.relative(ASCIIART_DIR, filePath)
			const txtFile = relativePath.replace('.json', '.txt')

			// Add to all pieces
			index.allPieces.push({
				id: metadata.id,
				title: metadata.title,
				artist: metadata.artist,
				category: metadata.category,
				width: metadata.width,
				height: metadata.height,
				characters: metadata.characters,
				views: metadata.views,
				file: relativePath,
				asciiFile: txtFile,
			})

			// Index by category
			const category = metadata.category || 'uncategorized'
			if (!index.categories[category]) {
				index.categories[category] = []
			}
			index.categories[category].push(metadata.id)

			// Index by artist
			const artist = metadata.artist || 'unknown'
			if (!index.artists[artist]) {
				index.artists[artist] = []
			}
			index.artists[artist].push(metadata.id)
		} catch (error) {
			console.error(`Error processing ${filePath}:`, error.message)
		}
	})

	// Save index
	const indexPath = path.join(ASCIIART_DIR, 'index.json')
	fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8')
	console.log(`Index saved to: ${indexPath}`)

	// Generate README
	generateReadme(index)

	// Print summary
	console.log('\n' + '='.repeat(50))
	console.log('Index Summary')
	console.log('='.repeat(50))
	console.log(`Total art pieces: ${index.totalPieces}`)
	console.log(`Categories: ${Object.keys(index.categories).length}`)
	console.log(`Artists: ${Object.keys(index.artists).length}`)
	console.log('\nTop 10 categories:')

	Object.entries(index.categories)
		.sort((a, b) => b[1].length - a[1].length)
		.slice(0, 10)
		.forEach(([category, pieces]) => {
			console.log(`  ${category}: ${pieces.length} pieces`)
		})

	console.log('\nTop 10 artists:')
	Object.entries(index.artists)
		.filter(([artist]) => artist !== 'unknown')
		.sort((a, b) => b[1].length - a[1].length)
		.slice(0, 10)
		.forEach(([artist, pieces]) => {
			console.log(`  ${artist}: ${pieces.length} pieces`)
		})
}

// Generate README.md
function generateReadme(index) {
	const readmePath = path.join(ASCIIART_DIR, 'README.md')

	let content = `# ASCII Art Collection

A collection of ASCII art extracted from [asciiart.eu](https://www.asciiart.eu/gallery).

## Summary

- **Total pieces**: ${index.totalPieces}
- **Categories**: ${Object.keys(index.categories).length}
- **Artists**: ${Object.keys(index.artists).length}
- **Generated**: ${index.generated}

## Categories

| Category | Pieces |
|----------|--------|
`

	Object.entries(index.categories)
		.sort((a, b) => b[1].length - a[1].length)
		.forEach(([category, pieces]) => {
			content += `| ${category} | ${pieces.length} |\n`
		})

	content += `
## Top Artists

| Artist | Pieces |
|--------|--------|
`

	Object.entries(index.artists)
		.filter(([artist]) => artist !== 'unknown')
		.sort((a, b) => b[1].length - a[1].length)
		.slice(0, 20)
		.forEach(([artist, pieces]) => {
			content += `| ${artist} | ${pieces.length} |\n`
		})

	content += `
## File Structure

Each art piece is stored in two files:
- \`.txt\` - The ASCII art content
- \`.json\` - Metadata (title, artist, dimensions, etc.)

## Usage

Browse the directories to find art by category. Each piece has a unique ID in its filename.

## Source

Extracted from [asciiart.eu](https://www.asciiart.eu/gallery) - one of the largest online collections of text-based artworks.

## Attribution

The ASCII art in this collection was created by many different artists. Credit has been given where the artist is known. If you use artwork from here, please do not remove the artist's name/initials if present.
`

	fs.writeFileSync(readmePath, content, 'utf8')
	console.log(`README saved to: ${readmePath}`)
}

// Run index builder
buildIndex()
