/* eslint-disable @typescript-eslint/camelcase */
import { useQueries, useSingletonQuery } from '@ecs/core/helpers';
import { useEntity } from '@ecs/core/helpers/useEntity';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import Camera from '@ecs/plugins/render/2d/components/Camera';
import PixiRenderState from '@ecs/plugins/render/2d/components/RenderState';
// import { Movement } from './PlayerMovementSystem';
import Gsap from 'gsap';
import { BaseRenderTexture, Container, DRAW_MODES, Geometry, Graphics, Mesh, MeshMaterial, Program, Rectangle, RenderTexture, Sprite, Texture } from 'pixi.js';
import { Light } from '../components/Light';
import { PolygonShapeData } from '../components/PolygonData';
import { ShadowCaster } from '../components/ShadowCaster';
import { convertToLines } from '../utils/PolygonUtils';
import LIGHTING_SHADER_FRAG from "./lighting.frag";
import LIGHTING_SHADER_VERT from "./lighting.vert";

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
	private lightMesh: Mesh;
	private renderTexture: RenderTexture;
	private clearColor: Graphics;
	private fullscreenCameraSprite: Sprite;
	private debugSprite: Sprite;

	protected queries = useQueries(this, {
		lights: all(Transform, Light),
		polygons: [all(Transform, PolygonShapeData, ShadowCaster)],
		camera: all(Camera)
	});

	protected graphics = useEntity(this, entity => {
		entity.add(Transform, { z: 1 });
		entity.add(Container, { interactive: false, interactiveChildren: false });
	});

	protected getRenderer = useSingletonQuery(this, PixiRenderState);

	constructor() {
		super();

		const material = new MeshMaterial(Texture.WHITE, {
			program: Program.from(LIGHTING_SHADER_VERT, LIGHTING_SHADER_FRAG),
			uniforms: {
				lightSize: 0.2
			}
		});
		material.uniforms

		const geometry = new Geometry().addAttribute('aVertexPosition', []);
		this.lightMesh = new Mesh(geometry, material, undefined, DRAW_MODES.TRIANGLE_FAN);
		this.lightMesh.filterArea = new Rectangle(0, 0, 1280, 720)
		this.lightMesh.filters = [new PIXI.filters.BlurFilter(4)];

		this.renderTexture = new RenderTexture(new BaseRenderTexture({ width: 1280, height: 720 }));

		this.clearColor = new Graphics();
		this.clearColor.beginFill(0xff0000);
		this.clearColor.drawRect(0, 0, 1280, 720);

		this.fullscreenCameraSprite = new Sprite(PIXI.Texture.WHITE);
		this.fullscreenCameraSprite.width = 1280;
		this.fullscreenCameraSprite.height = 720;
		this.fullscreenCameraSprite.anchor.set(0.5);
		this.fullscreenCameraSprite.mask = Sprite.from(this.renderTexture);
		this.fullscreenCameraSprite.alpha = 0.6;
		this.fullscreenCameraSprite.tint = 0x000000;
		this.graphics.get(Container).addChild(this.fullscreenCameraSprite);

		this.debugSprite = Sprite.from(this.renderTexture);
		this.debugSprite.scale.set(0.2, 0.2);
		this.graphics.get(Container).addChild(this.debugSprite);
		// debugSprite.position.x -= 100;
		// debugSprite.position.set(-(1280 / 2) + 100, -(720 / 2) + 100)
		// this.fullscreenCameraSprite.addChild(debugSprite)

		Gsap.fromTo(this.lightMesh.material.uniforms, 2,  {
			lightSize: 1,

		}, {
			lightSize: 0.05,
			delay: 3,
			yoyo: true,
			repeat: 1
		})
	}

	update(dt: number) {
		let lines = [];
		const points = [];

		const camera = this.queries.camera.first.get(Transform);

		const polygonShapeData = this.queries.polygons.entities.map(entity => entity.get(PolygonShapeData));

		const cameraPolygon = new PolygonShapeData();
		cameraPolygon.polygons = [];
		cameraPolygon.polygons.push([
			{ x: camera.x - 1280 / 2, y: camera.y - 720 / 2 },
			{ x: camera.x + 1280 / 2, y: camera.y - 720 / 2 },
			{ x: camera.x + 1280 / 2, y: camera.y + 720 / 2 },
			{ x: camera.x - 1280 / 2, y: camera.y + 720 / 2 }
		]);

		polygonShapeData.push(cameraPolygon);

		polygonShapeData.forEach(polygonShapeData => {
			lines.push(...convertToLines(polygonShapeData));
			points.push(...polygonShapeData.polygons.flat(1));
		});

		lines = lines.flat();

		const lightPosition = this.queries.lights.first.get(Transform);

		const angles: Set<number> = new Set();
		points.forEach(line => {
			const angleA = Math.atan2(line.y - lightPosition.y, line.x - lightPosition.x);

			angles.add(angleA);
			angles.add(angleA - 0.00001);
			angles.add(angleA + 0.00001);
		});

		const intersects = [];

		angles.forEach(angle => {
			const dx = Math.cos(angle) * 1000;
			const dy = Math.sin(angle) * 1000;

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

		const verts: number[] = [];
		verts.push(lightPosition.position.x, lightPosition.position.y);

		orderedIntersects.forEach(i => {
			verts.push(i.x);
			verts.push(i.y);
		});

		verts.push(orderedIntersects[0].x, orderedIntersects[0].y);

		this.lightMesh.geometry.getBuffer('aVertexPosition').update(new Float32Array(verts));
		this.lightMesh.position.set(-camera.position.x + 1280 / 2, -camera.position.y + 720 / 2);

		// LIGHTING_SHADER.uniforms.position.x = lightPosition.position.x;
		// LIGHTING_SHADER.uniforms.position.y = lightPosition.position.y;
		// LIGHTING_SHADER.uniforms.lightSize.value = 0.2;
		// debugger;
		// this.lightMesh.material.uniforms.lightSize = 0.05;


		// console.log(this.lightMesh.shader.uniforms.lightSize = 0.2)



		this.getRenderer().application.renderer.render(this.clearColor, this.renderTexture);
		this.getRenderer().application.renderer.render(this.lightMesh, this.renderTexture, false);

		this.fullscreenCameraSprite.position.set(camera.position.x, camera.position.y);
		this.debugSprite.position.set(camera.position.x - (1280 / 2), camera.position.y - (720 / 2));
	}
}
