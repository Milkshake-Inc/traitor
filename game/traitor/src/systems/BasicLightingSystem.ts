/* eslint-disable @typescript-eslint/camelcase */
import { useQueries, useSingletonQuery } from '@ecs/core/helpers';
import { useEntity } from '@ecs/core/helpers/useEntity';
import { all, not } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Color from '@ecs/plugins/math/Color';
import Transform from '@ecs/plugins/math/Transform';
import Camera from '@ecs/plugins/render/2d/components/Camera';
import PixiRenderState from '@ecs/plugins/render/2d/components/RenderState';
import { Graphics, Geometry, SimpleMesh, Container, Mesh, DRAW_MODES, Sprite, RenderTexture, BaseRenderTexture, Renderer } from 'pixi.js';
import { render } from 'preact';
import { Assets } from '../Client';
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
	private mesh: Mesh;
	private renderTexture: RenderTexture;
	private clearColor: Graphics;
	private fullscreenCameraSprite: Sprite;

	protected queries = useQueries(this, {
		polygons: [all(Transform, PolygonShapeData), not(Movement)],
		player: all(Transform, Movement),
		camera: all(Camera)
	});

	protected graphics = useEntity(this, entity => {
		entity.add(Transform, { z: 1 });
		entity.add(Container, {interactive: false, interactiveChildren: false});
	});

	protected getRenderer = useSingletonQuery(this, PixiRenderState);

	constructor() {
		super();

		const geometry = new Geometry().addAttribute('aVertexPosition', []);
		this.mesh = new Mesh(geometry, PIXI.Shader.from(`

		precision mediump float;

		attribute vec2 aVertexPosition;

		uniform mat3 translationMatrix;
		uniform mat3 projectionMatrix;
	
		void main() {
			gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
		}`,
	
	`precision mediump float;
	
		void main() {
			gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		}
	
	`), undefined, DRAW_MODES.TRIANGLE_FAN);
		
		this.renderTexture = new RenderTexture(new BaseRenderTexture({width: 1280, height: 720}));
		
		this.clearColor = new Graphics();
		this.clearColor.beginFill(0xFF0000);
		this.clearColor.drawRect(0, 0, 1280, 720);
		
		this.fullscreenCameraSprite = new Sprite(PIXI.Texture.WHITE);
		this.fullscreenCameraSprite.width = 1280;
		this.fullscreenCameraSprite.height = 720;
		this.fullscreenCameraSprite.anchor.set(0.5);
		this.fullscreenCameraSprite.mask = Sprite.from(this.renderTexture);
		this.fullscreenCameraSprite.mask.filters = [new PIXI.filters.BlurFilter(50)]
		this.fullscreenCameraSprite.alpha = 0.5
		this.fullscreenCameraSprite.tint = 0x000000;
		this.graphics.get(Container).addChild(this.fullscreenCameraSprite);
	}

	update(dt: number) {

		let lines = [];
		const points = [];

		this.queries.polygons.entities.forEach(entity => {
			const polygonShapeData = entity.get(PolygonShapeData);

			lines.push(...convertToLines(polygonShapeData));
			points.push(...polygonShapeData.polygons.flat(1));
		});

		lines = lines.flat();

		const playerTransform = this.queries.player.first.get(Transform);

		const angles: Set<number> = new Set();
		points.forEach(line => {
			const angleA = Math.atan2(line.y - playerTransform.y, line.x - playerTransform.x);

			angles.add(angleA);
			angles.add(angleA - 0.00001);
			angles.add(angleA + 0.00001);
		});

		const intersects = [];

		angles.forEach(angle => {
			const dx = Math.cos(angle) * 100;
			const dy = Math.sin(angle) * 100;

			const ray = {
				a: { x: playerTransform.x, y: playerTransform.y },
				b: { x: playerTransform.x + dx, y: playerTransform.y + dy }
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

		const verts: number[] = []
		verts.push(playerTransform.position.x, playerTransform.position.y);

        orderedIntersects.forEach(i => {
            verts.push(i.x);
            verts.push(i.y);
        });

		verts.push(orderedIntersects[0].x, orderedIntersects[0].y);

		const camera = this.queries.camera.first.get(Transform);
		this.mesh.geometry.getBuffer('aVertexPosition').update(new Float32Array(verts))
		this.mesh.position.set(-camera.position.x + (1280 / 2), -camera.position.y + (720 / 2));

		this.getRenderer().application.renderer.render(this.clearColor, this.renderTexture);
		this.getRenderer().application.renderer.render(this.mesh, this.renderTexture, false);

		this.fullscreenCameraSprite.position.set(camera.position.x, camera.position.y);
	}
}
