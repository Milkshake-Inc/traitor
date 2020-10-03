import { Component, h } from 'preact';
import { Engine } from '@ecs/core/Engine';
import { EngineContext } from '@ecs/plugins/ui/react';
import { View, ViewController } from '@ecs/plugins/ui/react/View';
import { TaskView } from './TasksView';
import { Hud } from './Hud';

export default class App extends Component<{ engine: Engine }, { visible: true }> {
    render() {
        return (
            <EngineContext.Provider value={this.props.engine}>
                <ViewController>
                    <Hud >
                        <View name='tasks' open={true} >
                            <TaskView />
                        </View>
                    </Hud>
                </ViewController>
            </EngineContext.Provider>
        );
    }
}