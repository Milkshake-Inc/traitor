import { h } from 'preact';
import { useQueries } from "@ecs/core/helpers";
import { all } from "@ecs/core/Query";
import { useECS } from "@ecs/plugins/ui/react";
import { LocalPlayer } from "../components/LocalPlayer";
import { TaskList } from "../components/TaskList";

import { Flex, H3, H4 } from "./Shared";

export const TaskView = () => {
    const { queries } = useECS(engine => ({
        queries: useQueries(engine, {
            localPlayerTasks: all(LocalPlayer, TaskList),
            allTasks: all(TaskList)
        })
    }));

    if (!queries.localPlayerTasks.first) {
        return <Flex padding={10} width='100%' height='100%'>
            <H3>No Tasks</H3>
        </Flex>
    }

    const { tasks: playerTasks } = queries.localPlayerTasks.first.get(TaskList);
    const playerCompleted = playerTasks.filter(task => task.complete);
    const playerRemaing = playerTasks.filter(task => !task.complete);

    const tasks = queries.allTasks.getAll(TaskList).map(taskList => taskList.tasks).flat();
    const completedTasks = tasks.filter(task => task.complete);

    return (
        <Flex padding={10} width='100%' height='100%'>
            <H3>Your Tasks: {playerCompleted.length}/{playerTasks.length} Total: {completedTasks.length}/{tasks.length}</H3>
            {
                playerTasks.map((task) => {
                    return <H4 color={task.complete ? '#00ff00' : '#ff0000'} > - {task.task}</H4>
                })
            }
        </Flex>
    );
};