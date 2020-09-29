import { useQueries, useSingletonQuery } from '@ecs/core/helpers';
import { all, any } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Camera from '@ecs/plugins/render/2d/components/Camera';
import { Sprite, Text } from 'pixi.js';
import { Player } from '../components/Player';
import { BasicLightingState } from '@ecs/plugins/lighting/systems/LightingSystem';
import { NamePlate } from '../components/NamePlate';

export class PlayerMaskSystems extends System {
	protected queries = useQueries(this, {
        players: any(Player),
        namePlates: any(NamePlate),
        camera: all(Camera)
	});

    protected getBasicLightingState = useSingletonQuery(this, BasicLightingState);

    protected maskSprite: Sprite;

	update(deltaTime: number) {

        if(this.getBasicLightingState() && !this.maskSprite) {
            this.maskSprite = this.getBasicLightingState().maskInvertedSprite;
        }

		this.queries.players.forEach(entity => {
            const sprite = entity.get(Sprite);
            sprite.mask = this.maskSprite;
        });

        this.queries.namePlates.forEach(entity => {
            const sprite = entity.get(Text);
            sprite.mask = this.maskSprite;
        });
	}
}
