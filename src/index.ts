import Game from './game.js';

const div = document.getElementById('main');
if (!div) {
  throw new Error('#main element is not present.');
}
const game = new Game(div, 750, 375);
const updateLoop = () => {
  game.update(1);
};

let last = Date.now();
const renderLoop = () => {
  const now = Date.now();
  game.render((now - last) / 1000);
  last = now;
  window.requestAnimationFrame(renderLoop);
};

const launch = (): void => {
  renderLoop();
  setInterval(updateLoop, 1000 / 60);
};

export default launch;
