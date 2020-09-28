import { Engine } from '@ecs/core/Engine';
import { Entity } from '@ecs/core/Entity';
import { useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { Point, Text } from 'pixi.js';
import { NamePlate } from '../components/NamePlate';
import { Player } from '../components/Player';
import { getRoleFromEntity, getRoleText, getRoleTextColor } from './RoleSystem';

export class PlayerNamePlateSystems extends System {
	protected queries = useQueries(this, {
		players: all(Player),
	});

	protected engine: Engine;

	protected namePlates: Map<Entity, Entity> = new Map();

	constructor() {
		super();

		this.signalOnAddedToEngine.connect(engine => {
			this.engine = engine;
		});
	}

	update(deltaTime: number) {
		this.queries.players.forEach(entity => {
			if(!this.namePlates.has(entity)) {
				// entity.add(NamePlate);

				const namePlateEntity = new Entity();
				namePlateEntity.add(Transform, {
					x: 400,
					y: 400
				});
				namePlateEntity.add(Text, {
					style: {
						fontSize: 16,
						align: 'center'
					},
					resolution: devicePixelRatio,
					anchor: new Point(0.5),
				});
				namePlateEntity.add(NamePlate);

				this.engine.addEntity(namePlateEntity);

				this.namePlates.set(entity, namePlateEntity);
			}

			const { name } = entity.get(Player);

			const namePlate = this.namePlates.get(entity);
			const namePlateTransfrom = namePlate.get(Transform);
			const namePlateText = namePlate.get(Text);

			namePlateTransfrom.position.x = entity.get(Transform).position.x;
			namePlateTransfrom.position.y = entity.get(Transform).position.y + 20;

			const role = getRoleFromEntity(entity);
			const roleName = getRoleText(role);
			const roleColor = getRoleTextColor(role);

			namePlateText.text = roleName ? `${name}\n[${roleName}]` : name;
			namePlateText.style.fill = roleColor;
		});
	}
}
