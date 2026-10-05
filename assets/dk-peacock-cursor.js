/**
 * Delisha Karigari — Custom Peacock-Feather Inspired Luxury Cursor
 * Minimal, refined, hardware-accelerated, and mobile/touch safe.
 */
(function() {
  'use strict';

  // 1. Never initialize on touch devices or mobile
  const isTouchDevice = ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (isTouchDevice) return;

  // 2. Respect user accessibility settings
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mouseX = -100;
  let mouseY = -100;
  let eyeX = -100;
  let eyeY = -100;
  let isHovered = false;
  let isClicking = false;
  let isHidden = true;
  let isTextElement = false;
  let animFrameId = null;

  // 3. Create DOM elements
  const dot = document.createElement('div');
  dot.className = 'dk-cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  const eye = document.createElement('div');
  eye.className = 'dk-cursor-eye';
  eye.setAttribute('aria-hidden', 'true');

  // SVG Feather-Eye motif inside the eye
  eye.innerHTML = `
    <svg class="dk-cursor-eye-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path class="dk-eye-outer" d="M12 2C7 8 4 11.5 4 15C4 19.4 7.6 22 12 22C16.4 22 20 19.4 20 15C20 11.5 17 8 12 2Z" stroke="#B89A62" stroke-width="1.2" stroke-opacity="0.85"/>
      <ellipse class="dk-eye-core" cx="12" cy="15.5" rx="3.5" ry="4" fill="#641A28" fill-opacity="0.25" stroke="#B89A62" stroke-width="0.8"/>
      <circle class="dk-eye-pupil" cx="12" cy="15.5" r="1.5" fill="#B89A62"/>
    </svg>
  `;

  document.body.appendChild(dot);
  document.body.appendChild(eye);

  // 4. Mouse Move Listener
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (isHidden) {
      isHidden = false;
      eyeX = mouseX;
      eyeY = mouseY;
      dot.classList.add('is-visible');
      eye.classList.add('is-visible');
    }

    // Instantly snap dot to precise pointer
    dot.style.transform = 'translate3d(' + mouseX + 'px, ' + mouseY + 'px, 0)';

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(render);
    }
  }

  // 5. Smooth Trailing Physics (Lerp)
  const lerpFactor = prefersReducedMotion ? 1 : 0.22;

  function render() {
    const dx = mouseX - eyeX;
    const dy = mouseY - eyeY;

    eyeX += dx * lerpFactor;
    eyeY += dy * lerpFactor;

    eye.style.transform = 'translate3d(' + eyeX + 'px, ' + eyeY + 'px, 0)';

    // Continue loop if still moving or active
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || isHovered) {
      animFrameId = requestAnimationFrame(render);
    } else {
      animFrameId = null;
    }
  }

  // 6. Interactive Element Hover Detection
  const interactiveSelector = [
    'a',
    'button',
    '[role="button"]',
    'input[type="submit"]',
    'input[type="button"]',
    '.dk-product-card',
    '.dk-recipient-box',
    '.dk-occasion-card',
    '.dk-hero-arrow',
    '.dk-hero-dot',
    '.dk-location-btn',
    '.dk-header__icon-btn',
    'summary',
    'select'
  ].join(',');

  const textInputSelector = [
    'input[type="text"]',
    'input[type="search"]',
    'input[type="email"]',
    'input[type="tel"]',
    'input[type="number"]',
    'input[type="password"]',
    'textarea',
    '[contenteditable="true"]'
  ].join(',');

  function onMouseOver(e) {
    const target = e.target;
    if (!target) return;

    // Check if over text input -> hide custom cursor for native I-beam
    if (target.closest && target.closest(textInputSelector)) {
      dot.classList.add('is-hidden');
      eye.classList.add('is-hidden');
      isTextElement = true;
      return;
    } else if (isTextElement) {
      dot.classList.remove('is-hidden');
      eye.classList.remove('is-hidden');
      isTextElement = false;
    }

    // Check if over interactive element -> expand eye motif
    if (target.closest && target.closest(interactiveSelector)) {
      if (!isHovered) {
        isHovered = true;
        dot.classList.add('is-hover');
        eye.classList.add('is-hover');
        if (!animFrameId) animFrameId = requestAnimationFrame(render);
      }
    } else {
      if (isHovered) {
        isHovered = false;
        dot.classList.remove('is-hover');
        eye.classList.remove('is-hover');
      }
    }
  }

  // 7. Mouse Down / Up Tactile Feedback
  function onMouseDown() {
    isClicking = true;
    dot.classList.add('is-active');
    eye.classList.add('is-active');
  }

  function onMouseUp() {
    isClicking = false;
    dot.classList.remove('is-active');
    eye.classList.remove('is-active');
  }

  // 8. Window Leave / Enter
  function onMouseLeave() {
    isHidden = true;
    dot.classList.remove('is-visible');
    eye.classList.remove('is-visible');
  }

  function onMouseEnter() {
    isHidden = false;
    dot.classList.add('is-visible');
    eye.classList.add('is-visible');
  }

  // Event Listeners
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseover', onMouseOver, { passive: true });
  window.addEventListener('mousedown', onMouseDown, { passive: true });
  window.addEventListener('mouseup', onMouseUp, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave, { passive: true });
  document.addEventListener('mouseenter', onMouseEnter, { passive: true });
})();
