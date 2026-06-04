#!/usr/bin/env node
/**
 * School Select — Build pipeline
 *
 * Lit tous les fichiers `data/schools/{slug}.json` (sources de vérité),
 * et génère :
 *   - public/{slug}/index.html        — fiche HTML statique par école
 *   - public/data/schools.json        — index agrégé léger (pour search/quiz/comparateur)
 *   - public/sitemap.xml              — sitemap SEO
 *
 * Validation runtime via Ajv contre data/school.schema.json.
 *
 * Usage :
 *   node scripts/build-schools.mjs                 # build complet
 *   node scripts/build-schools.mjs --school=bist   # 1 école
 *   node scripts/build-schools.mjs --dry           # ne pas écrire (preview)
 *
 * Dépendances (npm install --save-dev) :
 *   - ajv
 *   - ajv-formats
 *
 * Aucune autre dépendance externe (template Mustache implémenté en pur JS).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ───── Chemins ────────────────────────────────────────────────
const PATHS = {
  schoolsDir:    path.join(ROOT, 'data', 'schools'),
  schemaFile:    path.join(ROOT, 'data', 'school.schema.json'),
  templateFile:  path.join(ROOT, 'data', 'fiche-ecole-template.html'),
  publicDir:     path.join(ROOT, 'public'),
  publicDataDir: path.join(ROOT, 'public', 'data'),
  indexFile:     path.join(ROOT, 'public', 'data', 'schools.json'),
  sitemapFile:   path.join(ROOT, 'public', 'sitemap.xml'),
  siteUrl:       'https://schoolselect.online',
};

// ───── Args CLI ───────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {
  school:       args.find(a => a.startsWith('--school='))?.split('=')[1] ?? null,
  dry:          args.includes('--dry') || args.includes('--validate-only'),
  validateOnly: args.includes('--validate-only'),
  quiet:        args.includes('--quiet'),
};

const log = (...a) => { if (!flags.quiet) console.log(...a); };

// ───── Catalogues d'icônes SVG ────────────────────────────────
const HERO_ICONS = {
  location: '<svg class="ico-sm ico" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  book:     '<svg class="ico-sm ico" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  users:    '<svg class="ico-sm ico" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  home:     '<svg class="ico-sm ico" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  globe:    '<svg class="ico-sm ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>',
  school:   '<svg class="ico-sm ico" viewBox="0 0 24 24"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v10H2V12l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4"/></svg>',
  calendar: '<svg class="ico-sm ico" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  star:     '<svg class="ico-sm ico" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  trophy:   '<svg class="ico-sm ico" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
};

const SERVICE_ICONS = {
  smart_class: '<svg class="ico" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  labs:        '<svg class="ico" viewBox="0 0 24 24"><path d="M10 2v8.5a2.5 2.5 0 0 1-5 0V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>',
  library:     '<svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  music_art:   '<svg class="ico" viewBox="0 0 24 24"><path d="M2 22h20"/><path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l3-2 4 6 4-6 3 2-3 6 1.13.55a2 2 0 0 0 1.8 0l.17-.1a2 2 0 0 1 1.8 0L22 13l-2 4-2.36.4"/></svg>',
  pool:        '<svg class="ico" viewBox="0 0 24 24"><path d="M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><path d="M2 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/></svg>',
  forest:      '<svg class="ico" viewBox="0 0 24 24"><path d="M12 22v-7l-2-2"/><path d="M17 8c.8 1.5.9 4.8.5 7.5-.5 1.5-1.5 3-3 4-1 .8-2 1-3 .5"/><path d="M12 4a3 3 0 1 0 0-2 3 3 0 0 0 0 2z"/></svg>',
  cantine:     '<svg class="ico" viewBox="0 0 24 24"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>',
  byod:        '<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  transport:   '<svg class="ico" viewBox="0 0 24 24"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  infirmerie:  '<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/></svg>',
  garderie:    '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>',
  psy:         '<svg class="ico" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
};

const TIER_LABELS = {
  economique:   'Économique',
  premium:      'Premium',
  premium_plus: 'Premium+',
  ultra:        'Ultra-premium',
};

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fmtDateFR = iso => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d, 10)} ${MONTHS_FR[parseInt(m, 10) - 1]} ${y}`;
};

const phoneToTel = p => (p ? p.replace(/\s/g, '') : '');
const domainFromUrl = u => (u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// ───── Moteur Mustache (autonome, sans dépendance) ────────────
// Supporte : {{var}} (échappé), {{{var}}} (raw), {{#section}}..{{/section}}, {{^section}}..{{/section}}
const TOKEN_RE = /\{\{([#^/])\s*(\w+)\s*\}\}|\{\{\{\s*(\w+)\s*\}\}\}|\{\{\s*(\w+)\s*\}\}/g;

function parseTemplate(template) {
  // Parser → AST
  function parseAt(idx, stopTag) {
    const nodes = [];
    let i = idx;
    while (i < template.length) {
      TOKEN_RE.lastIndex = i;
      const m = TOKEN_RE.exec(template);
      if (!m) {
        nodes.push({ type: 'text', value: template.slice(i) });
        return { nodes, next: template.length };
      }
      if (m.index > i) {
        nodes.push({ type: 'text', value: template.slice(i, m.index) });
      }
      const [, sectionKind, sectionName, tripleVar, doubleVar] = m;
      if (sectionKind) {
        if (sectionKind === '/') {
          if (stopTag && sectionName === stopTag) {
            return { nodes, next: m.index + m[0].length };
          }
          throw new Error(`Closing tag {{/${sectionName}}} without matching open`);
        }
        const inner = parseAt(m.index + m[0].length, sectionName);
        nodes.push({ type: sectionKind === '#' ? 'section' : 'inverted', name: sectionName, children: inner.nodes });
        i = inner.next;
      } else if (tripleVar) {
        nodes.push({ type: 'var_raw', name: tripleVar });
        i = m.index + m[0].length;
      } else if (doubleVar) {
        nodes.push({ type: 'var_esc', name: doubleVar });
        i = m.index + m[0].length;
      }
    }
    return { nodes, next: i };
  }
  return parseAt(0, null).nodes;
}

function lookup(name, stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i] && typeof stack[i] === 'object' && name in stack[i]) return stack[i][name];
  }
  return undefined;
}

function renderAst(nodes, stack) {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') out += node.value;
    else if (node.type === 'var_raw') {
      const v = lookup(node.name, stack);
      out += v == null ? '' : String(v);
    } else if (node.type === 'var_esc') {
      const v = lookup(node.name, stack);
      out += v == null ? '' : escapeHtml(v);
    } else if (node.type === 'section') {
      const v = lookup(node.name, stack);
      if (!v) continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          out += renderAst(node.children, [...stack, item && typeof item === 'object' ? item : {}]);
        }
      } else if (typeof v === 'object') {
        out += renderAst(node.children, [...stack, v]);
      } else {
        out += renderAst(node.children, stack);
      }
    } else if (node.type === 'inverted') {
      const v = lookup(node.name, stack);
      const falsy = !v || (Array.isArray(v) && v.length === 0);
      if (falsy) out += renderAst(node.children, stack);
    }
  }
  return out;
}

// ───── Build context (JSON → variables Mustache aplaties) ─────
function buildCtx(school) {
  const { identity, hero, fees, contact, classification, programme, pedagogy, clubs, gallery, video, campuses, faq, similar_schools, accreditations, services } = school;

  return {
    // SEO
    seo_title:       school.seo.title,
    seo_description: school.seo.description,
    og_title:        school.seo.og_title,
    og_description: school.seo.og_description,

    // Identité
    slug:                    school.slug,
    name_full:               identity.name_full,
    name_short:              identity.name_short,
    name_full_with_acronym:  identity.name_short ? `${identity.name_full} (${identity.name_short})` : identity.name_full,
    logo_url:                identity.logo_url || '',
    hero_logo_text:          hero.logo_text,
    hero_image_tag:          hero.image_tag,
    hero_image_url:          hero.image_url || '',
    hero_tagline_html:       hero.tagline_html,
    eyebrow_tier_text:       hero.eyebrow_text,
    founded_date_iso:        identity.founded_date_iso,
    official_website:        identity.official_website,
    official_website_label:  domainFromUrl(identity.official_website),
    email_main:              contact.email_main,
    email_admissions:        contact.email_admissions,

    // CTAs
    cta_primary_url:    hero.cta_primary.url,
    cta_primary_label:  hero.cta_primary.label,
    cta_secondary_url:    hero.cta_secondary.url,
    cta_secondary_label:  hero.cta_secondary.label,

    // Breadcrumb
    breadcrumb_city:      identity.city,
    breadcrumb_city_slug: identity.city_slug,

    // Tier flags
    tier_economique_active:   fees.tier_active === 'economique',
    tier_premium_active:      fees.tier_active === 'premium',
    tier_premium_plus_active: fees.tier_active === 'premium_plus',
    tier_ultra_active:        fees.tier_active === 'ultra',
    tier_intro_text:  fees.tier_intro_text,
    fees_detail_html: fees.details_html,
    fees_note:        fees.note,
    fees_cta_email:   fees.cta_email,

    // Distinction
    distinction_text: school.distinction_text || '',

    // Programme
    programme_cards: programme.cards.map(c => ({
      label: c.label,
      items: c.items.map(html => ({ html })),
    })),

    // Pédagogie
    facts: pedagogy.facts,

    // Hero tags
    hero_tags: hero.tags.map(t => ({
      icon_svg: HERO_ICONS[t.icon] || '',
      text: t.text,
    })),

    // Accréditations
    accreditations,

    // Services
    services: services.map(sv => ({
      icon_svg: SERVICE_ICONS[sv.icon_type] || '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
      name: sv.name,
      description: sv.description,
    })),

    // Clubs
    clubs_state_empty:  clubs.state === 'empty',
    clubs_state_filled: clubs.state === 'filled',
    clubs_description_html: clubs.description_html,
    clubs_cta_url:   clubs.cta ? clubs.cta.url   : '',
    clubs_cta_label: clubs.cta ? clubs.cta.label : '',
    clubs: clubs.cards.map(c => ({ label: c.label, items: c.items.map(html => ({ html })) })),

    // Galerie
    gallery_items: gallery.items,

    // Vidéo
    video_youtube_id:   video.youtube_id   || '',
    video_iframe_title: video.iframe_title || '',
    video_source:       video.source       || '',

    // Reviews placeholder
    review_public_links: true,
    facebook_url: contact.social.facebook || '',
    google_maps_url: '',

    // Contact
    map_lat: contact.map.lat,
    map_lng: contact.map.lng,
    map_title: contact.map.title,
    phone_main: contact.phone_main,
    phone_main_label: contact.phone_main_label,
    phone_main_tel: phoneToTel(contact.phone_main),
    phone_secondary: contact.phone_secondary || '',
    phone_secondary_tel: contact.phone_secondary ? phoneToTel(contact.phone_secondary) : '',
    office_hours: contact.office_hours || '',
    social_facebook:  contact.social.facebook  || '',
    social_instagram: contact.social.instagram || '',
    social_linkedin:  contact.social.linkedin  || '',
    social_youtube:   contact.social.youtube   || '',

    // Campuses (avec isLast pour JSON-LD)
    campuses: campuses.map((c, i) => ({
      campus_name: c.name,
      street: c.street,
      postal_code: c.postal_code,
      locality: c.locality,
      region: c.region || '',
      country_code: c.country_code,
      isLast: i === campuses.length - 1,
    })),

    // FAQ
    faq_items: faq,

    // Similaires (tier humain)
    similar_schools: similar_schools.map(s => ({
      ...s,
      tier: TIER_LABELS[s.tier] || s.tier,
    })),

    // JSON-LD
    alternate_names_json: identity.alternate_names.map(x => `"${x}"`).join(', '),
    telephones_json: [
      `"${phoneToTel(contact.phone_main)}"`,
      ...(contact.phone_secondary ? [`"${phoneToTel(contact.phone_secondary)}"`] : []),
    ].join(', '),
    same_as_json: [
      contact.social.facebook,
      contact.social.instagram,
      contact.social.linkedin,
      contact.social.youtube,
      contact.social.wikipedia,
    ].filter(Boolean).map(u => `"${u}"`).join(', '),
  };
}

// ───── Mappings curriculum_types[] → label lisible ────────────
// Priorité de display : ce qui doit apparaître comme la "ligne curriculum" sur les cards.
const CURRICULUM_DISPLAY_LABELS = {
  british:     'Britannique',
  ib:          'IB',
  french_aefe: 'Français',
  french:      'Français',
  quebec:      'Québécois',
  american:    'Américain',
  bilingual:   'Bilingue',
  tunisian:    'Tunisien',
};

// Ordre de priorité pour pickerla "curriculum principale" affichée (au cas où plusieurs)
const CURRICULUM_DISPLAY_PRIORITY = [
  'british', 'ib', 'french_aefe', 'french', 'quebec', 'american', 'bilingual', 'tunisian',
];

function pickPrimaryCurriculum(types) {
  if (!Array.isArray(types) || types.length === 0) return '';
  for (const p of CURRICULUM_DISPLAY_PRIORITY) {
    if (types.includes(p)) return CURRICULUM_DISPLAY_LABELS[p] || p;
  }
  // fallback : mapper le premier
  return CURRICULUM_DISPLAY_LABELS[types[0]] || types[0];
}

// ───── Calcul des niveaux scolaires depuis age_min/age_max ────
// Les 4 pages legacy attendent l'array `levels: ["maternelle","primaire","college","lycee"]`
function ageRangeToLevels(ageMin, ageMax) {
  const lv = [];
  if (ageMin <= 5  && ageMax >= 3)  lv.push('maternelle');
  if (ageMin <= 11 && ageMax >= 6)  lv.push('primaire');
  if (ageMin <= 15 && ageMax >= 12) lv.push('college');
  if (ageMin <= 18 && ageMax >= 16) lv.push('lycee');
  return lv;
}

// ───── Langues : codes ISO 639-1 → labels FR ──────────────────
// Source de vérité = classification.languages (enum fermé, validé schéma).
// L'ancien parsing free-text de programme.cards est abandonné dans l'agrégat
// (les cartes restent du contenu éditorial rendu sur la fiche, non agrégé).
const LANGUAGE_LABELS = {
  ar: 'Arabe', en: 'Anglais', fr: 'Français', de: 'Allemand',
  es: 'Espagnol', it: 'Italien', tr: 'Turc', pt: 'Portugais',
  zh: 'Chinois', ru: 'Russe',
};
// Codes ordonnés (langue principale en premier).
function extractLanguageCodes(school) {
  const codes = school.classification?.languages;
  return Array.isArray(codes) ? codes : [];
}
// Labels FR ordonnés, pour les surfaces qui affichent du texte (/ecoles/).
function extractLangues(school) {
  return extractLanguageCodes(school).map(c => LANGUAGE_LABELS[c] || c);
}

// ───── Extraction gouvernorat officiel ────────────────────────
// Source de vérité = identity.gov (enum fermé des 24 gouvernorats,
// validé par le schéma). Fallbacks legacy conservés par sécurité.
function extractGov(school) {
  // Priorité 1 : gouvernorat officiel (identity.gov, liste fermée)
  if (school.identity?.gov) return school.identity.gov;
  // Priorité 2 (legacy) : region du campus principal
  const campus = (school.campuses && school.campuses[0]) || {};
  if (campus.region) return campus.region;
  // Priorité 3 : city
  return school.identity?.city || '';
}

// ───── Index agrégé (enrichi pour catalogue/quiz/comparateur) ──
// CONTRAT des champs exposés dans public/data/schools.json
// (consommé par /, /ecoles/, /comparer/, /quiz/) :
//   slug, name, city, gov, country_code, curriculum_types[],
//   languages[] (codes ISO), langues[] (labels FR), levels[],
//   age_min, age_max, tier, verified, accreditations[] ({short,name}),
//   logo_url, lat, lng.
// `gov` provient de identity.gov (enum fermé). `languages`/`langues`
// proviennent de classification.languages (enum fermé). Champs structurés,
// data-driven, sûrs pour le multi-pays.
// Aucun champ de notation/classement (rating, grade, reviews, students,
// ratio, fees, ranking) ne doit jamais apparaître ici. `tier` est une
// donnée de positionnement tarifaire, volontairement NON affichée comme
// critère comparatif (lecture « classement » à éviter côté comparateur).
function buildIndexEntry(school) {
  const ageMin = school.classification.age_min;
  const ageMax = school.classification.age_max;
  const verified = school.classification.verified;
  const curriculumTypes = school.classification.curriculum_types || [];

  return {
    // ── Schéma natif ──────────────────────────────────────────
    slug: school.slug,
    name_full: school.identity.name_full,
    name_short: school.identity.name_short,
    city: school.identity.city,
    city_slug: school.identity.city_slug,
    country_code: school.identity.country_code,
    tier: school.classification.tier,
    verified,
    curriculum_types: curriculumTypes,
    age_min: ageMin,
    age_max: ageMax,
    hero_logo_text: school.hero.logo_text,
    eyebrow_text: school.hero.eyebrow_text,
    logo_url: school.identity.logo_url || null,
    url: `/${school.slug}/`,

    // ── Alias pour pages legacy (/, /ecoles/, /comparer/, /quiz/) ──
    name:          school.identity.name_full,
    gov:           extractGov(school),
    curriculum:    pickPrimaryCurriculum(curriculumTypes),
    languages:     extractLanguageCodes(school),
    langues:       extractLangues(school),
    levels:        ageRangeToLevels(ageMin, ageMax),
    verification:  verified ? '✅' : '',
    founded:       (school.identity.founded_date_iso || '').slice(0, 4),

    // ── Accréditations (version légère : libellés courts pour le comparateur) ──
    accreditations: (school.accreditations || []).map(a => ({ short: a.short, name: a.name })),

    // ── Coords pour le comparateur (haversine distance) ───────
    lat: school.contact?.map?.lat ?? null,
    lng: school.contact?.map?.lng ?? null,
  };
}

function buildSitemap(schools) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `${PATHS.siteUrl}/`,
    `${PATHS.siteUrl}/ecoles/`,
    `${PATHS.siteUrl}/comparer/`,
    `${PATHS.siteUrl}/quiz/`,
    `${PATHS.siteUrl}/a-propos/`,
    `${PATHS.siteUrl}/blog/`,
    `${PATHS.siteUrl}/contact/`,
    `${PATHS.siteUrl}/mentions-legales/`,
    `${PATHS.siteUrl}/confidentialite/`,
    `${PATHS.siteUrl}/cgu/`,
    ...schools.map(s => `${PATHS.siteUrl}/${s.slug}/`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.endsWith('/ecoles/') ? 'weekly' : 'monthly'}</changefreq>
  </url>`).join('\n')}
</urlset>
`;
  return xml;
}

// ───── Main ───────────────────────────────────────────────────
async function main() {
  log('🏗️  School Select — Build pipeline');
  log('─'.repeat(60));

  // 1. Load schema + template
  if (!fs.existsSync(PATHS.schemaFile)) {
    console.error(`❌ Schema introuvable : ${PATHS.schemaFile}`);
    process.exit(1);
  }
  if (!fs.existsSync(PATHS.templateFile)) {
    console.error(`❌ Template introuvable : ${PATHS.templateFile}`);
    process.exit(1);
  }
  const schema = JSON.parse(fs.readFileSync(PATHS.schemaFile, 'utf8'));
  const template = fs.readFileSync(PATHS.templateFile, 'utf8');
  log(`✓ Schema chargé (${(JSON.stringify(schema).length / 1024).toFixed(1)} KB)`);
  log(`✓ Template chargé (${(template.length / 1024).toFixed(1)} KB)`);

  // 2. Setup Ajv (validation runtime)
  let validate;
  try {
    const Ajv = (await import('ajv/dist/2020.js')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    validate = ajv.compile(schema);
    log('✓ Ajv configuré');
  } catch (err) {
    console.error('❌ Ajv non installé. Lancer : npm install --save-dev ajv ajv-formats');
    console.error('   (Le build continue sans validation runtime)');
    validate = () => true;
  }

  // 3. Parse template (1 fois)
  log('✓ Template parsé');
  const ast = parseTemplate(template);

  // 4. Load all schools
  if (!fs.existsSync(PATHS.schoolsDir)) {
    console.error(`❌ Dossier introuvable : ${PATHS.schoolsDir}`);
    process.exit(1);
  }
  let files = fs.readdirSync(PATHS.schoolsDir).filter(f => f.endsWith('.json'));
  if (flags.school) {
    const q = flags.school.toLowerCase();
    files = files.filter(f => {
      if (f.toLowerCase().includes(q)) return true;
      try {
        const s = JSON.parse(fs.readFileSync(path.join(PATHS.schoolsDir, f), 'utf8'));
        return (s.slug || '').toLowerCase().includes(q)
            || (s.identity?.name_short || '').toLowerCase().includes(q)
            || (s.identity?.name_full  || '').toLowerCase().includes(q);
      } catch { return false; }
    });
    if (files.length === 0) {
      console.error(`❌ Aucun fichier ne matche --school=${flags.school}`);
      process.exit(1);
    }
  }
  log(`✓ ${files.length} école(s) à traiter`);
  log('');

  // 5. Process each school
  const schools = [];
  const indexEntries = [];
  const errors = [];
  let successCount = 0;

  for (const filename of files.sort()) {
    const filepath = path.join(PATHS.schoolsDir, filename);
    let school;
    try {
      school = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (err) {
      errors.push({ filename, stage: 'parse', message: err.message });
      log(`✗ ${filename}  parse: ${err.message}`);
      continue;
    }

    // Validation
    const valid = validate(school);
    if (!valid) {
      const errs = (validate.errors || []).slice(0, 5).map(e => `${e.instancePath} ${e.message}`);
      errors.push({ filename, stage: 'validation', message: errs.join(' | ') });
      log(`✗ ${filename}  validation FAILED:`);
      for (const e of errs) log(`     ${e}`);
      continue;
    }

    if (flags.validateOnly) {
      successCount++;
      log(`✓ ${filename}  validation OK`);
      continue;
    }

    // Render
    let html;
    try {
      const ctx = buildCtx(school);
      html = renderAst(ast, [ctx]);
    } catch (err) {
      errors.push({ filename, stage: 'render', message: err.message });
      log(`✗ ${filename}  render: ${err.message}`);
      continue;
    }

    // Write fiche HTML
    const outDir = path.join(PATHS.publicDir, school.slug);
    const outFile = path.join(outDir, 'index.html');
    if (!flags.dry) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outFile, html, 'utf8');
    }

    schools.push(school);
    indexEntries.push(buildIndexEntry(school));
    successCount++;
    log(`✓ ${school.slug}  ${(html.length / 1024).toFixed(1)} KB  →  public/${school.slug}/index.html`);
  }

  log('');
  log('─'.repeat(60));

  // 6. Index agrégé schools.json
  //    Format : Array direct à la racine (compat pages legacy /, /ecoles/, /comparer/, /quiz/).
  //    La metadata (generated_at, version, total) part dans un fichier séparé.
  if (!flags.dry && successCount > 0) {
    fs.mkdirSync(PATHS.publicDataDir, { recursive: true });
    fs.writeFileSync(PATHS.indexFile, JSON.stringify(indexEntries, null, 2), 'utf8');
    log(`✓ Index agrégé  →  public/data/schools.json (${indexEntries.length} école${indexEntries.length > 1 ? 's' : ''})`);

    // Metadata séparée (pour debug/admin, non consommée par les pages publiques)
    const metaFile = path.join(PATHS.publicDataDir, 'schools.meta.json');
    fs.writeFileSync(metaFile, JSON.stringify({
      generated_at: new Date().toISOString(),
      version_index: '1.0.0',
      total: indexEntries.length,
    }, null, 2), 'utf8');
    log(`✓ Metadata       →  public/data/schools.meta.json`);
  }

  // 7. Sitemap
  if (!flags.dry && successCount > 0) {
    const xml = buildSitemap(schools);
    fs.writeFileSync(PATHS.sitemapFile, xml, 'utf8');
    log(`✓ Sitemap        →  public/sitemap.xml (${10 + schools.length} URLs)`);
  }

  // 8. Summary
  log('');
  if (errors.length === 0) {
    if (flags.validateOnly) {
      log(`✅ Validation terminée · ${successCount} fiche${successCount > 1 ? 's' : ''} valide${successCount > 1 ? 's' : ''} (aucun rendu)`);
    } else {
      log(`✅ Build terminé · ${successCount} fiche${successCount > 1 ? 's' : ''} générée${successCount > 1 ? 's' : ''}${flags.dry ? ' (DRY RUN, rien écrit)' : ''}`);
    }
  } else {
    log(`⚠️  Build avec erreurs · ${successCount} OK, ${errors.length} échec(s)`);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('💥 Erreur fatale :', err);
  process.exit(1);
});
