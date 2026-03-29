const cheerio = require('cheerio')
const axios = require('axios')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'https://www.asciiart.eu'
const DELAY_MS = 500 // Delay between requests to be respectful

// Utility function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Create directory if it doesn't exist
function ensureDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, {recursive: true})
	}
}

// Sanitize filename
function sanitizeFilename(name) {
	return name
		.replace(/[<>:"/\\|?*]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.toLowerCase()
		.substring(0, 100)
}

// Fetch HTML page
async function fetchPage(url) {
	try {
		const response = await axios.get(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			},
		})
		return response.data
	} catch (error) {
		console.error(`Error fetching ${url}:`, error.message)
		return null
	}
}

// Fetch art data from API
async function fetchArtData(id) {
	try {
		const response = await axios.get(
			`${BASE_URL}/app/api/get-art.php?id=${id}`,
			{
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				},
			},
		)
		return response.data
	} catch (error) {
		console.error(`Error fetching art ${id}:`, error.message)
		return null
	}
}

// Extract categories from main gallery
async function getCategories() {
	console.log('Fetching main gallery...')
	const html = await fetchPage(`${BASE_URL}/gallery`)
	if (!html) return []

	const $ = cheerio.load(html)
	const categories = []

	$('a.card-gallery').each((i, elem) => {
		const href = $(elem).attr('href')
		const title = $(elem).attr('title')
		if (href && title) {
			categories.push({
				url: `${BASE_URL}${href}`,
				path: href.substring(1), // Remove leading slash
				name: title,
			})
		}
	})

	console.log(`Found ${categories.length} categories`)
	return categories
}

// Extract subcategories from a category page
async function getSubcategories(categoryUrl, categoryPath) {
	console.log(`Fetching category: ${categoryPath}`)
	const html = await fetchPage(categoryUrl)
	if (!html) return []

	const $ = cheerio.load(html)
	const subcategories = []

	$('a.card-gallery').each((i, elem) => {
		const href = $(elem).attr('href')
		const title = $(elem).attr('title')
		if (href && title) {
			subcategories.push({
				url: `${BASE_URL}${href}`,
				path: href.substring(1),
				name: title,
			})
		}
	})

	console.log(
		`  Found ${subcategories.length} subcategories in ${categoryPath}`,
	)
	return subcategories
}

// Extract art IDs from subcategory page
async function getArtPieces(subcategoryUrl, subcategoryPath) {
	console.log(`  Fetching subcategory: ${subcategoryPath}`)
	const html = await fetchPage(subcategoryUrl)
	if (!html) return []

	const $ = cheerio.load(html)
	const artPieces = []

	$('.art-card').each((i, elem) => {
		const id = $(elem).attr('data-id')
		const title = $(elem).attr('data-title') || 'untitled'
		const artist = $(elem).attr('data-artist') || 'unknown'
		const height = $(elem).attr('data-height')
		const width = $(elem).attr('data-width')
		const views = $(elem).attr('data-views')

		// Extract ASCII preview
		const asciiPreview = $(elem).find('.art-card__ascii').text().trim()

		if (id) {
			artPieces.push({
				id,
				title,
				artist,
				height: parseInt(height) || 0,
				width: parseInt(width) || 0,
				views: parseInt(views) || 0,
				preview: asciiPreview,
			})
		}
	})

	console.log(`    Found ${artPieces.length} art pieces in ${subcategoryPath}`)
	return artPieces
}

// Save art piece to file
async function saveArtPiece(artData, outputDir, subcategoryPath, index) {
	if (!artData || !artData.art) return false

	const sanitizedName = sanitizeFilename(artData.title || 'untitled')
	const baseFilename = `${sanitizedName}-${artData.id}`

	// Save ASCII art as .txt
	const txtPath = path.join(outputDir, `${baseFilename}.txt`)
	fs.writeFileSync(txtPath, artData.art, 'utf8')

	// Save metadata as .json
	const metadata = {
		id: artData.id,
		title: artData.title,
		artist: artData.artists,
		category: subcategoryPath,
		width: artData.width,
		height: artData.height,
		characters: artData.characters,
		classification: artData.classification,
		added: artData.added,
		views: artData.views,
		likes: artData.likes,
		keywords: artData.keywords,
	}
	const jsonPath = path.join(outputDir, `${baseFilename}.json`)
	fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2), 'utf8')

	return true
}

// Main extraction function
async function extractAll() {
	const startTime = Date.now()
	let totalArtPieces = 0
	let totalSaved = 0

	console.log('Starting ASCII art extraction from asciiart.eu...\n')

	// Create output directory
	const outputDir = path.join(__dirname, 'asciiart')
	ensureDir(outputDir)

	// Get all categories
	const categories = await getCategories()
	await delay(DELAY_MS)

	// Process each category
	for (const category of categories) {
		// Some categories link directly to art (like one-line)
		// Others have subcategories
		const subcategories = await getSubcategories(category.url, category.path)
		await delay(DELAY_MS)

		if (subcategories.length === 0) {
			// This category has direct art pieces (no subcategories)
			console.log(`  Processing direct art in ${category.path}`)
			const artPieces = await getArtPieces(category.url, category.path)
			await delay(DELAY_MS)

			const categoryDir = path.join(outputDir, sanitizeFilename(category.name))
			ensureDir(categoryDir)

			for (let i = 0; i < artPieces.length; i++) {
				const piece = artPieces[i]
				totalArtPieces++

				console.log(
					`    Fetching art ${i + 1}/${artPieces.length}: ${piece.id}`,
				)
				const artData = await fetchArtData(piece.id)
				await delay(DELAY_MS)

				if (artData) {
					const saved = await saveArtPiece(
						artData,
						categoryDir,
						category.path,
						i,
					)
					if (saved) totalSaved++
				}
			}
		} else {
			// Process subcategories
			for (const subcategory of subcategories) {
				const artPieces = await getArtPieces(subcategory.url, subcategory.path)
				await delay(DELAY_MS)

				// Create directory structure
				const dirParts = subcategory.path.split('/')
				const sanitizedParts = dirParts.map(p => sanitizeFilename(p))
				const subcategoryDir = path.join(outputDir, ...sanitizedParts)
				ensureDir(subcategoryDir)

				// Fetch and save each art piece
				for (let i = 0; i < artPieces.length; i++) {
					const piece = artPieces[i]
					totalArtPieces++

					console.log(
						`    Fetching art ${i + 1}/${artPieces.length}: ${piece.id}`,
					)
					const artData = await fetchArtData(piece.id)
					await delay(DELAY_MS)

					if (artData) {
						const saved = await saveArtPiece(
							artData,
							subcategoryDir,
							subcategory.path,
							i,
						)
						if (saved) totalSaved++
					}
				}
			}
		}
	}

	const endTime = Date.now()
	const duration = ((endTime - startTime) / 1000).toFixed(2)

	console.log('\n' + '='.repeat(50))
	console.log('Extraction Complete!')
	console.log('='.repeat(50))
	console.log(`Total art pieces found: ${totalArtPieces}`)
	console.log(`Successfully saved: ${totalSaved}`)
	console.log(`Duration: ${duration} seconds`)
	console.log(`Output directory: ${outputDir}`)
}

// Run extraction
extractAll().catch(console.error)
