import { Component, h } from 'preact';

export const Hud = props => {
    const style = {
        position: 'absolute',
        color: 'white',
        fontFamily: 'Quicksand',
        fontWeight: 700,
        width: '1280px',
        height: '720px',
        margin: '0px',
        pointerEvents: 'none'
    };

    return <div style={style}>{props.children}</div>;
};