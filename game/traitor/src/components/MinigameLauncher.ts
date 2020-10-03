import Minigame from "../spaces/Minigame";
import { Tasks } from "../utils/Constants";

export class MinigameLauncher {
    constructor(
        public minigame: Minigame,
        public task: Tasks,
        public distance: number = 120
    ) {}
}