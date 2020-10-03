import { useQueries, useSimpleEvents, useState } from "@ecs/core/helpers";
import { all } from "@ecs/core/Query";
import { System } from "@ecs/core/System";
import Input from "@ecs/plugins/input/components/Input";
import { Controls, Key } from "@ecs/plugins/input/Control";
import Keyboard from "@ecs/plugins/input/Keyboard";
import Transform from "@ecs/plugins/math/Transform";
import { LocalPlayer } from "../components/LocalPlayer";
import { MinigameLauncher } from "../components/MinigameLauncher";
import { Events } from "../utils/Constants";
import { TaskList } from "../components/TaskList";

export class MinigameLauncherSystem extends System {

    protected inputs = useState(
        this,
        new Input({
            interact: Controls.or(Keyboard.key(Key.Space), Keyboard.key(Key.E))
        })
    );

    protected queries = useQueries(this, {
        player: all(Transform, LocalPlayer),
        launchers: all(MinigameLauncher)
    });

    protected events = useSimpleEvents();

    update(dt: number) {
        const player = this.queries.player.first;

        if (!player || !player.has(TaskList)) return;

        const { position } = player.get(Transform);
        const { tasks } = player.get(TaskList);

        // This could be sped up with a quad tree like system. Find which quad the player is in and if any launchers are also in the quad.
        // Saying which "room" the player is in as each quad, would also allow a map like system like in Among Us and it could stop players interacting through walls.
        for (const launcher of this.queries.launchers) {
            const transform = launcher.get(Transform)
            const { minigame, task, distance } = launcher.get(MinigameLauncher);

            const hasTask = tasks.find((taskList) => taskList.task == task);

            if (hasTask && position.distance(transform) < distance) {

                if (this.inputs.state.interact.once) {
                    this.events.emit(Events.LAUNCH_MINIGAME_EVENT, minigame, task);
                }
            }
        }
    }
}