// Headless checks for the succession layer, the wider asset coverage, the live lookups and the assistant.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const errors = [];
const fetched = [];
const sampled = [];

const FIXTURES = {
  'https://ifsc.razorpay.com/SBIN0000300': { BANK: 'State Bank of India', BRANCH: 'MUMBAI MAIN', ADDRESS: 'MUMBAI', CITY: 'GREATER BOMBAY', STATE: 'MAHARASHTRA', IFSC: 'SBIN0000300', MICR: '400002010', CONTACT: '' },
  'https://api.postalpincode.in/pincode/440010': [{ Status: 'Success', PostOffice: [
    { Name: 'Dharampeth', BranchType: 'Sub Post Office', District: 'Nagpur', Division: 'Nagpur City', State: 'Maharashtra' },
    { Name: 'Nagpur GPO', BranchType: 'Head Post Office', District: 'Nagpur', Division: 'Nagpur City', State: 'Maharashtra' }] }],
  'https://api.mfapi.in/mf/search?q=nippon%20small': [{ schemeCode: 113177, schemeName: 'Nippon India Small Cap Fund - Regular Plan - Growth Option' }]
};

const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/',
  beforeParse(w) {
    const sample = async (msgs, opts) => { sampled.push(msgs); const t = 'File Form 10D first. [mock answer]'; opts && opts.onText && opts.onText({ text: t, delta: t }); return { text: t, truncated: false }; };
    w.claude = { use: async n => n === 'sample' ? sample : null };
    w.fetch = async url => {
      fetched.push(url);
      if (FIXTURES[url]) return { ok: true, status: 200, json: async () => FIXTURES[url] };
      return { ok: false, status: 404, json: async () => ({}) };
    };
    w.addEventListener('error', e => errors.push('window error: ' + e.message));
  }
});
const { window } = dom; const doc = window.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => doc.querySelector(s); const $$ = s => [...doc.querySelectorAll(s)];
const click = e => { const x = typeof e === 'string' ? $(e) : e; if (!x) throw new Error('no element ' + e); x.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); };
const change = (sel, v) => { const x = $(sel); x.value = v; x.dispatchEvent(new window.Event('change', { bubbles: true })); };
const text = () => ($('.content') || doc.body).textContent.replace(/\s+/g, ' ');
const results = [];
const check = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (cond ? '' : '  <- ' + extra)); };

(async () => {
  await wait(300);
  const W = window;

  // ---------- heir arithmetic (pure) ----------
  const fam = [{ id: 's', rel: 'Spouse' }, { id: 'a', rel: 'Son' }, { id: 'b', rel: 'Daughter' }];
  const sh = (law, g, ppl) => Object.fromEntries(W.eval('heirShares')(law, g, ppl).map(p => [p.id, Math.round(p.share * 1000) / 1000]));
  let r = sh('hindu', 'male', fam);
  check('H1 Hindu male: spouse, son, daughter equal thirds', r.s === 0.333 && r.a === 0.333 && r.b === 0.333, JSON.stringify(r));
  r = sh('hindu', 'male', [...fam, { id: 'm', rel: 'Mother' }, { id: 'f', rel: 'Father' }]);
  check('H2 Hindu male: mother is Class I, father is not', r.m === 0.25 && r.f === 0, JSON.stringify(r));
  r = sh('hindu', 'female', [...fam, { id: 'm', rel: 'Mother' }]);
  check('H3 Hindu female: spouse and children first', r.s === 0.333 && r.m === 0, JSON.stringify(r));
  r = sh('christian', 'male', fam);
  check('H4 Indian Succession Act: spouse one-third, children share the rest', r.s === 0.333 && r.a === 0.333 && r.b === 0.333, JSON.stringify(r));
  r = sh('christian', 'male', [{ id: 's', rel: 'Spouse' }, { id: 'a', rel: 'Son' }, { id: 'c', rel: 'Son' }]);
  check('H5 ISA with two children: 1/3 + 1/3 + 1/3', r.s === 0.333 && r.a === 0.333, JSON.stringify(r));
  r = sh('muslim', 'male', fam);
  check('H6 Muslim: wife one-eighth, son twice daughter', r.s === 0.125 && Math.abs(r.a - 2 * r.b) < 0.002, JSON.stringify(r));
  r = sh('parsi', 'male', [...fam, { id: 'm', rel: 'Mother' }]);
  check('H7 Parsi: parent gets half a child share', Math.abs(r.m - r.a / 2) < 0.002, JSON.stringify(r));
  const tot = Object.values(sh('muslim', 'female', [...fam, { id: 'm', rel: 'Mother' }, { id: 'f', rel: 'Father' }])).reduce((a, b) => a + b, 0);
  check('H8 shares always sum to one', Math.abs(tot - 1) < 0.002, tot);
  r = sh('hindu', 'male', [{ id: 'x', rel: 'Friend' }]);
  check('H9 a friend is never an intestate heir', r.x === 0, JSON.stringify(r));

  // ---------- registry: succession layer ----------
  click('[data-j="registry"]'); await wait(60);
  click('[data-act="seed"]'); await wait(100);
  check('S1 no-will gap raised, naming the property', text().includes('You have no signed will') && text().includes('Flat 4B, Dharampeth'));
  check('S2 nominee/heir conflict gap raised', /holding(s go| goes) to a nominee who is not your only heir/.test(text()), text().slice(0, 400));
  check('S3 commonly forgotten card lists EDLI', text().includes('Commonly forgotten') && text().includes('EDLI insurance'));
  check('S4 EPF without EDLI flagged', text().includes('Your EPF carries a pension and insurance you have not recorded'));
  const pctBefore = parseInt($('.ring .num b').textContent, 10);

  click('[data-v="r-family"]'); await wait(80);
  check('S5 family view renders the tree', $$('.tree .node').length === 4, 'nodes ' + $$('.tree .node').length);
  check('S6 holder is the root node', $('.node.me') && $('.node.me').textContent.includes('Ramesh Kumar Sharma'));
  check('S7 heirs shown with equal shares', $$('.node.heir').length === 3 && text().includes('33.3%'));
  check('S8 Zerodha conflict explained', text().includes('Zerodha → Arjun Sharma') && text().includes('can claim the rest'));
  check('S9 property listed as needing a will', text().includes('What only a will can move') && text().includes('Not covered'));
  check('S10 Supreme Court ruling cited', text().includes('Shakti Yezdani'));
  check('S10b spouse on a life policy is a beneficial nominee, not a conflict', !text().includes('LIC of India → Sunita') && !text().includes('EPFO (eps-95 family pension) → Sunita'));
  check('S10c conflicts counted correctly (HDFC and Zerodha)', W.eval('conflicts()').length === 2, W.eval('conflicts()').map(c => c.asset.inst).join(','));

  change('#sc-law', 'muslim'); await wait(80);
  check('S11 switching law recomputes shares', text().includes('12.5%') && text().includes('one-third of the estate'));
  change('#sc-law', 'hindu'); await wait(60);

  change('#sc-will', 'registered'); await wait(80);
  check('S12 a will clears the conflicts', text().includes('Your will decides who keeps each holding'));
  check('S13 property now covered', text().includes('Covered by your will'));
  click('[data-v="r-home"]'); await wait(80);
  check('S14 no-will gap gone', !text().includes('You have no signed will'));
  const pctAfter = parseInt($('.ring .num b').textContent, 10);
  check('S15 readiness rises with a will', pctAfter > pctBefore, pctBefore + ' -> ' + pctAfter);

  // add a forgotten holding straight from the chip
  click('[data-add-type="edli"]'); await wait(60);
  check('S16 chip opens the form on that type', $('#f-type') && $('#f-type').value === 'edli');
  check('S17 nominee picker offered', $$('#f-nomp option').length === 4);
  click('[data-save="asset"]'); await wait(80);
  check('S18 EDLI added and gap updates', text().includes('11 holdings recorded') && !text().includes('Your EPF carries'));

  // holdings: will-type and debt chips; IFSC lookup in the form
  click('[data-v="r-assets"]'); await wait(60);
  check('S19 property shows will status, not nomination', text().includes('Covered by your will'));
  click('[data-act="add-asset"]'); await wait(60);
  $('#f-ifsc').value = 'sbin0000300';
  click('[data-ifsc-asset]'); await wait(80);
  check('S20 IFSC lookup fills bank and branch', $('#f-inst').value === 'State Bank of India' && $('#f-ref').value.includes('MUMBAI MAIN'), $('#f-ref').value);
  change('#f-type', 'loan'); await wait(30);
  check('S21 liability hint shown for loans', $('#f-via').textContent.includes('not personally liable'));
  check('S22 IFSC hidden for non-bank types', $('#f-ifsc-wrap').style.display === 'none');
  click('[data-close-btn]'); await wait(40);

  // ---------- recovery: wider leads, routes, escalation, live, ask ----------
  click('[data-go="chooser"]'); await wait(60);
  click('[data-j="recovery"]'); await wait(60);
  click('[data-act="start-q"]'); await wait(60);
  const answers = { 0: 'Test Person', 4: 'Coal India' };
  for (let i = 0; i < 16; i++) {
    if ($('#qin')) { $('#qin').value = answers[i] || ''; click('[data-act="q-next"]'); }
    else {
      const want = { 3: 'Yes', 5: 'Central or state government', 11: 'Yes, a bank locker', 12: 'Ancestral, never transferred', 13: 'Yes', 14: 'Yes' }[i];
      const b = $$('[data-opt]').find(x => x.dataset.opt === want) || $('[data-act="q-skip"]'); click(b);
    }
    await wait(30);
  }
  await wait(80);
  const T = text();
  check('V1 EPS family pension lead', T.includes('EPS-95 family pension') && T.includes('Form 10D'));
  check('V2 EDLI lead', T.includes('EDLI insurance') && T.includes('Form 5IF'));
  check('V3 government family pension lead', T.includes('Family pension'));
  check('V4 NPS lead for government staff', T.includes('NPS account'));
  check('V5 locker, ancestral property, vehicle, loans', ['Bank locker', 'Ancestral property', 'Vehicle', 'Loans and credit cards'].every(x => T.includes(x)));
  check('V6 Common Landing Portal lead', T.includes('Common Landing Portal'));
  check('V7 tax trace still ranked first', $$('.lead-card')[0].textContent.includes('Tax records'));

  click($$('[data-route="property"]')[0]); await wait(60);
  check('V8 claim route modal shows mutation and probate', $('#modal').textContent.includes('Mutation application') && $('#modal').textContent.includes('Probate'));
  click('[data-close-btn]'); await wait(30);

  // case file uses per-asset documents
  const sel = $$('[data-st]').find(s => s.closest('.lead-card').textContent.includes('Ancestral property'));
  sel.value = 'found'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  click('[data-v="v-case"]'); await wait(60);
  check('V9 claim pack lists the will and title deed for property', text().includes('Will, or probate where required') && text().includes('Title deed'));
  check('V10 RBI 2025 rule quoted', text().includes('15 days of a complete claim'));

  click('[data-v="v-guides"]'); await wait(60);
  click('[data-gt="escalate"]'); await wait(60);
  check('V11 escalation routes listed', ['RBI Integrated Ombudsman', 'SEBI SCORES', 'EPFiGMS', 'CPGRAMS'].every(x => text().includes(x)));
  check('V12 escalation links are https', $$('.content a[target="_blank"]').every(a => a.href.startsWith('https://')));

  click('[data-gt="portals"]'); await wait(60);
  check('V13 new portals listed', ['Common Landing Portal', 'NPS CRA', 'State land records', 'Parivahan'].every(x => text().includes(x)));

  click('[data-gt="live"]'); await wait(60);
  $('#lv-ifsc').value = 'SBIN0000300'; click('[data-live="ifsc"]'); await wait(80);
  check('L1 live IFSC result rendered', text().includes('MUMBAI MAIN') && text().includes('400002010'));
  const leadsBefore = W.eval('S').leads.length;
  click('[data-live-add]'); await wait(60);
  check('L2 branch can be added to the plan', W.eval('S').leads.length === leadsBefore + 1);
  $('#lv-ifsc').value = 'BAD'; click('[data-live="ifsc"]'); await wait(60);
  check('L3 malformed IFSC rejected without a network call', text().includes('11 characters') && !fetched.includes('https://ifsc.razorpay.com/BAD'));
  $('#lv-ifsc').value = 'ABCD0123456'; click('[data-live="ifsc"]'); await wait(80);
  check('L4 unknown IFSC handled', text().includes('No branch has that IFSC'));
  $('#lv-pin').value = '440010'; click('[data-live="pin"]'); await wait(80);
  check('L5 PIN gives head post office and land portal', text().includes('Nagpur GPO') && text().includes('Mahabhumi'));
  $('#lv-mf').value = 'nippon small'; click('[data-live="mf"]'); await wait(80);
  check('L6 MF search names the registrar', text().includes('Nippon India Small Cap') && text().includes('KFintech'));

  click('[data-v="v-ask"]'); await wait(60);
  check('A1 assistant view renders with suggestions', text().includes('Ask Amanat') && $$('[data-ask]').length === 4);
  click($$('[data-ask]')[0]); await wait(120);
  check('A2 answer streamed into the chat', text().includes('File Form 10D first'));
  const sent = JSON.stringify(sampled[0] || []);
  check('A3 prompt is grounded in the case', sent.includes('Test Person') && sent.includes('Form 10D') && sent.includes('EPFiGMS'));

  check('E1 no runtime errors', errors.length === 0, errors.join(' | '));
  const failed = results.filter(r => !r.pass);
  console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
  if (failed.length) process.exit(1);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
