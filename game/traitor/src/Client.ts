import { Entity } from '@ecs/core/Entity';
import { useSimpleEvents } from '@ecs/core/helpers';
import TickerEngine from '@ecs/core/TickerEngine';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Color from '@ecs/plugins/math/Color';
import Transform from '@ecs/plugins/math/Transform';
import Vector3 from '@ecs/plugins/math/Vector';
import { ArcadeCollisionShape } from '@ecs/plugins/physics/arcade/components/ArcadeCollisionShape';
import ArcadePhysics from '@ecs/plugins/physics/arcade/components/ArcadePhysics';
import ArcadeCollisionSystem from '@ecs/plugins/physics/arcade/systems/ArcadeCollisionSystem';
import ArcadePhysicsSystem from '@ecs/plugins/physics/arcade/systems/ArcadePhysicsSystem';
import Camera from '@ecs/plugins/render/2d/components/Camera';
import CameraRenderSystem from '@ecs/plugins/render/2d/systems/CameraRenderSystem';
import RenderSystem from '@ecs/plugins/render/2d/systems/RenderSystem';
import Space from '@ecs/plugins/space/Space';
import { LoadPixiAssets } from '@ecs/plugins/tools/PixiHelper';
import { filters, Loader, Sprite, Container, Graphics } from 'pixi.js';
import { Light } from './components/Light';
import { Player } from './components/Player';
import { ShadowCaster } from './components/ShadowCaster';
import { BasicLightingSystem } from './systems/BasicLightingSystem';
import { AnimatedPlayer, PlayerAnimationSystem } from './systems/PlayerAnimationSystem';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { PlayerNamePlateSystems } from './systems/PlayerNamePlateSystem';
import { RoleSystem } from './systems/RoleSystem';
import { PolygonFile } from './utils/PolygonFile';
import { convertToPolygonShape } from './utils/PolygonUtils';
import { LocalPlayer } from './components/LocalPlayer';
import { PlayerMaskSystems } from './systems/PlayerMaskSystem';
import Random from '@ecs/plugins/math/Random';
import UIDisplayObject from '@ecs/plugins/render/2d/components/UIDisplayObject';
import { Engine } from '@ecs/core/Engine';
import { System } from '@ecs/core/System';
import { useEntity } from '@ecs/core/helpers/useEntity';

export const Assets = {
	Player: 'assets/player.json',
	Ship: 'assets/prefab.png',
	Deck1: 'assets/deck_1.png',
	Deck2: 'assets/deck_2.png',
	Deck3: 'assets/deck_3.png',
	ShipLighting: 'assets/ship_lighting.json',
	ShipCollision: 'assets/ship_collision.json',
	MaskTest: 'assets/mask_test.png'
};

export class ClientTraitor extends Space {
	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		this.addSystem(
			new RenderSystem({
				clearColor: Color.SkyBlue
			})
		);

		this.addSystem(new CameraRenderSystem());
		this.addSystem(new InputSystem());
		this.addSystem(new PlayerControlSystem());
		this.addSystem(new PlayerAnimationSystem());

		this.addSystem(new ArcadePhysicsSystem());
		this.addSystem(new ArcadeCollisionSystem());
		this.addSystem(new RoleSystem());

		this.addSystem(new BasicLightingSystem());
		this.addSystem(new PlayerNamePlateSystems());
		this.addSystem(new PlayerMaskSystems())
		// this.addSystem(new ArcadePhysicsDebugger())


		const shipBasement = new Entity();
		shipBasement.add(Transform);
		shipBasement.add(Sprite.from(Assets.Deck2),{
			alpha: 0.8
		});

		const shipPolygonFile: PolygonFile = Loader.shared.resources[Assets.ShipCollision].data;

		const polygonShape = convertToPolygonShape(shipPolygonFile);

		const ship = new Entity();
		ship.add(Transform);
		ship.add(Sprite.from(Assets.Deck3), {
			// alpha: 0
		});
		ship.add(polygonShape);
		ship.add(ShadowCaster);

		const shipCollisionPolygonFile: PolygonFile = Loader.shared.resources[Assets.ShipCollision].data;
		const collisionPolygonShape = convertToPolygonShape(shipCollisionPolygonFile);

		for (const polygon of collisionPolygonShape.polygons) {
			const wall = new Entity();
			wall.add(Transform);
			wall.add(ArcadeCollisionShape.Polygon(polygon.map(p => new Vector3(p.x, p.y, 0)).reverse()));
			wall.add(ArcadePhysics, {
				isStatic: true
			});
			this.addEntity(wall);
		}

		const player = new Entity();
		const playerSprite = Sprite.from('idle-1.png');
		playerSprite.anchor.set(0.5);
		player.add(Transform, {
			position: new Vector3(400, 500)
		});
		player.add(playerSprite);
		player.add(ArcadeCollisionShape.Circle(25));
		player.add(ArcadePhysics);
		player.add(Camera, { offset: new Vector3(0, 0) });
		player.add(AnimatedPlayer);
		player.add(LocalPlayer);
		player.add(Player);
		player.add(Light, {
			color: Color.White,
			intensity: 0.2,
			size: 400,
			drawsToColor: false
		});

		this.addEntities(ship, player);

		const ui = new Entity();
		ui.add(Transform);
		ui.add(Sprite.from('idle-1.png'))
		ui.add(UIDisplayObject)

		this.addEntities(ui);

		setTimeout(() => {
			const event = useSimpleEvents();
			event.emit(RoleSystem.ASSIGN_ROLE_EVENT);
		}, 2000);
	}
}

const addFakePlayers = (count = 3) => {
	for (let index = 0; index < count; index++) {
		const player = new Entity();
		const playerSprite = Sprite.from('idle-1.png');
		const colorMatrixFilter = new filters.ColorMatrixFilter();
		colorMatrixFilter.hue(Math.random() * 360, true);
		playerSprite.filters = [colorMatrixFilter];
		playerSprite.anchor.set(0.5);

		// playerSprite.mask =
		player.add(Transform, {
			position: new Vector3(Random.float(400, 2000), Random.float(200, 500))
		});

		player.add(playerSprite);
		player.add(ArcadeCollisionShape.Circle(25));
		player.add(ArcadePhysics);
		player.add(AnimatedPlayer);
		player.add(Player);

		engine.addEntity(player);
	}
};

const engine = new TickerEngine(60);

setTimeout(() => {
	addFakePlayers(8);
}, 1000);

new ClientTraitor(engine, true);
console.log('🎉 Client');

class ButtonMinigame extends Space {
	constructor(engine: Engine) {
		super(engine, true)

		this.addSystem(new ButtonMinigameSystem())
	}
}

class ButtonMinigameSystem extends System {

	protected container = new Container();

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
			console.log("Clicky")
		})

		this.container.addChild(background);
		this.container.addChild(button);
	}
}

new ButtonMinigame(engine);