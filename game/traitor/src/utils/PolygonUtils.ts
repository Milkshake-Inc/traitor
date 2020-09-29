import { PolygonFile } from './PolygonFile';
import { Polygons } from '@ecs/plugins/math/Polygon';

export const convertToPolygonShape = (polygonFile: PolygonFile): Polygons => {
    const polygonShapes = new Polygons();

	polygonFile.prefab.fixtures.forEach(fixture => {
		fixture.vertices.forEach(quad => {
			const polygonQuad = [];
			quad.forEach(vertices => {
				polygonQuad.push({ x: vertices.x, y: vertices.y });
			});
			polygonShapes.polygons.push(polygonQuad);
		});
    });

	return polygonShapes;
};
