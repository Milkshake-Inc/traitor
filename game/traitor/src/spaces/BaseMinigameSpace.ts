import Space from "@ecs/plugins/space/Space";
import { Tasks } from "../utils/Constants";

export default abstract class BaseMinigameSpace extends Space {

    protected taskToComplete: Tasks;

    public set task(task: Tasks) {
        this.taskToComplete = task;
    }
}