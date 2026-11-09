import './style.css';
import { renderPublicContent } from './src/render.js';
import { initForms } from './src/forms.js';

renderPublicContent();
initForms();
initHeader();
initMobileMenu();
initReveal();
window.lucide?.createIcons();

function initHeader() {
  const header = document.getElementById('site-header');
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}

function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  const setOpen = (isOpen) => {
    menu.classList.toggle('hidden', !isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    toggle.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}" class="h-5 w-5"></i>`;
    window.lucide?.createIcons();
  };
  toggle.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15 },
  );
  items.forEach((item) => observer.observe(item));
}
