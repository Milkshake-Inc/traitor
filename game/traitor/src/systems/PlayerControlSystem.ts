import { useQueries, useState } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Input from '@ecs/plugins/input/components/Input';
import { Key } from '@ecs/plugins/input/Control';
import Keyboard from '@ecs/plugins/input/Keyboard';
import Transform from '@ecs/plugins/math/Transform';
import { Sprite } from 'pixi.js';
import ArcadePhysics from '@ecs/plugins/physics/arcade/components/ArcadePhysics';

export class PlayerControlSystem extends System {
	readonly PLAYER_SPEED = 0.3;

	protected inputs = useState(
		this,
		new Input({
			boost: Keyboard.key(Key.Shift),
			up: Keyboard.key(Key.W),
			down: Keyboard.key(Key.S),
			left: Keyboard.key(Key.A),
			right: Keyboard.key(Key.D),
		})
	);

	protected queries = useQueries(this, {
		player: all(Transform, Sprite, ArcadePhysics)
	})

	update(dt: number) {
		for (const player of this.queries.player) {
			const { velocity } = player.get(ArcadePhysics);

			velocity.set(0, 0, 0);

			if(this.inputs.state.right.down) velocity.x += this.PLAYER_SPEED;
			if(this.inputs.state.left.down) velocity.x -= this.PLAYER_SPEED;

			if(this.inputs.state.up.down) velocity.y -= this.PLAYER_SPEED;
			if(this.inputs.state.down.down) velocity.y += this.PLAYER_SPEED;
		}
	}
}