import { useQueries, useSimpleEvents, useState } from "@ecs/core/helpers";
import { all, QueryPattern } from "@ecs/core/Query";
import { System } from "@ecs/core/System";
import { Player } from "../components/Player";
import { CrewRole } from "../components/roles/CrewRole";
import { Events, Tasks } from "../utils/Constants";
import { TaskList } from "../components/TaskList";
import { Entity } from "@ecs/core/Entity";
import Random from "@ecs/plugins/math/Random";

type TaskConfiguration = {
    longTasks: number;
    shortTasks: number;
}

const DEFAULT_TASK_CONFIGURATION: TaskConfiguration = {
    longTasks: 1,
    shortTasks: 2,
}

export class TaskState {
    readonly configuration: TaskConfiguration;

	constructor(configuration: TaskConfiguration) {
        this.configuration = configuration;
	}
}

export class TaskSystem extends System {

    protected state: TaskState;
    protected playerTasksMap: Map<Entity, TaskList>

    protected queries = useQueries(this, {
        crewPlayers: all(Player, CrewRole),
        tasks: all(TaskList),
    });

    protected events = useSimpleEvents();

    constructor(customConfiguration?: Partial<TaskConfiguration>) {
        super();

        const configuration = {
			...DEFAULT_TASK_CONFIGURATION,
			...customConfiguration
        };

        this.state = useState(this, new TaskState(configuration));

        this.playerTasksMap = new Map();

        this.events.addListener(Events.ASSIGN_TASK_EVENT, () => this.assignTasks());
        this.events.addListener(Events.TASK_COMPLETED_EVENT, (player: Entity, task: Tasks) => this.taskCompleted(player, task));
    }

    // TODO: This needs to randomly assign tasks to all players according to the config
    //       Also keep a track of all tasks
    private assignTasks() {
        this.queries.crewPlayers.forEach((entity) => {

            const randomTask = Random.fromArray(Object.values(Tasks));

            const taskList = new TaskList([
                randomTask
            ]);
            this.playerTasksMap.set(entity, taskList);

            entity.add(taskList);
        });
    }

    // TODO: Update completed tasks
    private taskCompleted(player: Entity, task: Tasks) {
        const { tasks } = this.playerTasksMap.get(player);
        
        for (let i = tasks.length - 1; i >= 0; i--) {
            if (task === tasks[i]) {
                tasks.splice(i, 1);
                break;
            }
        }
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