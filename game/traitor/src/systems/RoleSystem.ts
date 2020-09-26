import { useQueries, useSimpleEvents, useState } from "@ecs/core/helpers";
import { all, not } from "@ecs/core/Query";
import { System } from "@ecs/core/System";
import Transform from "@ecs/plugins/math/Transform";
import { Sprite } from "pixi.js";
import { CrewRole } from "../components/roles/CrewRole";
import { JesterRole } from "../components/roles/JesterRole";
import { TraitorRole } from "../components/roles/TraitorRole";
import { shuffleArray } from "../utils/ShuffleArray";
import { AnimatedPlayer } from "./PlayerAnimationSystem";

type RoleConfiguration = {
    numberTraitors: number;
    numberJesters: number;
}

const DEFAULT_ROLE_CONFIGURATION: RoleConfiguration = {
    numberTraitors: 1,
    numberJesters: 1,
}

export class RoleState {
    readonly configuration: RoleConfiguration;
    
	constructor(configuration: RoleConfiguration) {
        this.configuration = configuration;
	}
}

export class RoleSystem extends System {
    public static ASSIGN_ROLE_EVENT = "ASSIGN_ROLE_EVENT"; 

    protected state: RoleState;
    
    protected queries = useQueries(this, {
        playersWithoutRole: all(Transform, Sprite, AnimatedPlayer)
    })

    constructor(customConfiguration?: Partial<RoleConfiguration>) {

        super();

        const configuration = {
			...DEFAULT_ROLE_CONFIGURATION,
			...customConfiguration
        };
        
        this.state = useState(this, new RoleState(configuration));

        const events = useSimpleEvents();
        events.addListener(RoleSystem.ASSIGN_ROLE_EVENT, this.assignRoles.bind(this));
    }

    private assignRoles() {

        const allPlayers = shuffleArray([...this.queries.playersWithoutRole.entities]);
        const numberOfTraitors = this.state.configuration.numberTraitors;
        const numberOfJesters = this.state.configuration.numberJesters;

        for (let i = 0; i < allPlayers.length; i++) {
            const player = allPlayers[i];

            // Traitors
            if (i < numberOfTraitors) {
                player.addComponent(TraitorRole);
                continue;
            }

            // Jesters
            if (i < numberOfTraitors + numberOfJesters) {
                player.addComponent(JesterRole);
                continue;
            }

            // Crew
            if (i >= numberOfTraitors + numberOfJesters) {
                player.addComponent(CrewRole);
            }
        }
    }
}