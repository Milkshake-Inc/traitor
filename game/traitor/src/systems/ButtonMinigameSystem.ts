import { useEntity } from '@ecs/core/helpers/useEntity';
import { System } from '@ecs/core/System';
import Color from '@ecs/plugins/math/Color';
import Transform from '@ecs/plugins/math/Transform';
import UIDisplayObject from '@ecs/plugins/render/2d/components/UIDisplayObject';
import { Container, Graphics } from 'pixi.js';
import { useSimpleEvents } from '@ecs/core/helpers';
import { CLOSE_MINIGAME_EVENT } from '../Client';

export class ButtonMinigameSystem extends System {

	protected container = new Container();

	protected events = useSimpleEvents();

	constructor() {
		super()

		useEntity(this, (entity) => {
			entity.add(Transform, {
				x: 1280 / 2,
				y: 720 / 2,
			});
			entity.add(this.container)
			entity.add(UIDisplayObject);
		});

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
	}
}