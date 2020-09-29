import { Engine } from "@ecs/core/Engine"
import Space from "@ecs/plugins/space/Space"
import { ButtonMinigameSystem } from "../systems/ButtonMinigameSystem"

export class ButtonMinigame extends Space {
	constructor(engine: Engine) {
		super(engine, false)

		this.addSystem(new ButtonMinigameSystem())
	}
}