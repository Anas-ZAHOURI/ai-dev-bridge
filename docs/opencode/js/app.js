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
    btn.textContent = getLangText('Copy', 'Copier');
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code')?.textContent || pre.textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = getLangText('Copied!', 'Copié !');
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = getLangText('Copy', 'Copier');
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
  if (btn) btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
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

// ===== Language Toggle =====
function getLangText(en, fr) {
  return document.documentElement.getAttribute('data-lang') === 'fr' ? fr : en;
}
function toggleLang() {
  const current = document.documentElement.getAttribute('data-lang') || 'en';
  const next = current === 'fr' ? 'en' : 'fr';
  document.documentElement.setAttribute('data-lang', next);
  document.documentElement.setAttribute('lang', next);
  localStorage.setItem('lang', next);
  updateLangButton();
  document.querySelectorAll('.copy-btn:not(.copied)').forEach(btn => {
    btn.textContent = next === 'fr' ? 'Copier' : 'Copy';
  });
}
function updateLangButton() {
  const btn = document.querySelector('.lang-toggle-header');
  if (!btn) return;
  const lang = document.documentElement.getAttribute('data-lang') || 'en';
  btn.querySelector('.lang-label').textContent = lang === 'fr' ? 'EN' : 'FR';
  btn.title = lang === 'fr' ? 'Switch to English' : 'Passer en français';
}
(function initLang() {
  const saved = localStorage.getItem('lang');
  if (saved === 'fr') {
    document.documentElement.setAttribute('data-lang', 'fr');
    document.documentElement.setAttribute('lang', 'fr');
  } else {
    document.documentElement.setAttribute('data-lang', 'en');
    document.documentElement.setAttribute('lang', 'en');
  }
  document.addEventListener('DOMContentLoaded', updateLangButton);
})();
