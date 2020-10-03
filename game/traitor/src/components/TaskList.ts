import { Tasks } from '../utils/Constants';

export class TaskList {
    constructor(
        public tasks: { task: Tasks, complete: boolean }[] = []
    ) { }
}
