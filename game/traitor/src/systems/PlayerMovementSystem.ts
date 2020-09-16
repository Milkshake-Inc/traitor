import { useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import Vector3 from '@ecs/plugins/math/Vector';
import Sprite from '@ecs/plugins/render/2d/components/Sprite';

export class Movement {
	velocity: Vector3 = Vector3.ZERO;
}

export class PlayerMovementSystem extends System {

	protected queries = useQueries(this, {
		player: all(Transform, Sprite, Movement)
	})

	update(dt: number) {
		for (const player of this.queries.player) {
			const { position } = player.get(Transform);
			const { velocity } = player.get(Movement);

			position.x += velocity.x * dt;
			position.y += velocity.y * dt;
		}
	}
}