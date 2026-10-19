import '@testing-library/jest-dom/vitest';

// jsdom does not implement <dialog>.showModal()/close().
// Minimal stand-ins so components using <dialog> can be tested.
if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype;

  proto.showModal ??= function showModal() {
    this.setAttribute('open', '');
  };

  proto.close ??= function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}