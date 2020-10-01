import { Tasks } from '../utils/Constants';

// Should we really have this style logic in the component :confused:
export class TaskList {
	public tasks: { task: Tasks; complete: boolean }[];

    public get completeTasks() {
        return this.tasks.filter(task => task.complete);
    }

    public get remainingTasks() {
        return this.tasks.filter(task => !task.complete);
    }

	constructor(tasks: Tasks[]) {
		this.tasks = tasks.map(task => {
			return {
				task,
				complete: false
			};
		});
    }

    public hasIncompleteTask(task: Tasks) {
        return this.tasks.find(t => !t.complete && t.task == task) != null;
    }

    public completeTask(value: Tasks) {
        for (const task of this.tasks) {
            if(task.task == value) {
                task.complete = true;
            }
        }
    }
}
