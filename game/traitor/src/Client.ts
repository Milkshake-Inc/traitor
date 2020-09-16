import { Entity } from '@ecs/core/Entity';
import Input from '@ecs/plugins/input/components/Input';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Transform from '@ecs/plugins/math/Transform';
import Sprite from '@ecs/plugins/render/2d/components/Sprite';
import { PixiEngine } from '@ecs/plugins/render/2d/PixiEngine';
import Space from '@ecs/plugins/space/Space';
import { LoadPixiAssets } from '@ecs/plugins/tools/PixiHelper';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { PlayerAnimationSystem, AnimatedPlayer } from './systems/PlayerAnimationSystem';
import { PlayerMovementSystem, Movement } from './systems/PlayerMovementSystem';

const Assets = {
	Background: 'assets/player.json',
};

export class ClientTraitor extends Space {
	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		this.addSystem(new InputSystem())
		this.addSystem(new PlayerControlSystem());
		this.addSystem(new PlayerMovementSystem());
		this.addSystem(new PlayerAnimationSystem())

		const background = new Entity();
        background.add(Transform);
		background.add(Sprite, { imageUrl: 'idle-1.png' });
		background.add(Movement);
		background.add(AnimatedPlayer);
		this.addEntities(background);
	}
}

const engine = new PixiEngine();
new ClientTraitor(engine, true);
console.log('🎉 Client');

