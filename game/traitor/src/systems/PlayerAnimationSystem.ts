import { useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { Sprite, Texture } from 'pixi.js';
import ArcadePhysics from '@ecs/plugins/physics/arcade/components/ArcadePhysics';

export class AnimatedPlayer {
    elapsedTime = 0;
    currentFrame = 0;
    currentAnimation = PlayerAnimations.IDLE;
}

export enum PlayerAnimations {
    IDLE = "idle",
    RUN = "run",
}

export const AnimationsData = {
    [ PlayerAnimations.IDLE ]: 25,
    [ PlayerAnimations.RUN ]: 13,
}

export class PlayerAnimationSystem extends System {

	protected queries = useQueries(this, {
		players: all(Transform, Sprite, AnimatedPlayer, ArcadePhysics)
	})

	update(dt: number) {

		for (const player of this.queries.players) {
            const { scale } = player.get(Transform)
            const animatedPlayer = player.get(AnimatedPlayer)
            const { velocity } = player.get(ArcadePhysics)

            animatedPlayer.elapsedTime += dt;

            const newAnimation = velocity.length() > 0 ? PlayerAnimations.RUN : PlayerAnimations.IDLE;

            if(velocity.x > 0) {
                scale.x = 1;
            }

            if(velocity.x < 0) {
                scale.x = -1;
            }

            if(animatedPlayer.currentAnimation != newAnimation) {
                animatedPlayer.currentFrame = 0;
                animatedPlayer.currentAnimation = newAnimation;
            }

            if(animatedPlayer.elapsedTime >= 1000 / 15) {
                animatedPlayer.elapsedTime = 0;

                animatedPlayer.currentFrame++;

                if(animatedPlayer.currentFrame > AnimationsData[animatedPlayer.currentAnimation]) {
                    animatedPlayer.currentFrame = 0;
                }

                const imageUrl = `${animatedPlayer.currentAnimation}-${animatedPlayer.currentFrame + 1}.png`;

                player.get(Sprite).texture = Texture.from(imageUrl);
            }

		}
	}
}