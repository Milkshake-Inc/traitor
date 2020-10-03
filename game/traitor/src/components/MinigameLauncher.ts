import BaseMinigameSpace from "../spaces/BaseMinigameSpace";
import { Tasks } from "../utils/Constants";

export class MinigameLauncher {
    constructor(
        public minigame: BaseMinigameSpace,
        public task: Tasks,
        public distance: number = 120
    ) { }
} 