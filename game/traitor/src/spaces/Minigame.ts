import Space from "@ecs/plugins/space/Space";
import { Tasks } from "../utils/Constants";

export default class Minigame extends Space {

    protected taskToComplete: Tasks;

    public set task(task: Tasks) {
        this.taskToComplete = task;
    }
}