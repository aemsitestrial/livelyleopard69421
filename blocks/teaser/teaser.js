import decorateLogo from '../xe-logo/xe-logo.js';

// The logo's settings, authored on this block as "{setting}-{value}" classes.
const LOGO_SETTINGS = ['variant', 'size', 'type'];

export default function decorate(block) {
  // The logo's classes_ fields don't render a row, so it gets a container of its own.
  const logo = document.createElement('div');
  logo.className = 'teaser-logo';
  logo.classList.add(...[...block.classList].filter(
    (className) => LOGO_SETTINGS.some((name) => className.startsWith(`${name}-`)),
  ));
  decorateLogo(logo, { size: 'sm' });
  block.append(logo);
}
