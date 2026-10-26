import { SUPPORTED_FORMATS } from './splat-choice.js';

// An "Open file" button plus drag & drop anywhere in the window. Both call
// onFile(File); the caller decides what to do with the file.
export function createFileOpener({ onFile }) {
  const button = document.createElement('button');
  button.id = 'open-file';
  button.type = 'button';
  button.textContent = 'Open file';
  button.title = 'Open a splat file, or drop one anywhere';

  const input = document.createElement('input');
  input.type = 'file';
  input.hidden = true;
  input.accept = SUPPORTED_FORMATS.map((format) => `.${format}`).join(',');
  input.addEventListener('change', () => {
    const file = input.files[0];
    input.value = '';
    if (file) onFile(file);
  });
  button.addEventListener('click', () => input.click());

  // Dropping a file anywhere should open it; other drops must not navigate.
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) onFile(file);
  });

  document.body.append(button, input);
  return { button, input };
}
