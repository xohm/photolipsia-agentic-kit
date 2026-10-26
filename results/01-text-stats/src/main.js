import { textStats } from './stats.js';

const textarea = document.querySelector('#text');
const clearButton = document.querySelector('#clear');
const outputs = new Map(
  [...document.querySelectorAll('[data-stat]')].map((el) => [el.dataset.stat, el]),
);

function render() {
  const stats = textStats(textarea.value);
  for (const [key, el] of outputs) {
    el.textContent = String(stats[key]);
  }
}

textarea.addEventListener('input', render);
clearButton.addEventListener('click', () => {
  textarea.value = '';
  render();
});
render();
window.__APP_READY__ = true;
