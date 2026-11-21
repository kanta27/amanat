const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.test/',
  beforeParse(w){w.claude={use:async()=>null};w.navigator.clipboard={writeText:async()=>{}};w.addEventListener('error',e=>errors.push(e.message));}});
const {window}=dom, doc=window.document;
const wait=ms=>new Promise(r=>setTimeout(r,ms)), $=s=>doc.querySelector(s), $$=s=>[...doc.querySelectorAll(s)];
const click=e=>{e=typeof e==='string'?$(e):e; if(!e) throw new Error('missing '); e.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));};
const text=()=>(doc.getElementById('root').textContent+' '+doc.getElementById('modal').textContent+' '+doc.getElementById('toast').textContent).replace(/\s+/g,' ');
const res=[]; const check=(n,c,x='')=>{res.push(c);console.log((c?'PASS  ':'FAIL  ')+n+(c?'':'  <- '+x));};
(async()=>{
  await wait(300);
  check('L0 chooser copy mentions registry', text().includes('kept an Amanat registry and named you'));
  click('[data-j="recovery"]'); await wait(80);
  check('L1 lookup is step 1', text().includes('Did they use Amanat?'));
  check('L2 skip route still offered', !!$('[data-act="start-q"]') && !!$('[data-act="seed-r"]'));

  // validation
  $('#lk-pan').value='bad'; $('#lk-phone').value='123'; click('[data-act="lookup"]'); await wait(60);
  check('L3 bad PAN rejected', text().includes('Did they use Amanat?') && $('#toast').textContent.includes('valid PAN'));

  // no registry anywhere yet
  $('#lk-pan').value='ZZZZZ9999Z'; $('#lk-phone').value='9876543210'; click('[data-act="lookup"]'); await wait(80);
  check('L4 no registry -> honest nomatch', text().includes('No Amanat registry for this PAN'));
  click('[data-act="lookup-reset"]'); await wait(60);

  // sample family: seeds the father's registry, looks up as the son
  click('[data-act="lookup-sample"]'); await wait(100);
  check('L5 named path found', text().includes('Ramesh Kumar Sharma named you'), text().slice(0,300));
  check('L6 identifies the son', text().includes('Arjun Sharma') && text().includes('Son'));
  check('L7 nothing disclosed before reports', !text().includes('XXXX 4417'));

  click('[data-act="report-death"]'); await wait(60);
  check('L8 report needs the certificate confirmation', text().includes('Report their death'));
  $('#lk-cert').checked=true; click('[data-act="report-death"]'); await wait(80);
  check('L9 waiting for second report', text().includes('Waiting for a second report') && text().includes('Sunita Sharma'));
  check('L10 still nothing disclosed', !text().includes('XXXX 4417'));
  click('[data-act="second-report"]'); await wait(60);
  check('L11 both reports in', text().includes('Both reports are in'));
  click('[data-act="release-reg"]'); await wait(100);

  const cards=$$('.lead-card');
  check('L12 son sees exactly his 4 holdings', cards.length===4, 'got '+cards.length);
  check('L13 summary block shown', text().includes('recorded 4 holdings for you'));
  check('L14 full-detail ref visible (HDFC)', text().includes('XXXX 4417'));
  check('L15 existence-only ref hidden (LIC)', !text().includes('Policy 892'));
  check('L16 claim-guidance ref hidden (EPFO UAN)', !text().includes('UAN 1002'));
  check('L17 holdings meant for others not shown (SBI FD)', !text().includes('FD, Nagpur'));
  check('L18 claim route per holding', text().includes('Short claim route') && text().includes('Needs legal heir certificate'));
  check('L19 all marked found', $$('[data-st]').every(s=>s.value==='found'));

  // extend into the wider search
  click('[data-act="extend-search"]'); await wait(80);
  check('L20 interview opens pre-filled', $('#qin') && $('#qin').value==='Ramesh Kumar Sharma', $('#qin')&&$('#qin').value);
  for(let i=0;i<11;i++){ const s=$('[data-act="q-skip"]'); if(!s) break; click(s); await wait(40); }
  await wait(100);
  const labels=$$('.lead-card b').map(b=>b.textContent.trim());
  check('L21 wider search added', $$('.lead-card').length>4, 'count '+$$('.lead-card').length);
  check('L22 registry holdings kept, still found', $$('.lead-card').slice(0,4).every(c=>c.textContent.includes('From their registry')));
  check('L23 no duplicate HDFC lead', labels.filter(l=>l==='HDFC Bank').length===1, labels.join('|'));
  check('L24 known types flagged as check-for-others', text().includes('check for others they didn'));
  check('L25 extend button gone after search', !$('[data-act="extend-search"]'));
  check('L26 tax route still offered', text().includes('Tax records trace'));

  // case file claim packs use the registry nomination status
  const sel=$$('[data-st]')[0]; sel.value='filed'; sel.dispatchEvent(new window.Event('change',{bubbles:true})); await wait(60);
  click('[data-v="v-case"]'); await wait(80);
  check('L27 case file holds registry holdings', text().includes('HDFC Bank') && text().includes('Claim packs'));

  // not-named path: someone not designated
  click('[data-act="reset"]'); await wait(40); click('[data-save="reset"]'); await wait(100);
  click('[data-j="recovery"]'); await wait(60);
  click('[data-act="lookup-sample"]'); await wait(80);   // seeds registry
  click('[data-act="lookup-reset"]'); await wait(60);
  $('#lk-pan').value='abcps1234k'; $('#lk-phone').value='+91 90000 00000'; click('[data-act="lookup"]'); await wait(80);
  check('L28 registry exists but caller not named -> withheld', text().includes('isn’t one they named') && !text().includes('XXXX 4417'));

  // registry side: profile gap + people badges
  click('[data-go="chooser"]'); await wait(40); click('[data-j="registry"]'); await wait(60);
  check('L29 overview shows registry owner + masked PAN', text().includes('Registry of Ramesh Kumar Sharma') && text().includes('AB•••••34K'));
  click('[data-v="r-people"]'); await wait(60);
  check('L30 people show they were told', text().includes('Told they’re named'));
  check('L31 nominee without mobile flagged', text().includes('Add a mobile so they can find you'));

  check('E1 no runtime errors', errors.length===0, errors.join('|'));
  const f=res.filter(x=>!x).length; console.log('\n'+(res.length-f)+'/'+res.length+' checks passed'); process.exit(f?1:0);
})().catch(e=>{console.error('HARNESS',e);process.exit(2)});
