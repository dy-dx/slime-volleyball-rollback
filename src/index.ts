import Game from './game.js';

const div = document.getElementById('main');
if (!div) {
  throw new Error('#main element is not present.');
}
const game = new Game(div, 750, 375);
// const simpleUpdateLoop = () => {
//   game.update(1);
// };

let last = Date.now();
const renderLoop = () => {
  const now = Date.now();
  game.render((now - last) / 1000);
  last = now;
  window.requestAnimationFrame(renderLoop);
};

const interval = 1000 / 60;
let nextUpdate = 0;
function updateLoop() {
  const now = performance.now();

  if (nextUpdate === 0) {
    nextUpdate = now;
  }

  if (now >= nextUpdate) {
    game.update(1);

    nextUpdate += interval;

    if (now >= nextUpdate) {
      // we missed a tick, really bad
      console.error('game update loop: missed a tick');
      // nextUpdate = now + interval;
      // nextUpdate = now + interval;
    }
  }

  // Schedule next update right before we'd want
  setTimeout(updateLoop, (nextUpdate - performance.now()) * 0.9);
}

const launch = (): void => {
  renderLoop();
  // setInterval(simpleUpdateLoop, 1000 / 60);
  updateLoop();
};

export default launch;
