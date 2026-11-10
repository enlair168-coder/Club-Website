import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const self = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const block = {};
for (const m of self.matchAll(/\/\*@@(\w+)\n([\s\S]*?)\n@@\*\//g)) block[m[1]] = m[2];

function edit(file, changes) {
    if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}  (run this from the vite-project folder)`); return; }
    let text = fs.readFileSync(file, 'utf8');
    const crlf = text.includes('\r\n');
    text = text.replace(/\r\n/g, '\n');
    for (const [label, fn] of changes) {
        const next = fn(text);
        if (next === null) console.log(`ALREADY DONE  ${file}: ${label}`);
        else if (next === false) console.log(`NOT FOUND     ${file}: ${label}  <-- tell me about this one`);
        else { text = next; console.log(`CHANGED       ${file}: ${label}`); }
    }
    fs.writeFileSync(file, crlf ? text.replace(/\n/g, '\r\n') : text);
}

edit('index.html', [
    ['filter chips + 3-column grid', (t) => {
        if (t.includes('id="activities-filters"')) return null;
        const re = /[ \t]*<div id="activities-grid"[^\n]*><\/div>/;
        return re.test(t) ? t.replace(re, () => block.HTML_NEW) : false;
    }],
]);

edit('src/render.js', [
    ['export escapeHtml (needed by admin page)', (t) => {
        if (t.includes('export function escapeHtml')) return null;
        return t.includes('function escapeHtml(') ? t.replace('function escapeHtml(', 'export function escapeHtml(') : false;
    }],
    ['new activity card + filter functions', (t) => {
        if (t.includes('function showActivities')) return null;
        const a = t.indexOf('function activityCard(');
        const b = t.indexOf('function integrityContent(');
        if (a < 0 || b < 0 || b < a) return false;
        return t.slice(0, a) + block.RENDER_CHUNK + '\n\n' + t.slice(b);
    }],
    ['call showActivities() + chip click handler', (t) => {
        if (t.includes("addEventListener('click', (event) => {\n        const button = event.target.closest('[data-filter]')")) return null;
        const re = /[ \t]*document\.getElementById\('activities-grid'\)\.innerHTML = activities\.map\(activityCard\)\.join\(''\);/;
        return re.test(t) ? t.replace(re, () => block.GRID_NEW) : false;
    }],
]);

edit('style.css', [
    ['.activity-card fade-in animation', (t) => {
        if (t.includes('.activity-card {')) return null;
        const i = t.indexOf('.card-lift {');
        return i < 0 ? false : t.slice(0, i) + block.CSS_ANIM + '\n\n' + t.slice(i);
    }],
    ['reduced-motion rule', (t) => {
        if (/prefers-reduced-motion[\s\S]*\.activity-card \{\s*animation: none/.test(t)) return null;
        const m = t.indexOf('@media (prefers-reduced-motion: reduce) {');
        if (m < 0) return false;
        const r = t.indexOf('.reveal {', m);
        if (r < 0) return false;
        const end = t.indexOf('}', r) + 1;
        return t.slice(0, end) + '\n\n' + block.CSS_REDUCED + t.slice(end);
    }],
]);

console.log('\nDone. Now check the page. You can delete patch-activities.mjs afterwards.');

/*@@HTML_NEW
        <div id="activities-filters" class="mt-12 flex flex-wrap justify-center gap-3" role="group" aria-label="Filter activities by category"></div>
        <div id="activities-grid" class="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"></div>
@@*/

/*@@RENDER_CHUNK
function activityCard(activity, index) {
    return `
    <article class="activity-card card-lift flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy-100" style="animation-delay: ${index * 70}ms">
      <div class="relative aspect-[4/3] overflow-hidden">
        <img src="${escapeHtml(activity.image)}" alt="${escapeHtml(activity.imageAlt)}" loading="lazy" class="h-full w-full object-cover transition duration-700 hover:scale-105" />
        <span class="absolute left-4 top-4 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy-800 shadow">${escapeHtml(activity.category)}</span>
      </div>
      <div class="flex flex-1 flex-col p-6">
        <p class="text-sm font-semibold text-gold-700">${escapeHtml(activity.date)}</p>
        <h3 class="mt-2 font-display text-xl font-bold text-navy-900">${escapeHtml(activity.title)}</h3>
        <p class="mt-3 text-sm leading-relaxed text-navy-600">${escapeHtml(activity.description)}</p>
        <details class="group mt-auto border-t border-navy-100 pt-4 [&:not([open])]:mt-6">
          <summary class="flex cursor-pointer items-center justify-between text-sm font-semibold text-navy-700">
            Details
            <i data-lucide="plus" class="h-4 w-4 transition duration-300 group-open:rotate-45"></i>
          </summary>
          <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-navy-600">
            ${activity.details.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </details>
      </div>
    </article>`;
}

function activityFilters(selected) {
    const categories = ['All', ...new Set(activities.map((activity) => activity.category))];
    return categories
        .map((category) => {
            const active = category === selected;
            const look = active
                ? 'border-navy-900 bg-navy-900 font-semibold text-white'
                : 'border-navy-200 bg-white font-medium text-navy-700 hover:border-navy-400 hover:bg-navy-50';
            return `<button type="button" data-filter="${escapeHtml(category)}" aria-pressed="${active}" class="rounded-full border px-5 py-2.5 text-sm transition ${look}">${escapeHtml(category)}</button>`;
        })
        .join('');
}

function showActivities(category = 'All') {
    const visible = category === 'All' ? activities : activities.filter((activity) => activity.category === category);
    document.getElementById('activities-filters').innerHTML = activityFilters(category);
    document.getElementById('activities-grid').innerHTML = visible.map(activityCard).join('');
    window.lucide?.createIcons();
}
@@*/

/*@@GRID_NEW
    showActivities();
    document.getElementById('activities-filters').addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter]');
        if (!button) return;
        const category = button.dataset.filter;
        showActivities(category);
        [...document.querySelectorAll('#activities-filters [data-filter]')].find((b) => b.dataset.filter === category)?.focus();
    });
@@*/

/*@@CSS_ANIM
.activity-card {
  animation: activity-in 0.5s ease backwards;
}

@keyframes activity-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}
@@*/

/*@@CSS_REDUCED
  .activity-card {
    animation: none;
  }
@@*/