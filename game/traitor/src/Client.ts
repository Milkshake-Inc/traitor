import { Entity } from '@ecs/core/Entity';
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
import { Loader, Sprite } from 'pixi.js';
import { Light } from './components/Light';
import { ShadowCaster } from './components/ShadowCaster';
import { AnimatedPlayer, PlayerAnimationSystem } from './systems/PlayerAnimationSystem';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { PolygonFile } from './utils/PolygonFile';
import { convertToPolygonShape } from './utils/PolygonUtils';
import { BasicLightingSystem } from './systems/BasicLightingSystem';
import { RoleSystem } from './systems/RoleSystem';
import { useSimpleEvents } from '@ecs/core/helpers';
import { Player } from './components/Player';
import Text from '@ecs/plugins/render/2d/components/Text';

export const Assets = {
	Player: 'assets/player.json',
	Ship: 'assets/prefab.png',
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

		// this.addSystem(new ArcadePhysicsDebugger())

		const randomLight = new Entity();
		randomLight.add(Transform, {
			x: 400,
			y: 400
		});
		randomLight.add(Light, {
			color: Color.Red,
			intensity: 0.6,
			feather: 200,
			drawsToMask: false,
			drawsToColor: true,
			size: 500
		});
		this.addEntity(randomLight);

		const randomLight2 = new Entity();
		randomLight2.add(Transform, {
			x: 800,
			y: 400
		});
		randomLight2.add(Light, {
			color: Color.Green,
			intensity: 0.6,
			feather: 200,
			drawsToMask: false,
			drawsToColor: true,
			size: 500
		});
		this.addEntity(randomLight2);

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
		player.add(Player);
		player.add(Text, {
			value: player.get(Player).name,
			anchor: new Vector3(0.5, -1.8)
		});
		player.add(Light, {
			color: Color.White,
			intensity: 0.2,
			drawsToColor: false,
		});

		this.addEntities(ship, player);

		setTimeout(() => {
			const event = useSimpleEvents();
			event.emit(RoleSystem.ASSIGN_ROLE_EVENT);
		}, 2000);
	}
}

const engine = new TickerEngine();
new ClientTraitor(engine, true);
console.log('🎉 Client');
