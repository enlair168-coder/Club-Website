
import { members, generations } from './data/members.js';
import {
  activities,
  activityCategories,
  values,
  weeklyChallenge,
  ethicalScenario,
  reflections,
  inspirations,
  socialLinks,
  contactEmail,
} from './data/content.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function avatar(member, iconSize) {
  if (member.photo) {
    return `<img src="${escapeHtml(member.photo)}" alt="Portrait of ${escapeHtml(member.name)}" loading="lazy" class="h-full w-full object-cover" />`;
  }
  return `<div class="grid h-full w-full place-items-center bg-navy-100 text-navy-400"><i data-lucide="user" class="${iconSize}"></i></div>`;
}

function socialLinksFor(social = {}) {
  return Object.entries(social)
    .filter(([, url]) => url)
    .map(
      ([name, url]) =>
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="social-link text-navy-700 border-navy-200 hover:border-gold-500 capitalize">${escapeHtml(name)}</a>`,
    )
    .join('');
}

function leaderCard(member) {
  return `
    <article class="reveal card-lift grid overflow-hidden rounded-3xl bg-navy-900 text-white shadow-xl shadow-navy-900/20 md:grid-cols-[18rem_1fr]">
      <div class="h-72 md:h-full">${avatar(member, 'h-16 w-16 text-navy-300')}</div>
      <div class="flex flex-col justify-center p-8 sm:p-10">
        <span class="inline-flex w-fit items-center gap-2 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy-900">
          <i data-lucide="star" class="h-3.5 w-3.5"></i>Generation Leader
        </span>
        <h3 class="mt-4 font-display text-3xl font-bold">${escapeHtml(member.name)}</h3>
        <p class="mt-1 font-semibold text-gold-300">${escapeHtml(member.position)}</p>
        <p class="mt-5 leading-relaxed text-navy-100">${escapeHtml(member.bio)}</p>
        <div class="mt-6">
          <p class="text-sm font-semibold uppercase tracking-wider text-gold-400">Responsibilities</p>
          <ul class="mt-3 space-y-2 text-sm text-navy-100">
            ${member.responsibilities.map((item) => `<li class="flex gap-2"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400"></span>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
        ${member.social && Object.keys(member.social).length ? `<div class="mt-6 flex flex-wrap gap-2">${socialLinksFor(member.social)}</div>` : ''}
      </div>
    </article>`;
}

function memberCard(member, index) {
  if (member.isLeader) return leaderCard(member);
  return `
    <article class="reveal card-lift flex flex-col rounded-2xl border border-navy-100 bg-white p-6 shadow-sm" style="transition-delay: ${index * 80}ms">
      <div class="flex items-center gap-4">
        <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-gold-300">${avatar(member, 'h-8 w-8')}</div>
        <div class="min-w-0">
          <h3 class="font-display text-xl font-bold text-navy-900">${escapeHtml(member.name)}</h3>
          <p class="mt-1 text-sm font-semibold text-gold-700">${escapeHtml(member.position)}</p>
        </div>
      </div>
      <p class="mt-5 text-sm leading-relaxed text-navy-600">${escapeHtml(member.bio)}</p>
      <ul class="mt-4 space-y-2 border-t border-navy-100 pt-4 text-sm text-navy-700">
        ${member.responsibilities.map((item) => `<li class="flex gap-2"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400"></span>${escapeHtml(item)}</li>`).join('')}
      </ul>
      ${member.social && Object.keys(member.social).length ? `<div class="mt-5 flex flex-wrap gap-2">${socialLinksFor(member.social)}</div>` : ''}
    </article>`;
}

function generationBlock(generation) {
  const list = members.filter((member) => member.generation === generation.year);
  const leader = list.find((member) => member.isLeader);
  const others = list.filter((member) => !member.isLeader);
  return `
    <div class="mt-20 first:mt-0">
      <div class="reveal flex flex-col gap-3 border-b border-navy-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Generation ${generation.year}</p>
          <h3 class="mt-2 font-display text-3xl font-bold text-navy-900">${escapeHtml(generation.title)}</h3>
          <p class="mt-2 max-w-2xl text-navy-600">${escapeHtml(generation.summary)}</p>
        </div>
        <p class="text-sm font-semibold text-navy-500">${list.length} members</p>
      </div>
      ${leader ? `<div class="mt-8">${memberCard(leader, 0)}</div>` : ''}
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${others.map((member, index) => memberCard(member, index)).join('')}
      </div>
    </div>`;
}

function valueCard(value, index) {
  return `
    <div class="reveal card-lift rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy-100" style="transition-delay: ${index * 80}ms">
      <span class="grid h-12 w-12 place-items-center rounded-xl bg-gold-50 text-gold-600"><i data-lucide="${escapeHtml(value.icon)}" class="h-6 w-6"></i></span>
      <h3 class="mt-5 font-display text-xl font-bold text-navy-900">${escapeHtml(value.title)}</h3>
      <p class="mt-2 leading-relaxed text-navy-600">${escapeHtml(value.description)}</p>
    </div>`;
}

function activityCard(activity, index) {
  const details = activity.details ?? [];
  return `
    <article class="activity-card card-lift flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm" style="animation-delay: ${index * 70}ms">
      <div class="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-gradient-to-br from-navy-200 to-navy-400">
        <img src="${escapeHtml(activity.image)}" alt="${escapeHtml(activity.imageAlt)}" loading="lazy" onerror="this.remove()" class="activity-image h-full w-full object-cover transition duration-500 hover:scale-105" />
        <span class="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy-800 shadow-sm">${escapeHtml(activity.category)}</span>
      </div>
      <div class="flex flex-1 flex-col p-6 sm:p-7">
        <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-600">
          <i data-lucide="calendar" class="h-4 w-4"></i>${escapeHtml(activity.date ?? activity.status)}
        </p>
        <h3 class="mt-3 font-display text-2xl font-bold leading-snug text-navy-900">${escapeHtml(activity.title)}</h3>
        <p class="mt-3 leading-relaxed text-navy-600">${escapeHtml(activity.description)}</p>
        ${
          details.length
            ? `<details class="group mt-auto pt-6">
          <summary class="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-800 shadow-sm transition hover:border-navy-400 hover:bg-navy-50 [&::-webkit-details-marker]:hidden">
            View details
            <i data-lucide="arrow-right" class="h-4 w-4 transition duration-300 group-open:rotate-90"></i>
          </summary>
          <ul class="mt-4 list-disc space-y-1 pl-5 text-sm text-navy-600">
            ${details.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </details>`
            : ''
        }
      </div>
    </article>`;
}

function activitiesIn(category) {
  return category === 'All' ? activities : activities.filter((activity) => activity.category === category);
}

function renderActivityFilters(activeCategory) {
  document.getElementById('activities-filters').innerHTML = activityCategories
    .map((category) => {
      const active = category === activeCategory;
      const look = active
        ? 'border-navy-900 bg-navy-900 text-white shadow-md'
        : 'border-navy-200 bg-white text-navy-700 hover:-translate-y-0.5 hover:border-navy-400 hover:bg-navy-50';
      const badge = active ? 'bg-gold-500 text-navy-900' : 'bg-navy-100 text-navy-600';
      return `<button type="button" data-category="${escapeHtml(category)}" aria-pressed="${active}" class="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition duration-200 ${look}">${escapeHtml(category)}<span class="grid h-5 min-w-[1.25rem] place-items-center rounded-full px-1.5 text-xs font-bold ${badge}">${activitiesIn(category).length}</span></button>`;
    })
    .join('');
}

function renderActivityGrid(category) {
  const visible = activitiesIn(category);
  document.getElementById('activities-grid').innerHTML = visible.length
    ? visible.map(activityCard).join('')
    : '<p class="col-span-full rounded-2xl bg-white p-8 text-center text-navy-500">No activities in this category yet.</p>';
  const status = document.getElementById('activities-status');
  if (status) {
    status.textContent =
      category === 'All'
        ? `Showing all ${activities.length} activities`
        : `Showing ${visible.length} of ${activities.length} activities in ${category}`;
  }
  window.lucide?.createIcons();
}

function initActivityFilters() {
  let activeCategory = 'All';
  const filters = document.getElementById('activities-filters');

  if (!document.getElementById('activities-status')) {
    filters.insertAdjacentHTML(
      'afterend',
      '<p id="activities-status" class="mt-6 text-center text-sm font-medium text-navy-500" role="status" aria-live="polite"></p>',
    );
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button || button.dataset.category === activeCategory) return;
    activeCategory = button.dataset.category;
    renderActivityFilters(activeCategory);
    renderActivityGrid(activeCategory);
    // The chips were redrawn, so give keyboard focus back to the one that was pressed.
    [...filters.querySelectorAll('button[data-category]')].find((b) => b.dataset.category === activeCategory)?.focus();
  });
  renderActivityFilters(activeCategory);
  renderActivityGrid(activeCategory);
}

function integrityContent() {
  return `
    <div class="grid gap-8 lg:grid-cols-2">
      <article class="reveal card-lift rounded-3xl bg-navy-900 p-8 text-white shadow-xl shadow-navy-900/20 sm:p-10">
        <span class="inline-flex items-center gap-2 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy-900">
          <i data-lucide="flag" class="h-3.5 w-3.5"></i>This Week's Challenge
        </span>
        <h3 class="mt-5 font-display text-3xl font-bold">${escapeHtml(weeklyChallenge.title)}</h3>
        <p class="mt-4 leading-relaxed text-navy-100">${escapeHtml(weeklyChallenge.description)}</p>
        <ol class="mt-6 space-y-3 text-navy-100">
          ${weeklyChallenge.steps.map((step, index) => `<li class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-500/20 text-sm font-bold text-gold-300">${index + 1}</span><span>${escapeHtml(step)}</span></li>`).join('')}
        </ol>
      </article>

      <article class="reveal card-lift rounded-3xl border border-navy-100 bg-white p-8 shadow-sm sm:p-10" style="transition-delay: 120ms">
        <span class="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gold-700">
          <i data-lucide="scale" class="h-4 w-4"></i>Ethical Scenario
        </span>
        <p class="mt-5 font-display text-2xl font-bold leading-snug text-navy-900">${escapeHtml(ethicalScenario.question)}</p>
        <p class="mt-6 text-sm font-semibold text-navy-500">Reflect on these questions</p>
        <ul class="mt-3 space-y-3 text-navy-700">
          ${ethicalScenario.prompts.map((prompt) => `<li class="flex gap-3"><i data-lucide="message-circle" class="mt-0.5 h-5 w-5 shrink-0 text-navy-400"></i><span>${escapeHtml(prompt)}</span></li>`).join('')}
        </ul>
      </article>
    </div>

    <div class="mt-8 grid gap-6 md:grid-cols-3">
      ${reflections
        .map(
          (reflection, index) => `
        <figure class="reveal card-lift rounded-2xl bg-navy-50 p-6" style="transition-delay: ${index * 100}ms">
          <i data-lucide="quote" class="h-7 w-7 text-gold-600"></i>
          <blockquote class="mt-4 leading-relaxed text-navy-800">${escapeHtml(reflection.quote)}</blockquote>
          <figcaption class="mt-5 text-sm font-semibold text-navy-500">${escapeHtml(reflection.author)}</figcaption>
        </figure>`,
        )
        .join('')}
    </div>

    <div class="reveal mt-12 rounded-3xl bg-gradient-to-r from-navy-900 to-navy-700 px-8 py-12 text-center text-white sm:px-12">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">Words to carry with you</p>
      <ul class="mt-6 space-y-4 font-display text-xl italic text-navy-100 sm:text-2xl">
        ${inspirations.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
      </ul>
    </div>`;
}

function renderSocialLinks() {
  return socialLinks
    .map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="social-link">${escapeHtml(link.label)}</a>`,
    )
    .join('');
}

export function renderPublicContent() {
  document.getElementById('values-grid').innerHTML = values.map(valueCard).join('');
  document.getElementById('generations-root').innerHTML = generations.map(generationBlock).join('');
  initActivityFilters();
  document.getElementById('integrity-root').innerHTML = integrityContent();
  document.getElementById('footer-social').innerHTML = renderSocialLinks();
  const email = document.getElementById('contact-email');
  email.textContent = contactEmail;
  email.href = `mailto:${contactEmail}`;
}