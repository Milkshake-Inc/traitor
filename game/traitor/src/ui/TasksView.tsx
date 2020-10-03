import { h } from 'preact';
import { useQueries } from "@ecs/core/helpers";
import { all } from "@ecs/core/Query";
import { useECS } from "@ecs/plugins/ui/react";
import { LocalPlayer } from "../components/LocalPlayer";
import { TaskList } from "../components/TaskList";

import { Flex, FlexCenter, FullscreenNoise } from "./Shared";

export const TaskView = () => {
    const { queries } = useECS(engine => ({
        queries: useQueries(engine, {
            localPlayerTasks: all(LocalPlayer, TaskList),
            allTasks: all(TaskList)
        })
    }));

    if (!queries.localPlayerTasks.first) {
        return null;
    }

    const { tasks: playerTasks } = queries.localPlayerTasks.first.get(TaskList);
    const playerCompleted = playerTasks.filter(task => task.complete);

    return (
        <FullscreenNoise>
            <FlexCenter width='100%' height='100%' justifyContent='flex-end' >
                <p>Tasks Completed: {playerCompleted.length}/{playerTasks.length}</p>
            </FlexCenter>
        </FullscreenNoise>
    );
};