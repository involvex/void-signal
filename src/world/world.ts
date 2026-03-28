import {
	createTownScene,
	createForestScene,
	createCaveScene,
	createRuinsScene,
} from './maps.ts'
import {Scene} from './scene.ts'

export class WorldManager {
	scenes: Map<string, Scene>
	currentScene: Scene

	constructor() {
		this.scenes = new Map()
		this.scenes.set('town', createTownScene())
		this.scenes.set('forest', createForestScene())
		this.scenes.set('cave', createCaveScene())
		this.scenes.set('ruins', createRuinsScene())
		this.currentScene = this.scenes.get('town')!
	}

	getScene(id: string): Scene | null {
		return this.scenes.get(id) ?? null
	}

	switchScene(sceneId: string): Scene | null {
		const scene = this.scenes.get(sceneId)
		if (scene) {
			this.currentScene = scene
			return scene
		}
		return null
	}
}
