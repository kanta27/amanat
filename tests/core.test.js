// Headless exercise of the Amanat prototype: drives the real UI the way a user would.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(require('path').join(__dirname,'..','index.html'), 'utf8');
const errors = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://example.test/',
  beforeParse(w) {
    // the artifact runtime: absent here, so the page must cope with claude.use -> null
    w.claude = { use: async () => null };
    w.navigator.clipboard = { writeText: async () => {} };
    w.addEventListener('error', e => errors.push('window error: ' + e.message));
  }
});
const { window } = dom;
const doc = window.document;

const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => doc.querySelector(s);
const $$ = s => [...doc.querySelectorAll(s)];
const click = elOrSel => {
  const e = typeof elOrSel === 'string' ? $(elOrSel) : elOrSel;
  if (!e) throw new Error('no element for ' + elOrSel);
  e.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
const text = () => doc.body.textContent.replace(/\s+/g, ' ');

const results = [];
const check = (name, cond, extra='') => {
  results.push({ name, pass: !!cond, extra });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (cond ? '' : '  <- ' + extra));
};

(async () => {
  await wait(300);

  // ---------- chooser ----------
  check('C1 chooser renders both journeys', $$('[data-j]').length === 2);
  check('C2 headline present', text().includes('because nobody knew it existed'));
  check('C3 device toggle present', $$('[data-dev]').length === 2);

  // ---------- device toggle ----------
  click('[data-dev="mobile"]'); await wait(60);
  check('C4 mobile frame applies', $('#root').className === 'm' && !!$('.stage.mobile'));
  click('[data-dev="desktop"]'); await wait(60);
  check('C5 back to web', $('#root').className === '');

  // ================= REGISTRY =================
  click('[data-j="registry"]'); await wait(80);
  check('R1 registry opens empty', text().includes('Your registry is empty'));

  click('[data-act="seed"]'); await wait(120);
  check('R2 sample registry loads', text().includes('10 holdings recorded'), text().slice(0,160));

  // readiness must be a real number, not NaN
  const ringNum = $('.ring .num b');
  const pct = ringNum ? parseInt(ringNum.textContent, 10) : NaN;
  check('R3 readiness score computes', Number.isFinite(pct) && pct > 0 && pct < 100, 'got ' + (ringNum && ringNum.textContent));

  // gaps surfaced
  check('R4 gaps are surfaced', text().includes('What is missing'));
  const gapBtns = $$('[data-gap]');
  check('R5 gap rows have fix buttons', gapBtns.length > 0, 'count ' + gapBtns.length);

  // gap fix navigates
  click(gapBtns[0]); await wait(80);
  check('R6 fix button navigates', text().includes('Holdings') || text().includes('Safeguards'));

  // holdings list
  click('[data-v="r-assets"]'); await wait(80);
  check('R7 holdings list renders', $$('[data-link]').length === 10, 'links ' + $$('[data-link]').length);
  check('R8 nomination status shown', text().includes('No nomination registered'));
  check('R9 no balances anywhere', !/₹\s?\d/.test($('.content').textContent), 'found a rupee amount');

  // add a holding through the real modal
  click('[data-act="add-asset"]'); await wait(60);
  check('R10 add-holding sheet opens', !!$('#f-type'));
  $('#f-type').value = 'insurance';
  $('#f-type').dispatchEvent(new window.Event('change', { bubbles: true }));
  await wait(40);
  check('R11 institution list follows type', $('#f-inst').textContent.includes('LIC of India'));
  $('#f-ref').value = 'TEST-001';
  $('#f-nom').value = 'no';
  click('[data-save="asset"]'); await wait(100);
  check('R12 holding added', text().includes('TEST-001'));

  // designate it
  const links = $$('[data-link]');
  click(links[links.length - 1]); await wait(60);
  check('R13 designate sheet opens', $$('[data-lk]').length === 3, 'people ' + $$('[data-lk]').length);
  const cb = $$('[data-lk]')[0];
  cb.checked = true;
  $(`[data-sc="${cb.dataset.lk}"]`).value = 'Existence only';
  click('[data-save="link"]'); await wait(100);
  check('R14 designation saved with scope', text().includes('Existence only'));

  // people
  click('[data-v="r-family"]'); await wait(80);
  check('R15 people list renders', text().includes('Sunita Sharma') && text().includes('Arjun Sharma'));
  check('R16 reporter flag shows', text().includes('Can report a death'));

  // safeguards
  click('[data-v="r-safeguards"]'); await wait(80);
  check('R17 safeguards render', text().includes('Who may report your death'));
  check('R18 reporter count correct', text().includes('2 of 2 set'));
  check('R19 audit log has entries', $$('[data-v="r-safeguards"]').length > 0 && text().includes('Sample registry loaded'));

  // toggle a reporter off -> count drops
  const rep = $$('[data-rep]')[0];
  rep.checked = false;
  rep.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(100);
  check('R20 reporter toggle updates count', text().includes('1 of 2 set'));
  const rep2 = $$('[data-rep]')[0];
  rep2.checked = true; rep2.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(100);

  // death simulation
  click('[data-v="r-home"]'); await wait(80);
  click('[data-act="sim"]'); await wait(100);
  check('R21 waiting period starts', text().includes('Waiting period running'));
  check('R22 two reports shown', text().includes('2/2 reports'));
  click('[data-act="release"]'); await wait(100);
  check('R23 disclosure releases', text().includes('Disclosure released'));
  click('[data-act="inbox"]'); await wait(100);
  check('R24 nominee view renders', text().includes('sees') && text().includes('of 11 holdings'), text().match(/sees \d+ of \d+ holdings/)?.[0]);
  check('R25 scope respected in nominee view', text().includes('Existence only'));
  check('R26 claim route differs by nomination', text().includes('needs a legal heir certificate') && text().includes('short claim route'));

  // ================= RECOVERY =================
  click('[data-go="chooser"]'); await wait(80);
  click('[data-j="recovery"]'); await wait(80);
  check('V1 recovery entry renders', text().includes('Find what was left behind'));

  // interview
  click('[data-act="start-q"]'); await wait(80);
  check('V2 interview starts at q1', text().includes('Question 1 of 16'));
  $('#qin').value = 'Ramesh Kumar Sharma';
  click('[data-act="q-next"]'); await wait(80);
  check('V3 advances to q2', text().includes('Question 2 of 16'));
  check('V4 choice options render', $$('[data-opt]').length === 6, 'opts ' + $$('[data-opt]').length);
  click($$('[data-opt]')[1]); await wait(80);
  check('V5 choice advances', text().includes('Question 3 of 16'));
  click('[data-act="q-back"]'); await wait(80);
  check('V6 back works', text().includes('Question 2 of 16'));

  // bail out of the interview and load the sample case instead
  click('[data-v="v-plan"]'); await wait(80);
  click('[data-act="seed-r"]'); await wait(120);
  check('V7 sample case loads a plan', text().includes('Search plan') && text().includes('For Ramesh Kumar Sharma'));

  const leadCards = $$('.lead-card');
  check('V8 leads generated', leadCards.length >= 10, 'leads ' + leadCards.length);
  check('V9 tax trace ranked top', leadCards[0] && leadCards[0].textContent.includes('Tax records'), leadCards[0] && leadCards[0].textContent.slice(0,70));
  check('V10 leads carry strength', text().includes('Strong lead'));
  check('V11 employer leads split out', text().includes('Bharat Heavy Electricals'));
  check('V12 city lead present', text().includes('Nagpur, Pune'));

  // pipeline filter
  const pipe = $$('[data-f]');
  check('V13 pipeline has 6 stages', pipe.length === 6);
  click('[data-f="found"]'); await wait(80);
  check('V14 filter narrows list', $$('.lead-card').length < leadCards.length, 'now ' + $$('.lead-card').length);
  click('[data-f="all"]'); await wait(80);

  // status change
  const sel = $$('[data-st]')[0];
  sel.value = 'filed';
  sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(100);
  check('V15 status change persists', text().includes('Claim filed'));

  // reference modal
  click($$('[data-ref]')[0]); await wait(60);
  check('V16 reference sheet opens', !!$('#t-val'));
  $('#t-val').value = 'UDRN-99887766';
  click('[data-save="ref"]'); await wait(100);
  check('V17 reference saved', text().includes('UDRN-99887766'));

  // guides
  click('[data-v="v-guides"]'); await wait(80);
  check('V18 tax guide is default', text().includes('Reconstruct their holdings from tax records'));
  check('V19 representative assessee steps present', text().includes('Register as Representative Assessee'));
  check('V20 limits of the route stated', text().includes('What this route will not do'));

  click('[data-act="add-trace"]'); await wait(60);
  $('#tr-name').value = 'Bank of Baroda';
  $('#tr-kind').value = 'Dividend paid — implies a shareholding';
  click('[data-save="trace"]'); await wait(120);
  check('V21 AIS entry creates a lead', text().includes('Bank of Baroda'));

  click('[data-gt="evidence"]'); await wait(80);
  check('V22 evidence kit renders', text().includes('Search terms for their email'));
  check('V23 copy chips present', $$('[data-copy]').length >= 10, 'chips ' + $$('[data-copy]').length);
  const ev = $$('[data-ev]')[0];
  ev.checked = true; ev.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  check('V24 evidence checkbox persists', $$('[data-ev]')[0].checked);

  click('[data-gt="portals"]'); await wait(80);
  check('V25 all five portals render', ['UDGAM','IEPF','Bima Bharosa','MITRA','EPFO'].every(p => text().includes(p)));
  const extLinks = $$('a[target="_blank"]');
  check('V26 portal links are real https', extLinks.length >= 5 && extLinks.every(a => a.href.startsWith('https://')), 'links ' + extLinks.length);

  // case file
  click('[data-v="v-case"]'); await wait(80);
  check('V27 case file table renders', text().includes('Case file') && !!$('table'));
  check('V28 claim packs appear for found leads', text().includes('Claim packs'));
  click($$('[data-note]')[0]); await wait(60);
  $('#t-val').value = 'Called branch, asked for form 15G';
  click('[data-save="note"]'); await wait(100);
  check('V29 note saved to case file', text().includes('Called branch'));

  // documents
  click('[data-v="v-docs"]'); await wait(80);
  check('V30 documents checklist renders', $$('[data-doc]').length === 14, 'docs ' + $$('[data-doc]').length);
  check('V31 slow documents flagged', text().includes('Slow to obtain'));
  const before = text().match(/(\d+) of 14 in hand/)[1];
  const dbox = $$('[data-doc]').find(d => !d.checked);
  dbox.checked = true; dbox.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(100);
  const after = text().match(/(\d+) of 14 in hand/)[1];
  check('V32 document counter increments', +after === +before + 1, before + ' -> ' + after);
  check('V33 nominee vs heir routes explained', text().includes('Registered nominee') && text().includes('No nomination'));

  // ---------- persistence ----------
  await wait(600);
  const saved = window.localStorage.getItem('amanat_v1');
  check('P1 state written to storage', !!saved);
  const parsed = saved ? JSON.parse(saved) : {};
  check('P2 holdings persisted', (parsed.assets || []).length === 11, 'assets ' + (parsed.assets||[]).length);
  check('P3 leads persisted', (parsed.leads || []).length >= 10);
  check('P4 docs persisted', Object.values(parsed.docs || {}).filter(Boolean).length >= 5);

  // ---------- reload with the same storage ----------
  const dom2 = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/',
    beforeParse(w) {
      w.claude = { use: async () => null };
      w.localStorage.setItem('amanat_v1', saved);
      w.addEventListener('error', e => errors.push('reload error: ' + e.message));
    }
  });
  await wait(400);
  const t2 = dom2.window.document.body.textContent.replace(/\s+/g,' ');
  check('P5 state restored after reload', t2.includes('Search plan') || t2.includes('Ramesh'), t2.slice(0,120));

  // ---------- reset ----------
  click('[data-act="reset"]'); await wait(60);
  check('X1 reset asks first', text().includes('Reset the prototype?'));
  click('[data-save="reset"]'); await wait(150);
  check('X2 reset returns to chooser', $$('[data-j]').length === 2);
  check('X3 storage cleared', !window.localStorage.getItem('amanat_v1'));

  // ---------- errors ----------
  check('E1 no uncaught runtime errors', errors.length === 0, errors.join(' | '));

  const failed = results.filter(r => !r.pass);
  console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
  if (failed.length) { console.log('FAILURES:'); failed.forEach(f => console.log(' - ' + f.name + ' :: ' + f.extra)); process.exit(1); }
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
