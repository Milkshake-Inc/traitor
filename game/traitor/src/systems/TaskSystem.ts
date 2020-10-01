import { useQueries, useSimpleEvents } from "@ecs/core/helpers";
import { all } from "@ecs/core/Query";
import { System } from "@ecs/core/System";
import { Player } from "../components/Player";
import { CrewRole } from "../components/roles/CrewRole";
import { Events, Tasks } from "../utils/Constants";
import { TaskList } from "../components/TaskList";

export class TaskSystem extends System {

    protected queries = useQueries(this, {
        crewPlayers: all(Player, CrewRole),
        tasks: all(TaskList),
    });

    protected events = useSimpleEvents();

    constructor() {
        super();

        this.events.addListener(Events.ASSIGN_ROLE_AND_TASK_EVENT, () => this.assignTasks());
    }

    private assignTasks() {
        this.queries.crewPlayers.forEach((entity) => {
            entity.add(new TaskList([
                Tasks.FEED_POLY
            ]));
        })
    }

    public update(dt: number) {
        super.update(dt);

        // let completeTasks = 0;
        // let totalTasks = 0;

        // this.queries.tasks.forEach(entity => {
        //     const taskList = entity.get(TaskList)

        //     completeTasks += taskList.completeTasks.length;
        //     totalTasks += taskList.tasks.length;
        // });

        // console.log(`${completeTasks}/${totalTasks}`);
    }
}