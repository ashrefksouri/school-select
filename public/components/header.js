/* ════════════════════════════════════════════════════════════════════════════
   SHARED HEADER — School Select v1.0
   Usage : <script src="/components/header.js"></script>
   ════════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ────── Détection page active ──────
  function detectActive() {
    var p = window.location.pathname;
    if (p === '/' || p === '/index.html') return 'home';
    if (p.indexOf('/ecoles') === 0) return 'ecoles';
    if (p.indexOf('/comparer') === 0) return 'comparer';
    if (p.indexOf('/quiz') === 0) return 'quiz';
    if (p.indexOf('/blog') === 0) return 'blog';
    if (p.indexOf('/a-propos') === 0) return 'about';
    return null;
  }

  // ────── CSS injecté en <head> ──────
  var css = `
.ss-header {
  position: sticky;
  top: 0;
  z-index: 60;
  height: 64px;
  background: var(--ink-deep, #0E2A5C);
  color: #fff;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,.08);
  transition: box-shadow 200ms cubic-bezier(.22,1,.36,1);
}
.ss-header.is-scrolled { box-shadow: 0 4px 12px -2px rgba(0,0,0,.15); }
.ss-header__inner {
  max-width: var(--container-2xl, 1320px);
  margin: 0 auto;
  padding: 0 var(--space-6, 32px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5, 24px);
}
@media (max-width: 640px) {
  .ss-header__inner { padding: 0 var(--space-5, 20px); }
}
.ss-brand {
  font-family: var(--display, 'Fraunces', serif);
  font-size: 19px;
  font-weight: 400;
  letter-spacing: -.015em;
  color: #fff;
  text-decoration: none;
  flex-shrink: 0;
  transition: opacity 150ms ease;
}
.ss-brand:hover { opacity: .85; }
.ss-brand em {
  font-style: italic;
  font-variation-settings: 'opsz' 144;
  color: var(--jade-light, #5EEAD4);
  font-weight: 400;
}
.ss-nav {
  display: flex;
  gap: var(--space-5, 24px);
  align-items: center;
}
.ss-nav a {
  font-family: var(--display-ui, 'Inter Tight', sans-serif);
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,.72);
  text-decoration: none;
  padding: 8px 0;
  position: relative;
  letter-spacing: -.005em;
  transition: color 150ms ease;
  white-space: nowrap;
}
.ss-nav a:hover { color: #fff; }
.ss-nav a.is-active { color: #fff; }
.ss-nav a.is-active::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: -2px;
  height: 2px;
  background: var(--jade-light, #5EEAD4);
  border-radius: 1px;
}
.ss-lang {
  font-family: var(--mono, 'JetBrains Mono', monospace);
  font-size: 11px;
  letter-spacing: .12em;
  color: rgba(255,255,255,.55);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.ss-lang a {
  color: rgba(255,255,255,.55);
  text-decoration: none;
  transition: color 150ms ease;
}
.ss-lang a:hover { color: #fff; }
.ss-lang a.is-active { color: #fff; }
.ss-lang .sep { opacity: .3; }

.ss-burger {
  display: none;
  width: 28px;
  height: 28px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}
.ss-burger span {
  display: block;
  width: 22px;
  height: 2px;
  background: #fff;
  border-radius: 1px;
  transition: all 200ms ease;
}

@media (max-width: 820px) {
  .ss-nav { display: none; }
  .ss-burger { display: flex; }
  .ss-nav.is-open {
    display: flex;
    position: absolute;
    top: 100%;
    left: 0; right: 0;
    background: var(--ink-deep, #0E2A5C);
    flex-direction: column;
    padding: var(--space-5, 24px) var(--space-6, 32px);
    gap: var(--space-3, 12px);
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .ss-nav.is-open a { padding: 10px 0; font-size: 16px; }
}
`;

  var style = document.createElement('style');
  style.id = 'ss-header-styles';
  style.textContent = css;
  document.head.appendChild(style);

  // ────── HTML du header ──────
  var active = detectActive();
  function activeClass(id) { return active === id ? ' class="is-active"' : ''; }

  var html = `
<header class="ss-header" id="ssHeader">
  <div class="ss-header__inner">
    <a class="ss-brand" href="/">School<em>·</em>Select</a>
    <button class="ss-burger" id="ssBurger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <nav class="ss-nav" id="ssNav">
      <a href="/ecoles/"${activeClass('ecoles')}>Écoles</a>
      <a href="/comparer/"${activeClass('comparer')}>Comparer</a>
      <a href="/quiz/"${activeClass('quiz')}>Quiz</a>
      <a href="/blog/"${activeClass('blog')}>Blog</a>
      <a href="/a-propos/"${activeClass('about')}>À propos</a>
    </nav>
    <div class="ss-lang">
      <a href="#" class="is-active">FR</a>
      <span class="sep">/</span>
      <a href="#">AR</a>
    </div>
  </div>
</header>
`;

  // ────── Injection ──────
  // Si <header data-ss-header> existe, on le remplace. Sinon on prepend dans body.
  var existing = document.querySelector('[data-ss-header], .site-header, header.site-header, #siteHeader');
  if (existing) {
    existing.outerHTML = html;
  } else {
    var first = document.body.firstChild;
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.insertBefore(wrap.firstElementChild, first);
  }

  // ────── Comportement ──────
  function init() {
    var header = document.getElementById('ssHeader');
    var burger = document.getElementById('ssBurger');
    var nav = document.getElementById('ssNav');

    // Burger menu
    if (burger && nav) {
      burger.addEventListener('click', function() {
        nav.classList.toggle('is-open');
      });
    }

    // Shadow au scroll
    function onScroll() {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
