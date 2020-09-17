/* eslint-disable @typescript-eslint/camelcase */
import { useQueries } from '@ecs/core/helpers';
import { useEntity } from '@ecs/core/helpers/useEntity';
import { all, not } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Color from '@ecs/plugins/math/Color';
import Transform from '@ecs/plugins/math/Transform';
import { Graphics } from 'pixi.js';
import { PolygonShapeData } from '../components/PolygonData';
import { convertToLines } from '../utils/PolygonUtils';
import { Movement } from './PlayerMovementSystem';

// Stolen from
// https://ncase.me/sight-and-light/
function getIntersection(ray, segment) {
	// RAY in parametric: Point + Delta*T1
	const r_px = ray.a.x;
	const r_py = ray.a.y;
	const r_dx = ray.b.x - ray.a.x;
	const r_dy = ray.b.y - ray.a.y;

	// SEGMENT in parametric: Point + Delta*T2
	const s_px = segment.a.x;
	const s_py = segment.a.y;
	const s_dx = segment.b.x - segment.a.x;
	const s_dy = segment.b.y - segment.a.y;

	// Are they parallel? If so, no intersect
	const r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
	const s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
	if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) {
		// Unit vectors are the same.
		return null;
	}

	// SOLVE FOR T1 & T2
	// r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
	// ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
	// ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
	// ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
	const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
	const T1 = (s_px + s_dx * T2 - r_px) / r_dx;

	// Must be within parametic whatevers for RAY/SEGMENT
	if (T1 < 0) return null;
	if (T2 < 0 || T2 > 1) return null;

	// Return the POINT OF INTERSECTION
	return {
		x: r_px + r_dx * T1,
		y: r_py + r_dy * T1,
		param: T1
	};
}

export class BasicLightingSystem extends System {
	protected queries = useQueries(this, {
		polygons: [all(Transform, PolygonShapeData), not(Movement)],
		player: all(Transform, Movement)
	});

	protected graphics = useEntity(this, entity => {
		entity.add(Transform, { z: 1 });
		entity.add(Graphics);
	});

	update(dt: number) {
		let lines = [];
		const points = [];

		this.queries.polygons.entities.forEach(entity => {
			const polygonShapeData = entity.get(PolygonShapeData);

			lines.push(...convertToLines(polygonShapeData));
			points.push(...polygonShapeData.polygons.flat(1));
		});

		lines = lines.flat();

		const lightPosition = this.queries.player.first.get(Transform);

		const angles = [];
		points.forEach(line => {
			const angleA = Math.atan2(line.y - lightPosition.y, line.x - lightPosition.x);

			angles.push(angleA);
			angles.push(angleA - 0.00001);
			angles.push(angleA + 0.00001);
		});

		const graphics = this.graphics.get(Graphics);

		graphics.clear();
		graphics.lineStyle(2, Color.YellowGreen);

		const intersects = [];

		angles.forEach(angle => {
			const dx = Math.cos(angle) * 100;
			const dy = Math.sin(angle) * 100;

			const ray = {
				a: { x: lightPosition.x, y: lightPosition.y },
				b: { x: lightPosition.x + dx, y: lightPosition.y + dy }
			};

			let closestIntersect = null;
			for (let i = 0; i < lines.length; i++) {
				const intersect = getIntersection(ray, lines[i]);
				if (!intersect) continue;
				if (!closestIntersect || intersect.param < closestIntersect.param) {
					closestIntersect = intersect;
				}
			}

			if (closestIntersect) {
				closestIntersect.angle = angle;
				intersects.push(closestIntersect);
			}
		});

		const orderedIntersects = intersects.sort(function (a, b) {
			return a.angle - b.angle;
		});

		graphics.beginFill(0xffffff, 0.2);
		graphics.moveTo(orderedIntersects[0].x, orderedIntersects[0].y);
		orderedIntersects.forEach(i => {
			graphics.lineTo(i.x, i.y);
		});

		graphics.lineTo(orderedIntersects[0].x, orderedIntersects[0].y);
	}
}
