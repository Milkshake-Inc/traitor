import { System } from '@ecs/core/System';
import { useEntity } from '@ecs/core/helpers/useEntity';
import Transform from '@ecs/plugins/math/Transform';
import { Graphics } from 'pixi.js';
import { useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { ArcadeCollisionShape } from '@ecs/plugins/physics/arcade/components/ArcadeCollisionShape';
import { Circle, Polygon } from 'sat';
import Color from '@ecs/plugins/math/Color';

export class ArcadePhysicsDebugger extends System {
	protected graphics = useEntity(this, entity => {
		entity.add(Transform, { z: 1 });
		entity.add(Graphics);
	});

	protected query = useQueries(this, {
		physics: all(Transform, ArcadeCollisionShape)
	});

	update(dt: number) {
		const graphics = this.graphics.get(Graphics);

        graphics.clear();

        graphics.beginFill(Color.Red, 1);

		for (const physicsEntity of this.query.physics) {
			const { shape } = physicsEntity.get(ArcadeCollisionShape);

			if (shape instanceof Circle) {
				graphics.drawCircle(shape.pos.x, shape.pos.y, shape.r);
			}

			if (shape instanceof Polygon) {
				graphics.drawPolygon(shape.points.map(e => new PIXI.Point(shape.pos.x + e.x, shape.pos.y +  e.y)));
			}
		}
	}
}
