import { useQueries } from "@ecs/core/helpers";
import { all, not } from "@ecs/core/Query";
import { System } from "@ecs/core/System";
import { Player } from "../components/Player";
import { Engine } from "@ecs/core/Engine";
import { Entity } from "@ecs/core/Entity";
import Text from "@ecs/plugins/render/2d/components/Text";
import Transform from "@ecs/plugins/math/Transform";
import { getRoleFromEntity, getRoleText, getRoleTextColor } from "./RoleSystem";
import Color from "@ecs/plugins/math/Color";
import { CrewRole } from "../components/roles/CrewRole";

export class NamePlate {
    public text = ""
}



export class PlayerNamePlateSystems extends System {
    protected queries = useQueries(this, {
        playersWithoutNamePlayer: [ all(Player), not(NamePlate) ],
        playersWithNamePlayer: [ all(Player, NamePlate) ]
    })

    protected engine: Engine;

    protected namePlates: Map<Entity, Entity> = new Map();

    constructor() {
        super();

        this.signalOnAddedToEngine.connect((engine) => {
            this.engine = engine;
        });
    }

    update(deltaTime: number) {
        this.queries.playersWithoutNamePlayer.forEach(entity => {
            entity.add(NamePlate);

            const namePlateEntity = new Entity();
            namePlateEntity.add(Transform, {
                x: 400,
                y: 400
            });
            namePlateEntity.add(Text, {
                value: "apple"
            });

            this.engine.addEntity(namePlateEntity);

            this.namePlates.set(entity, namePlateEntity);
        });

        this.queries.playersWithNamePlayer.forEach(entity => {
            const { name } = entity.get(Player)

            const namePlate = this.namePlates.get(entity);
            const namePlateTransfrom = namePlate.get(Transform);
            const namePlateText = namePlate.get(Text);


            namePlateTransfrom.position.x = entity.get(Transform).position.x;
            namePlateTransfrom.position.y = entity.get(Transform).position.y + 40;

            const role = getRoleFromEntity(entity)
            const roleName = getRoleText(role);
            const roleColor = getRoleTextColor(role);


            namePlateText.value = roleName ? `[${roleName}] ${name}` : name;
            namePlateText.tint = roleColor;

            // console.log(namePlateText.tint);
        });
    }
}