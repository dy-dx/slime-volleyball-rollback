export default class DebugRenderSystem {
    constructor(game, elem) {
        this.game = game;
        if (!elem) {
            throw new Error();
        }
        this.gameElement = elem;
        const infoBoxAppearanceComp = {
            width: 180,
            height: 60,
            zIndex: 10000,
        };
        this.infoBox = {
            appearanceComp: infoBoxAppearanceComp,
            positionComp: {
                x: this.game.width / 2 - infoBoxAppearanceComp.width / 2,
                y: this.game.height - infoBoxAppearanceComp.height,
            },
            element: document.createElement('div'),
            className: 'ui-debug',
        };
        [this.infoBox].forEach((e) => this.setupElement(e));
    }
    update(_entities, _dt) {
        const networkInfo = this.game.networkSystem.debugInfo();
        const networkText = !networkInfo.isConnectionReady
            ? 'Waiting for connection'
            : `ping: ${Math.ceil(networkInfo.roundtripLatency / 2)}ms`;
        this.infoBox.element.textContent = [
            networkText,
            `rollback: ${networkInfo.rollbackTicks} | ${networkInfo.rollbackMs.toFixed(1)}ms`,
            `update: ${this.game.approximateAvgUpdateMs.toFixed(1)}ms`,
            `render: ${this.game.approximateAvgRenderMs.toFixed(1)}ms`,
        ].join('\n');
    }
    setupElement(e) {
        e.element.className = `entity ${e.className}`;
        this.setStyles(e.element, e.appearanceComp, e.positionComp);
        this.gameElement.appendChild(e.element);
    }
    setStyles(elem, appearanceComp, positionComp) {
        elem.style.transform = `translate3d(${positionComp.x}px,${-positionComp.y}px,0px)`;
        elem.style.width = `${appearanceComp.width}px`;
        elem.style.height = `${appearanceComp.height}px`;
        elem.style.zIndex = `${appearanceComp.zIndex}`;
    }
}
//# sourceMappingURL=debug-render.system.js.map