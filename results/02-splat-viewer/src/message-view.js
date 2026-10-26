export function showMessage(text) {
  let element = document.querySelector('.message');
  if (!element) {
    element = document.createElement('div');
    element.className = 'message';
    document.body.append(element);
  }
  element.textContent = text;
}

export function hideMessage() {
  document.querySelector('.message')?.remove();
}
