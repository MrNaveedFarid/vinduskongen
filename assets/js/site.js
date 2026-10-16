/* Vinduskongen v02. Ingen avhengigheter, sporingsverktøy eller nettverkskall. */
(() => {
  'use strict';
  const root = document.getElementById('vk-living-preview');
  if (!root) return;
  const header = root.querySelector('.vkn-header');
  const shell = root.querySelector('.vkn-header-shell');
  const menu = root.querySelector('.vkn-menu');
  const label = root.querySelector('.vkn-menu-label');
  const nav = root.querySelector('#vkn-navigation');
  const mobile = window.matchMedia('(max-width: 1080px)');

  if (header && shell && menu && nav) {
    const measure = () => root.style.setProperty('--vkn-header-height', shell.getBoundingClientRect().height + 'px');
    const setMenu = (open, returnFocus = false) => {
      header.classList.toggle('vkn-menu-open', open);
      menu.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Lukk' : 'Meny';
      measure();
      if (returnFocus) menu.focus();
    };
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', event => {
      if (event.target.closest('a[href^="#"]')) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', event => {
      if (mobile.matches && !shell.contains(event.target)) setMenu(false);
    });
    document.addEventListener('focusin', event => {
      if (mobile.matches && !shell.contains(event.target) && menu.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
    const resized = () => { setMenu(false); measure(); };
    if (mobile.addEventListener) mobile.addEventListener('change', resized);
    else mobile.addListener(resized);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(shell);
    window.addEventListener('resize', measure, { passive: true });
    root.classList.add('vkn-js');
    measure();

    // Aktivt menypunkt følger siden uten å overstyre nettleserens ankerlenker.
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = links.map(link => root.querySelector(link.getAttribute('href'))).filter(Boolean);
    let queued = false;
    const updateNavigation = () => {
      queued = false;
      let active = null;
      const line = shell.getBoundingClientRect().height + 120;
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) active = section;
      }
      for (const link of links) {
        if (active && link.getAttribute('href') === '#' + active.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; window.requestAnimationFrame(updateNavigation); }
    }, { passive: true });
    window.addEventListener('resize', updateNavigation, { passive: true });
    updateNavigation();
  }

  const config = window.VinduskongenConfig || {};
  const isReal = value => typeof value === 'string' && value.trim() && !/[\[\]<>\r\n]/.test(value);
  root.querySelectorAll('[data-contact]').forEach(link => {
    const kind = link.dataset.contact;
    const value = typeof config[kind] === 'string' ? config[kind].trim() : '';
    const text = link.querySelector('strong');
    if (text && value) text.textContent = value;
    const displayed = value || (kind === 'email' ? '[E-POST]' : '[TELEFON]');
    link.setAttribute('aria-label', (kind === 'email' ? 'E-post: ' : 'Telefon: ') + displayed);
    const valid = kind === 'email'
      ? isReal(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      : isReal(value) && /^\+?[0-9 ()-]+$/.test(value) && value.replace(/\D/g, '').length >= 8;
    if (config.placeholderMode !== false || !valid) {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      return;
    }
    link.href = kind === 'email' ? 'mailto:' + value : 'tel:' + value.replace(/[^+0-9]/g, '');
    link.removeAttribute('aria-disabled');
  });
  root.querySelectorAll('[data-company]').forEach(element => {
    const value = config[element.dataset.company];
    if (typeof value === 'string') element.textContent = value;
  });
})();
