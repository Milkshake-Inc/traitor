import { Entity } from "@ecs/core/Entity";
import { useQueries, useSimpleEvents, useState } from "@ecs/core/helpers";
import { all, not } from "@ecs/core/Query";
import { System } from "@ecs/core/System";
import Color from "@ecs/plugins/math/Color";
import { Player } from "../components/Player";
import { CrewRole } from "../components/roles/CrewRole";
import { JesterRole } from "../components/roles/JesterRole";
import { TraitorRole } from "../components/roles/TraitorRole";
import Random from "@ecs/plugins/math/Random";
import { Events } from "../utils/Constants";

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

export const getRoleFromEntity = (entity: Entity): CrewRole | TraitorRole | JesterRole | null => {
    if (entity.has(CrewRole)) return entity.get(CrewRole);
    if (entity.has(TraitorRole)) return entity.get(TraitorRole);
    if (entity.has(JesterRole)) return entity.get(JesterRole);

    return null;
}

export const getRoleText = (entity: CrewRole | TraitorRole | JesterRole | null) => {
    if (entity instanceof CrewRole) return "Crew";
    if (entity instanceof TraitorRole) return "Traitor";
    if (entity instanceof JesterRole) return "Jester";

    return "";
}

export const getRoleTextColor = (entity: CrewRole | TraitorRole | JesterRole | null) => {
    if (entity instanceof TraitorRole) return 0xEA4335;
    if (entity instanceof JesterRole) return 0x3BABFD;

    return Color.White;
}

export class RoleSystem extends System {

    protected state: RoleState;

    protected queries = useQueries(this, {
        playersWithoutRole: [all(Player), not(TraitorRole, JesterRole, CrewRole)]
    })

    constructor(customConfiguration?: Partial<RoleConfiguration>) {

        super();

        const configuration = {
            ...DEFAULT_ROLE_CONFIGURATION,
            ...customConfiguration
        };

        this.state = useState(this, new RoleState(configuration));

        const events = useSimpleEvents();
        events.addListener(Events.ASSIGN_ROLE_EVENT, this.assignRoles.bind(this));
    }

    private assignRoles() {

        const allPlayers = Random.shuffleArray([...this.queries.playersWithoutRole.entities]);
        const numberOfTraitors = this.state.configuration.numberTraitors;
        const numberOfJesters = this.state.configuration.numberJesters;

        for (let i = 0; i < allPlayers.length; i++) {
            const player = allPlayers[i];

            // Traitors
            if (i < numberOfTraitors) {
                player.add(TraitorRole);
                continue;
            }

            // Jesters
            if (i < numberOfTraitors + numberOfJesters) {
                player.add(JesterRole);
                continue;
            }

            // Crew
            if (i >= numberOfTraitors + numberOfJesters) {
                player.add(CrewRole);
            }
        }
    }
}