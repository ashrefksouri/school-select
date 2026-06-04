/* ════════════════════════════════════════════════════════════════════════════
   SHARED FOOTER — School Select v1.0
   Usage : <script src="/components/footer.js"></script>
   ════════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var css = `
.ss-footer {
  background: var(--black, #1A1814);
  color: rgba(255,255,255,.55);
  padding: var(--space-8, 64px) 0 var(--space-6, 32px);
  margin-top: var(--space-9, 96px);
}
.ss-footer__inner {
  max-width: var(--container-2xl, 1320px);
  margin: 0 auto;
  padding: 0 var(--space-6, 32px);
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: var(--space-6, 32px);
}
@media (max-width: 900px) {
  .ss-footer__inner { grid-template-columns: 1fr 1fr; gap: var(--space-5, 24px); }
}
@media (max-width: 540px) {
  .ss-footer__inner { grid-template-columns: 1fr; }
}
.ss-footer h5 {
  font-family: var(--mono, 'JetBrains Mono', monospace);
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #fff;
  margin: 0 0 18px;
  font-weight: 600;
}
.ss-foot-brand {
  font-family: var(--display, 'Fraunces', serif);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -.015em;
  color: #fff;
  margin-bottom: 14px;
  display: inline-block;
  text-decoration: none;
}
.ss-foot-brand em {
  font-style: italic;
  font-variation-settings: 'opsz' 144;
  color: var(--jade-light, #5EEAD4);
}
.ss-footer p {
  font-family: var(--body, 'Inter', sans-serif);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  color: rgba(255,255,255,.55);
}
.ss-footer ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  margin: 0;
}
.ss-footer a {
  font-family: var(--body, 'Inter', sans-serif);
  font-size: 14px;
  color: rgba(255,255,255,.55);
  text-decoration: none;
  transition: color 150ms cubic-bezier(.4,0,.2,1);
}
.ss-footer a:hover { color: #fff; }
.ss-footer__bottom {
  max-width: var(--container-2xl, 1320px);
  margin: var(--space-6, 32px) auto 0;
  padding: var(--space-5, 24px) var(--space-6, 32px) 0;
  border-top: 1px solid rgba(255,255,255,.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3, 12px);
  font-family: var(--mono, 'JetBrains Mono', monospace);
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.4);
}
`;

  var style = document.createElement('style');
  style.id = 'ss-footer-styles';
  style.textContent = css;
  document.head.appendChild(style);

  var year = new Date().getFullYear();

  var html = `
<footer class="ss-footer">
  <div class="ss-footer__inner">
    <div>
      <a class="ss-foot-brand" href="/">School<em>·</em>Select</a>
      <p>L'annuaire éditorial indépendant des écoles privées internationales en Tunisie. 17 écoles vérifiées, mises à jour trimestrielles.</p>
    </div>
    <div>
      <h5>Naviguer</h5>
      <ul>
        <li><a href="/ecoles/">Toutes les écoles</a></li>
        <li><a href="/comparer/">Comparer</a></li>
        <li><a href="/quiz/">Quiz orientation</a></li>
        <li><a href="/blog/">Blog</a></li>
      </ul>
    </div>
    <div>
      <h5>Par curriculum</h5>
      <ul>
        <li><a href="/ecoles/?cur=IB">IB</a></li>
        <li><a href="/ecoles/?cur=Fran%C3%A7ais">Français</a></li>
        <li><a href="/ecoles/?cur=Britannique">Britannique</a></li>
        <li><a href="/ecoles/?cur=Am%C3%A9ricain">Américain</a></li>
      </ul>
    </div>
    <div>
      <h5>À propos</h5>
      <ul>
        <li><a href="/a-propos/">L'éditorial</a></li>
        <li><a href="/contact/">Nous contacter</a></li>
      </ul>
    </div>
    <div>
      <h5>Légal</h5>
      <ul>
        <li><a href="/mentions-legales/">Mentions légales</a></li>
        <li><a href="/confidentialite/">Confidentialité</a></li>
        <li><a href="/cgu/">CGU</a></li>
      </ul>
    </div>
  </div>
  <div class="ss-footer__bottom">
    <span>© ${year} School Select · Tunis</span>
    <span>Données vérifiées · Mai 2026</span>
  </div>
</footer>
`;

  var existing = document.querySelector('[data-ss-footer], .site-footer, footer.site-footer, footer.foot, #siteFooter');
  if (existing) {
    existing.outerHTML = html;
  } else {
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
  }
})();
