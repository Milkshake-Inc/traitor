import { useQueries, useState, useSimpleEvents } from "@ecs/core/helpers";
import { all } from "@ecs/core/Query";
import { System } from "@ecs/core/System";
import Input from "@ecs/plugins/input/components/Input";
import { Controls, Key } from "@ecs/plugins/input/Control";
import Keyboard from "@ecs/plugins/input/Keyboard";
import Transform from "@ecs/plugins/math/Transform";
import ArcadePhysics from "@ecs/plugins/physics/arcade/components/ArcadePhysics";
import { Interactable } from "@ecs/plugins/render/2d/components/Interactable";
import { Sprite } from "pixi.js";
import { LAUNCH_MINIGAME_EVENT } from "../Client";

export class InteractableSystem extends System {

    protected inputs = useState(
		this,
		new Input({
			interact: Controls.or(Keyboard.key(Key.Space), Keyboard.key(Key.E))
		})
	);

    protected queries = useQueries(this, {
        player: all(Transform, Sprite, ArcadePhysics),
        interactables: all(Interactable)
    });

    protected events = useSimpleEvents();

    update(dt: number) {
        const playerTransform = this.queries.player.first.get(Transform);

        // This could be sped up with a quad tree like system. Find which quad the player is in and if any interactables are also in the quad.
        // Saying which "room" the player is in as each quad, would also allow a map like system like in Among Us and it could stop players interacting through walls.
        for (const interactable of this.queries.interactables) {
            const sprite = interactable.get(Sprite);
            if (playerTransform.position.distance(interactable.get(Transform).position) < 60) {
                sprite.tint = 0x00FF00;
                if(this.inputs.state.interact.once) {
                    sprite.tint = 0xFF0000;
                    this.events.emit(LAUNCH_MINIGAME_EVENT)
                }
            } else {
                sprite.tint = 0xFFFFFF;
            }
        }
    }
}