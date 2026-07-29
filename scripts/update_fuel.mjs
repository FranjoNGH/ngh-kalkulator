// Dohvaća cijenu Petrol EURODIZEL AD B7 (Min) s HAK-a (hak.hr, izvor: Ministarstvo/mzoe-gor.hr),
// računa neto = Min / 1,25 (PDV) - 0,08 (popust) i zapisuje u data/fuel-price.json.
// Pokreće ga GitHub Action jednom dnevno.
import { writeFileSync } from 'node:fs';

const URL_SRC  = 'https://www.hak.hr/info/cijene-goriva';
const PRODUCT  = 'EURODIZEL AD B7';   // Petrol standardni dizel
const VAT      = 1.25;   // PDV 25%
const DISCOUNT = 0.08;   // komercijalni popust EUR/l

const res = await fetch(URL_SRC, { headers: { 'User-Agent': 'Mozilla/5.0 NGH-Beton-Kalkulator' } });
if (!res.ok) { console.error('Greška HTTP', res.status); process.exit(1); }

const html = await res.text();
const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

const idx = text.indexOf(PRODUCT);
if (idx === -1) { console.error('Proizvod nije pronađen na stranici:', PRODUCT); process.exit(1); }

// Prva cijena (xx,xx €) nakon naziva proizvoda = "Min."
const after = text.slice(idx, idx + 400);
const m = after.match(/(\d+),(\d+)\s*€/);
if (!m) { console.error('Min cijena nije pronađena u sekciji proizvoda.'); process.exit(1); }

const grossMin = parseFloat(m[1] + '.' + m[2]);
const price = Math.round((grossMin / VAT - DISCOUNT) * 1000) / 1000;

const nowZg = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
const date = `${nowZg.getDate()}.${nowZg.getMonth() + 1}.${nowZg.getFullYear()}`;

const out = {
  price,
  grossMin,
  date,
  source: 'Petrol ' + PRODUCT + ' (Min)',
  updated: new Date().toISOString()
};

writeFileSync('data/fuel-price.json', JSON.stringify(out, null, 2) + '\n');
console.log('Zapisano:', out);
