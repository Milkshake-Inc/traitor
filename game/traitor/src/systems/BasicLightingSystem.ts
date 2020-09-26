/* eslint-disable @typescript-eslint/camelcase */
import { useQueries, useSingletonQuery, useState } from '@ecs/core/helpers';
import { useEntity } from '@ecs/core/helpers/useEntity';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import Camera from '@ecs/plugins/render/2d/components/Camera';
import PixiRenderState from '@ecs/plugins/render/2d/components/RenderState';
// import { Movement } from './PlayerMovementSystem';
import Gsap from 'gsap';
import {
	BaseRenderTexture,
	Container,
	DRAW_MODES,
	Geometry,
	Graphics,
	Mesh,
	MeshMaterial,
	Program,
	Rectangle,
	RenderTexture,
	Sprite,
	Texture,
	utils,
	BLEND_MODES
} from 'pixi.js';
import { Light } from '../components/Light';
import { PolygonShapeData } from '../components/PolygonData';
import { ShadowCaster } from '../components/ShadowCaster';
import { convertToLines, Line } from '../utils/PolygonUtils';
import LIGHTING_SHADER_FRAG from './lighting.frag';
import LIGHTING_SHADER_VERT from './lighting.vert';
import { Vector2 } from '@ecs/plugins/math/Vector';
import { SimpleGeometry } from '@ecs/plugins/render/2d/helpers/SimpleGeometry';
import { Entity } from '@ecs/core/Entity';
import Color from '@ecs/plugins/math/Color';

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

type LightShaderUniform = {
	position: { x: number; y: number };
	size: number;
	feather: number;
	intensity: number;
	color: number[];
	maskMode: boolean;
}

const DEFAULT_UNIFORM: LightShaderUniform = {
	feather: 0,
	maskMode: false,
	size: 0,
	position: {
		x: 0,
		y: 0
	},
	color: [0, 0, 0, 1],
	intensity: 1.0
}

type BasicLightingConfiguration = {
	width: number;
	height: number;
	resolution: number;

	drawColor: boolean;
	drawMask: boolean;
	maskAlpha: number;
	maskColor: number;
}

const DEFAULT_BASIC_LIGHTING_CONFIGURATION: BasicLightingConfiguration = {
	width: 1280,
	height: 720,
	resolution: 1, // [[TODO] Doesn't work yet

	drawColor: true,
	drawMask: true,

	maskAlpha: 0.8,
	maskColor: Color.Black
}

export class BasicLightingState {
	readonly configuration: BasicLightingConfiguration;

	public maskSprite: Sprite;
	public colorSprite: Sprite;

	public maskRenderTexture: RenderTexture;
	public colorRenderTexture: RenderTexture;

	constructor(configuration: BasicLightingConfiguration) {
		this.configuration = configuration;
	}
}

const createMaskClearGraphic = (width: number, height: number) => {
	const graphics = new Graphics();
	graphics.beginFill(Color.Red); // Red is for mask
	graphics.drawRect(0, 0, width, height);
	return graphics;
}

export class BasicLightingSystem extends System {

	protected state: BasicLightingState;

	private maskClearColor: Graphics;
	private lightMesh: Mesh;
	private cachedLines: Line[];

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

	constructor(customConfiguration?: Partial<BasicLightingConfiguration>) {
		super();

		const configuration = {
			...DEFAULT_BASIC_LIGHTING_CONFIGURATION,
			...customConfiguration
		};

		this.state = useState(this, new BasicLightingState(configuration))

		const material = new MeshMaterial(Texture.WHITE, {
			program: Program.from(LIGHTING_SHADER_VERT, LIGHTING_SHADER_FRAG),
			uniforms: DEFAULT_UNIFORM
		});

		this.lightMesh = new Mesh(new SimpleGeometry(), material, undefined, DRAW_MODES.TRIANGLE_FAN);
		this.lightMesh.filterArea = new Rectangle(0, 0, configuration.width, configuration.height);

		this.state.maskRenderTexture = new RenderTexture(new BaseRenderTexture({ width: configuration.width, height: configuration.height, resolution: configuration.resolution }));
		this.state.colorRenderTexture = new RenderTexture(new BaseRenderTexture({ width: configuration.width, height: configuration.height,resolution: configuration.resolution }));

		this.maskClearColor = createMaskClearGraphic(configuration.width, configuration.height)

		this.state.maskSprite = new Sprite(PIXI.Texture.WHITE);
		this.state.maskSprite.width = configuration.width;
		this.state.maskSprite.height = configuration.height;
		this.state.maskSprite.anchor.set(0.5);
		this.state.maskSprite.mask = Sprite.from(this.state.maskRenderTexture);
		this.state.maskSprite.alpha = configuration.maskAlpha;
		this.state.maskSprite.tint = configuration.maskColor;

		this.state.colorSprite = new Sprite(this.state.colorRenderTexture);
		this.state.colorSprite.anchor.set(0.5);

		// Adds to stage
		this.graphics.get(Container).addChild(this.state.maskSprite);
		this.graphics.get(Container).addChild(this.state.colorSprite);
	}

	getCameraBounds(entity: Entity) {
		const transform = entity.get(Transform);
		const camera = entity.get(Camera);

		return {
			topLeft: { x: transform.x - (camera.width / 2), y: transform.y - (camera.height / 2) },
			topRight: { x: transform.x + (camera.width / 2), y: transform.y - (camera.height / 2) },
			bottomRight: { x: transform.x + (camera.width / 2), y: transform.y + (camera.height / 2) },
			bottomLeft: { x: transform.x - (camera.width / 2), y: transform.y + (camera.height / 2) },
		}
	}

	buildLinesArray() {
		console.log(`💡  Lighting Rebuilding.`)

		let lines: Line[] = [];
		const polygonShapeData = this.queries.polygons.entities.map(entity => entity.get(PolygonShapeData));

		const cameraPolygon = new PolygonShapeData();

		const bigNumber = 10000;

		cameraPolygon.polygons.push([
			{ x: -bigNumber, y: -bigNumber },
			{ x: bigNumber, y: -bigNumber },
			{ x: bigNumber, y: bigNumber },
			{ x: -bigNumber, y: bigNumber },
		]);

		polygonShapeData.push(cameraPolygon);

		polygonShapeData.forEach(polygonShapeData => {
			lines.push(...convertToLines(polygonShapeData));
		});

		lines = lines.flat();

		return lines;
	}

	update(dt: number) {
		if(!this.cachedLines) {
			this.cachedLines = this.buildLinesArray();
		}

		const camera = this.queries.camera.first.get(Transform);
		const renderer = this.getRenderer().application.renderer;

		renderer.render(this.maskClearColor, this.state.maskRenderTexture);

		const lightUniform: LightShaderUniform = this.lightMesh.shader.uniforms;

		let firstLight = true;

		for (const lightEntity of this.queries.lights) {
			const transform = lightEntity.get(Transform);
			const light = lightEntity.get(Light);

			(this.lightMesh.geometry as SimpleGeometry).verticies = this.buildLightVerticies(this.cachedLines, transform.position);
			this.lightMesh.position.set(-camera.position.x + 1280 / 2, -camera.position.y + 720 / 2);

			lightUniform.position.x = transform.position.x - camera.position.x + (1280 / 2);
			lightUniform.position.y = transform.position.y - camera.position.y + (720 / 2);
			lightUniform.size = light.size;
			lightUniform.feather = light.feather;
			lightUniform.intensity = light.intensity;
			utils.hex2rgb(light.color, lightUniform.color);


			lightUniform.maskMode = true;
			renderer.render(this.lightMesh, this.state.maskRenderTexture, false);

			lightUniform.maskMode = false;
			renderer.render(this.lightMesh, this.state.colorRenderTexture, firstLight);

			firstLight = false;
		}
		this.state.colorSprite.blendMode = BLEND_MODES.SCREEN; // Should be configureable

		this.state.colorSprite.position.set(camera.position.x, camera.position.y);
		this.state.maskSprite.position.set(camera.position.x, camera.position.y);
	}

	buildLightVerticies(lines: Line[], lightPosition: Vector2) {
		const raycastAngles: Set<number> = new Set();

		const addVector = (vector: Vector2) => {
			const angle = Math.atan2(vector.y - lightPosition.y, vector.x - lightPosition.x);

			raycastAngles.add(angle);
			raycastAngles.add(angle - 0.00001);
			raycastAngles.add(angle + 0.00001);
		}

		for (const line of lines) {
			addVector(line.a);
			addVector(line.b);
		}

		const raycastResults = [];

		for (const angle of raycastAngles) {
			const deltaX = Math.cos(angle) * 1000;
			const deltaY = Math.sin(angle) * 1000;

			const ray = {
				a: { x: lightPosition.x, y: lightPosition.y },
				b: { x: lightPosition.x + deltaX, y: lightPosition.y + deltaY }
			};

			let closestIntersect = null;
			for (const line of lines) {
				const intersect = getIntersection(ray, line);
				if (!intersect) continue;
				if (!closestIntersect || intersect.param < closestIntersect.param) {
					closestIntersect = intersect;
				}
			}

			if (closestIntersect) {
				closestIntersect.angle = angle;
				raycastResults.push(closestIntersect);
			}
		}

		const orderedRaycastResults = raycastResults.sort(function (a, b) {
			return a.angle - b.angle;
		});

		const meshVerticies = [
			lightPosition,
			...orderedRaycastResults,
			orderedRaycastResults[0]
		];

		return meshVerticies;
	}
}
