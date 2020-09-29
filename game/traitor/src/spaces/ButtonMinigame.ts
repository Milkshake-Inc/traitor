import { Engine } from "@ecs/core/Engine"
import { Entity } from "@ecs/core/Entity"
import { useSimpleEvents } from "@ecs/core/helpers"
import Color from "@ecs/plugins/math/Color"
import Transform from "@ecs/plugins/math/Transform"
import { Interactable } from "@ecs/plugins/render/2d/components/Interactable"
import UIDisplayObject from "@ecs/plugins/render/2d/components/UIDisplayObject"
import Space from "@ecs/plugins/space/Space"
import { Graphics } from "pixi.js"

export const LAUNCH_MINIGAME_EVENT = "LAUNCH_MINIGAME";
export const CLOSE_MINIGAME_EVENT = "CLOSE_MINIGAME";

export class ButtonMinigame extends Space {
	protected events = useSimpleEvents();

	constructor(engine: Engine) {
		super(engine, false);
	}

	setup() {
		const background = new Entity();
		background.add(Transform, {
				x: 1280 / 2,
				y: 720 / 2,
		});
		background.add(UIDisplayObject);

		const bgGraphics = new Graphics();
		bgGraphics.pivot.set(250, 250);
		bgGraphics.beginFill(Color.Gray);
		bgGraphics.drawRect(0, 0, 500, 500);

		background.add(bgGraphics);

		const button = new Entity();
		button.add(Transform, {
			x: 1280 / 2,
			y: 720 / 2,
		});
		button.add(UIDisplayObject);
		button.add(Interactable);

		const buttonGraphics = new Graphics();
		buttonGraphics.beginFill(Color.Tomato);
		buttonGraphics.drawCircle(0, 0, 200);
		buttonGraphics.on("click", () => {
			this.events.emit(CLOSE_MINIGAME_EVENT, this);
		});
		button.add(buttonGraphics);

		this.addEntities(background, button);
	}
}