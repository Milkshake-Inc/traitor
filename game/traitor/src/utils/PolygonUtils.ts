import { PolygonFile } from './PolygonFile';
import { PolygonShapeData } from '../components/PolygonData';

export const convertToPolygonShape = (polygonFile: PolygonFile): PolygonShapeData => {
    const polygonShapes = new PolygonShapeData();

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


export const convertToLines = (shapeData: PolygonShapeData) => {
	const lines = [];

	shapeData.polygons.forEach(polygon => {
		for (let index = 0; index < polygon.length; index++) {

			const last = (index + 1) % (polygon.length);

			lines.push({
				a: polygon[index],
				b: polygon[last],
			})
		}
	})

	return lines;
}