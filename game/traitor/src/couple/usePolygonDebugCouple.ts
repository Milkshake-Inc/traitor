import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Color from '@ecs/plugins/math/Color';
import Transform from '@ecs/plugins/math/Transform';
import { usePixiCouple } from '@ecs/plugins/render/2d/couples/PixiCouple';
import { Graphics } from 'pixi.js';
import { PolygonShapeData } from '../components/PolygonData';

export const usePolygonDebugCouple = (system: System) =>
	usePixiCouple<Graphics>(system, all(Transform, PolygonShapeData), {
		onCreate: entity => {
			const polygonData = entity.get(PolygonShapeData);

			const graphic = new Graphics();

			graphic.lineStyle(2, Color.Red, 1);
			graphic.beginFill(Color.Yellow, 0);

			for (const polygon of polygonData.polygons) {
				for (let index = 0; index < polygon.length; index++) {
					const vertex = polygon[index];

					if (index == 0) {
						graphic.moveTo(vertex.x, vertex.y);
					} else {
						graphic.lineTo(vertex.x, vertex.y);
					}
				}
				graphic.closePath();
			}

			return graphic;
		}
	});
