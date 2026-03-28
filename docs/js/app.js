// ===== Navigation =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.header-nav a').forEach(a => a.classList.remove('active'));

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    document.querySelector(`.header-nav a[data-page="${pageId}"]`)?.classList.add('active');
    updateSidebar(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeSidebar();
  }
}

function updateSidebar(pageId) {
  document.querySelectorAll('.sidebar-page-section').forEach(s => s.style.display = 'none');
  const section = document.querySelector(`.sidebar-page-section[data-page="${pageId}"]`);
  if (section) section.style.display = 'block';

  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
}

// ===== Sidebar scroll spy =====
function setupScrollSpy() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.sidebar a[href="#${id}"]`);
        if (link) {
          link.classList.add('active');
          link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 });

  document.querySelectorAll('h2[id], h3[id]').forEach(h => observer.observe(h));
}

// ===== Mobile sidebar =====
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
}

// ===== Copy buttons =====
function setupCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copier';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code')?.textContent || pre.textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copie !';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copier';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    pre.appendChild(btn);
  });
}

// ===== Tabs =====
function setupTabs() {
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const tabs = tabGroup.querySelectorAll('.tab');
    const groupId = tabGroup.dataset.group;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll(`.tab-content[data-group="${groupId}"]`).forEach(c => c.classList.remove('active'));
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.add('active');
      });
    });
  });
}

// ===== Cards navigation =====
function setupCards() {
  document.querySelectorAll('.card[data-goto]').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.dataset.goto;
      if (target.startsWith('#')) {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        showPage(target);
      }
    });
  });
}

// ===== Sidebar smooth scroll =====
function setupSidebarLinks() {
  document.querySelectorAll('.sidebar a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href').substring(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeSidebar();
      }
      document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
      a.classList.add('active');
    });
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  setupCopyButtons();
  setupTabs();
  setupCards();
  setupSidebarLinks();
  setupScrollSpy();

  // Default page
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    // Try to find which page contains this anchor
    const el = document.getElementById(hash);
    const page = el.closest('.page');
    if (page) showPage(page.id);
  } else {
    showPage('quickstart');
  }
});

// ===== Dark Mode =====
function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateDarkModeIcon();
}
function updateDarkModeIcon() {
  const btn = document.querySelector('.dark-mode-toggle-header');
  if (btn) btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  document.addEventListener('DOMContentLoaded', updateDarkModeIcon);
})();
