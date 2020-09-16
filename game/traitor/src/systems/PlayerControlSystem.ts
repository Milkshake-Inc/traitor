import { useQueries, useState } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Input from '@ecs/plugins/input/components/Input';
import { Key } from '@ecs/plugins/input/Control';
import Keyboard from '@ecs/plugins/input/Keyboard';
import Transform from '@ecs/plugins/math/Transform';
import Sprite from '@ecs/plugins/render/2d/components/Sprite';

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
		player: all(Transform, Sprite)
	})

	update(dt: number) {
		for (const player of this.queries.player) {
			const { position } = player.get(Transform);

			if(this.inputs.state.right.down) position.x += this.PLAYER_SPEED * dt;
			if(this.inputs.state.left.down) position.x -= this.PLAYER_SPEED * dt;

			if(this.inputs.state.up.down) position.y -= this.PLAYER_SPEED * dt;
			if(this.inputs.state.down.down) position.y += this.PLAYER_SPEED * dt;
		}
	}
}