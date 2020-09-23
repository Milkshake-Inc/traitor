import { Entity } from '@ecs/core/Entity';
import TickerEngine from '@ecs/core/TickerEngine';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Color from '@ecs/plugins/math/Color';
import Transform from '@ecs/plugins/math/Transform';
import Vector3 from '@ecs/plugins/math/Vector';
import Camera from '@ecs/plugins/render/2d/components/Camera';
import CameraRenderSystem from '@ecs/plugins/render/2d/systems/CameraRenderSystem';
import RenderSystem from '@ecs/plugins/render/2d/systems/RenderSystem';
import Space from '@ecs/plugins/space/Space';
import { LoadPixiAssets } from '@ecs/plugins/tools/PixiHelper';
import { Loader, Sprite } from 'pixi.js';
import { usePolygonDebugCouple } from './couple/usePolygonDebugCouple';
import { AnimatedPlayer, PlayerAnimationSystem } from './systems/PlayerAnimationSystem';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { Movement, PlayerMovementSystem } from './systems/PlayerMovementSystem';
import { PolygonShapeData } from './components/PolygonData';
import { convertToPolygonShape, convertToLines } from './utils/PolygonUtils';
import { PolygonFile } from './utils/PolygonFile';

const Assets = {
	Background: 'assets/player.json',
	Ship: 'assets/prefab.png',
	ShipCollision: 'assets/ship.json'
};

export class ClientTraitor extends Space {
	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		this.addSystem(
			new RenderSystem(
				{
					clearColor: Color.SkyBlue
				},
				system => [usePolygonDebugCouple(system)]
			)
		);

		this.addSystem(new CameraRenderSystem());
		this.addSystem(new InputSystem());
		this.addSystem(new PlayerControlSystem());
		this.addSystem(new PlayerMovementSystem());
		this.addSystem(new PlayerAnimationSystem());

		const ship = new Entity();
		ship.add(Transform, {
			// scale: Vector3.EQUAL(0.8),
		});
		ship.add(Sprite.from(Assets.Ship));

		const shipPolygonFile: PolygonFile = Loader.shared.resources[Assets.ShipCollision].data;
		const polygonShape = convertToPolygonShape(shipPolygonFile);
		const polygonLines = convertToLines(polygonShape);
		console.log(polygonLines);
		ship.add(polygonShape);

		const background = new Entity();
		background.add(Transform);
		background.add(Sprite.from('idle-1.png'));
		background.add(Movement);
		background.add(Camera, { offset: new Vector3(0, 0) });
		background.add(AnimatedPlayer);
		background.add(PolygonShapeData, {
			polygons: [
				[
					{ x: 0, y: 0 },
					{ x: 50, y: 0 },
					{ x: 50, y: 50 },
					{ x: 0, y: 50 }
				]
			]
		});
		this.addEntities(ship, background);
	}
}

const engine = new TickerEngine();
new ClientTraitor(engine, true);
console.log('🎉 Client');
