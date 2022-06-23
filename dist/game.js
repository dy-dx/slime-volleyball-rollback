import Ball from './entities/ball.js';
import Character from './entities/character.js';
import Level from './entities/level.js';
import CharacterStateSystem from './systems/character-state.system.js';
import DebugRenderSystem from './systems/debug-render.system.js';
import DebugSystem from './systems/debug.system.js';
import InputSystem from './systems/input.system.js';
import NetworkSystem from './systems/network.system.js';
import PhysicsSystem from './systems/physics.system.js';
import ScoreSystem from './systems/score.system.js';
import RenderSystem from './systems/render.system.js';
import deepClone from './util/deep-clone.js';
export default class Game {
    constructor(elem, width, height) {
        this.approximateAvgRenderMs = 0;
        this.approximateAvgUpdateMs = 0;
        this.simulationTick = 0;
        this.updateTick = 0; // increases even when simulation is paused
        this.isPaused = false;
        // private entities: IEntity[] = [];
        this.entities = [];
        this.gameWidth = 1000;
        this.gameHeight = 1000;
        this.width = width;
        this.height = height;
        elem.style.width = `${width}px`;
        elem.style.height = `${height}px`;
        this.resetSimulation();
        this.networkSystem = new NetworkSystem(this);
        this.inputSystems = [
            // prettier-ignore
            new InputSystem(document),
            this.networkSystem,
            new DebugSystem(this, document),
        ];
        this.simulationSystems = [
            new CharacterStateSystem(),
            new PhysicsSystem(),
            new ScoreSystem(this),
        ];
        this.renderSystems = [
            // prettier-ignore
            new RenderSystem(this, elem),
            new DebugRenderSystem(this, elem),
        ];
    }
    getSimulationTick() {
        return this.simulationTick;
    }
    getUpdateTick() {
        return this.updateTick;
    }
    getP1() {
        // pretty dumb but it'll work for now
        return this.entities[0];
    }
    getP2() {
        // pretty dumb but it'll work for now
        return this.entities[1];
    }
    getBall() {
        // pretty dumb but it'll work for now
        return this.entities[2];
    }
    areDebugControlsAllowed() {
        return !this.networkSystem.isConnectionReady;
    }
    initRound(side) {
        const p1 = this.getP1();
        const p2 = this.getP2();
        Character.reset(p1);
        Character.reset(p2);
        const ball = this.getBall();
        Ball.reset(ball, side === 0 /* P1 */ ? p1.positionComp.x : p2.positionComp.x);
    }
    resetSimulation() {
        this.isPaused = false;
        this.simulationTick = 0;
        this.entities = [];
        const p1 = new Character(0 /* P1 */);
        p1.isControlledByClient = true;
        const p2 = new Character(1 /* P2 */);
        const ball = new Ball();
        const level = new Level(7);
        this.entities.push(p1);
        this.entities.push(p2);
        this.entities.push(ball);
        this.entities.push(level);
        // fixme, terrible hack
        this.entities.forEach((e, i) => (e.id = i));
        this.initRound(0 /* P1 */);
    }
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    update(dt) {
        const t0 = performance.now();
        this.inputSystems.forEach((s) => {
            s.update(this.entities, dt);
        });
        if (!this.isPaused && this.networkSystem.isSimulationReady) {
            this.tick(dt);
        }
        this.updateTick++;
        this.approximateAvgUpdateMs += (performance.now() - t0 - this.approximateAvgUpdateMs) / 60;
    }
    render(dt) {
        const t0 = performance.now();
        this.renderSystems.forEach((s) => {
            s.update(this.entities, dt);
        });
        this.approximateAvgRenderMs += (performance.now() - t0 - this.approximateAvgRenderMs) / 60;
    }
    advanceFrame() {
        if (!this.isPaused) {
            return;
        }
        this.tick(1);
    }
    getStateCopy() {
        return deepClone(this.entities);
    }
    loadState(entities) {
        this.entities = entities;
    }
    tick(dt) {
        this.simulationSystems.forEach((s) => {
            s.update(this.entities, dt);
        });
        this.simulationTick++;
    }
    rollback(tick, entities) {
        this.loadState(entities);
        if (this.simulationTick - tick > 20) {
            throw new Error(`whoa rolling back way too many ticks ${this.simulationTick - tick}`);
        }
        // console.log(`rolling back ${this.simulationTick - tick} ticks`);
        this.simulationTick = tick + 1;
    }
}
//# sourceMappingURL=game.js.map