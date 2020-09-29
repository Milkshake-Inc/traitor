import { Entity } from '@ecs/core/Entity';
import { useSimpleEvents } from '@ecs/core/helpers';
import TickerEngine from '@ecs/core/TickerEngine';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Color from '@ecs/plugins/math/Color';
import Random from '@ecs/plugins/math/Random';
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
import { filters, Loader, Sprite, Texture } from 'pixi.js';
import { Light } from '../../../ecs/src/engine/plugins/lighting/components/Light';
import { ShadowCaster } from '../../../ecs/src/engine/plugins/lighting/components/ShadowCaster';
import { BasicLightingSystem } from '../../../ecs/src/engine/plugins/lighting/systems/LightingSystem';
import { InteractableSystem } from './components/InteractableSystem';
import { LocalPlayer } from './components/LocalPlayer';
import { MinigameLauncher } from './components/MinigameLauncher';
import { Player } from './components/Player';
import { ButtonMinigame } from './spaces/ButtonMinigame';
import { AnimatedPlayer, PlayerAnimationSystem } from './systems/PlayerAnimationSystem';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { PlayerMaskSystems } from './systems/PlayerMaskSystem';
import { PlayerNamePlateSystems } from './systems/PlayerNamePlateSystem';
import { RoleSystem } from './systems/RoleSystem';
import { PolygonFile } from './utils/PolygonFile';
import { convertToPolygonShape } from './utils/PolygonUtils';
import { Events } from './utils/Constants';

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
		this.addSystem(new InteractableSystem());

		this.addSystem(new BasicLightingSystem());
		this.addSystem(new PlayerNamePlateSystems());
		this.addSystem(new PlayerMaskSystems());

		const shipPolygonFile: PolygonFile = Loader.shared.resources[Assets.ShipCollision].data;
		const polygonShape = convertToPolygonShape(shipPolygonFile);

		const ship = new Entity();
		ship.add(Transform);
		ship.add(Sprite.from(Assets.Ship));
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

		const interactiveItem1 = new Entity();
		const interactiveSprite1 = Sprite.from(Texture.WHITE);
		interactiveSprite1.anchor.set(0.5);
		interactiveItem1.add(interactiveSprite1);
		interactiveItem1.add(Transform, { position: new Vector3(500, 600) });
		interactiveItem1.add(MinigameLauncher);

		const interactiveItem2 = new Entity();
		const interactiveSprite2 = Sprite.from(Texture.WHITE);
		interactiveSprite2.anchor.set(0.5);
		interactiveItem2.add(interactiveSprite2);
		interactiveItem2.add(Transform, { position: new Vector3(300, 300) });
		interactiveItem2.add(MinigameLauncher);

		this.addEntities(ship, interactiveItem1, interactiveItem2, player);

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


const buttonMinigame = new ButtonMinigame(engine);

const events = useSimpleEvents();

events.on(Events.LAUNCH_MINIGAME_EVENT, () => {
	buttonMinigame.open();
})

events.on(Events.CLOSE_MINIGAME_EVENT, () => {
	buttonMinigame.close();
})
