import { Engine } from "@ecs/core/Engine"
import { Entity } from "@ecs/core/Entity"
import { useSimpleEvents } from "@ecs/core/helpers"
import Color from "@ecs/plugins/math/Color"
import Transform from "@ecs/plugins/math/Transform"
import UIDisplayObject from "@ecs/plugins/render/2d/components/UIDisplayObject"
import Space from "@ecs/plugins/space/Space"
import { Container, Graphics } from "pixi.js"
import { CLOSE_MINIGAME_EVENT } from "../Client"
import { ButtonMinigameSystem } from "../systems/ButtonMinigameSystem"

export class ButtonMinigame extends Space {
	protected container = new Container();
	protected events = useSimpleEvents();

	constructor(engine: Engine) {
		super(engine, false)
	}

	setup() {
		const game = new Entity();
		game.add(Transform, {
				x: 1280 / 2,
				y: 720 / 2,
		});
		game.add(this.container);
		game.add(UIDisplayObject);

		const background = new Graphics();
		background.pivot.set(250, 250);
		background.beginFill(Color.Gray);
		background.drawRect(0, 0, 500, 500);

		const button = new Graphics();
		button.beginFill(Color.Tomato);
		button.drawCircle(0, 0, 200);
		button.interactive = button.buttonMode = true;
		button.on("click", () => {
			this.events.emit(CLOSE_MINIGAME_EVENT);
		})

		this.container.addChild(background);
		this.container.addChild(button);

		this.addEntity(game);
	}
}