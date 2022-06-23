export const MAPPING = {
    ArrowLeft: 'left',
    ArrowUp: 'up',
    ArrowRight: 'right',
    KeyA: 'left',
    KeyW: 'up',
    KeyD: 'right',
    KeyI: 'saveState',
    KeyO: 'loadState',
    KeyP: 'reset',
    KeyK: 'pause',
    KeyL: 'nextFrame',
};
export default class InputSystem {
    constructor(document) {
        this.pressed = {
            left: false,
            up: false,
            right: false,
        };
        document.addEventListener('keydown', this.pressKey.bind(this));
        document.addEventListener('keyup', this.releaseKey.bind(this));
    }
    update(entities, _dt) {
        entities
            .filter((e) => e.isControlledByClient)
            .forEach((e) => {
            Object.assign(e.inputComp, this.pressed);
        });
    }
    pressKey(evt) {
        if (evt.ctrlKey || evt.metaKey) {
            return;
        }
        const action = MAPPING[evt.code];
        if (!action) {
            return;
        }
        evt.preventDefault();
        if (this.pressed[action] !== undefined) {
            this.pressed[action] = true;
        }
    }
    releaseKey(evt) {
        if (evt.ctrlKey || evt.metaKey) {
            return;
        }
        const action = MAPPING[evt.code];
        if (!action) {
            return;
        }
        evt.preventDefault();
        if (this.pressed[action] !== undefined) {
            this.pressed[action] = false;
        }
    }
}
//# sourceMappingURL=input.system.js.map