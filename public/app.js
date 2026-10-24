(function(){
'use strict';
const $ = id => document.getElementById(id);
const state = { status: null, session: null, watchlists: [], strategies: [] };
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');window.setTimeout(()=>el.classList.remove('show'),3200)}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtDate(value){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString()}
function nav(page){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));document.querySelectorAll('[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===page));if(location.hash!=='#'+page)history.replaceState(null,'','#'+page);if(page==='watchlists')loadWatchlists();if(page==='strategies')loadStrategies();window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-page],[data-goto]').forEach(el=>el.addEventListener('click',e=>{const p=el.dataset.page||el.dataset.goto;if(p){e.preventDefault();nav(p)}}));
window.addEventListener('hashchange',()=>{const p=location.hash.slice(1);if($('page-'+p))nav(p)});
async function api(path,options={}){const r=await fetch(path,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});let body={};try{body=await r.json()}catch{}if(!r.ok){const msg=body.detail||body.error||('Request failed ('+r.status+')');throw Object.assign(new Error(typeof msg==='string'?msg:JSON.stringify(msg)),{status:r.status,body})}return body}
function markApi(ok){$('apiState').textContent=ok?'API reachable':'API unavailable';$('apiState').style.color=ok?'var(--mint)':'var(--red)'}
function setText(id, text){if($(id))$(id).textContent=text}
async function loadStatus(){
 try{
  const [s,readiness]=await Promise.all([api('/api/status'),api('/api/readiness')]);state.status=s;markApi(true);
  setText('sessionState',s.market_session||'UNVERIFIED');setText('lastChecked','Checked '+new Date().toLocaleTimeString());
  setText('marketStat',s.market_data?.status||'Unavailable');setText('marketStatFoot',s.market_data?.message||'No verified market provider');
  setText('aiStat',s.ai?.status||'Not verified');setText('aiStatFoot',s.ai?.message||'No verified active model');
  setText('brokerStat',s.broker?.status||'Disconnected');setText('brokerStatFoot',s.broker?.message||'Broker is not verified');
  setText('executionStat',s.live_trading?.enabled?'Enabled':'Guarded');
  setText('marketLabel',s.market_data?.status||'Unavailable');setText('marketTimestamp',s.market_data?.last_verified_at?'Last verified '+fmtDate(s.market_data.last_verified_at):'Timestamp unavailable');
  setText('marketProviderStatus',s.market_data?.status||'Unavailable');setText('brokerDetailBadge',s.broker?.status||'Not configured');
  setText('signalState',s.ai?.ready?'READY':'NOT READY');setText('pipelineBadge',s.ai?.ready?'READY':'NOT READY');
  setText('provenanceState',s.ai?.dataset_eligible?'Verified dataset available':'No eligible dataset verified');
  setText('modelState',s.ai?.model_verified?'Active model verified':'No active model verified');
  setText('marketDetails',s.market_data?.message||'No authorized provider is configured. Prices are not displayed until an upstream source is verified.');
  setText('brokerDetails',s.broker?.message||'No broker authorization verified.');
  $('readinessDetails').innerHTML='<p class="muted" style="line-height:1.7">'+esc(readiness.message||s.ai?.message||'AI readiness is not verified.')+'</p>'+(readiness.checks||[]).map(c=>'<div class="signalrow"><div><div class="signalname">'+esc(c.name)+'</div><div class="signalmeta">'+esc(c.status)+'</div></div><span class="pill">'+(c.status==='verified'?'Verified':'Required')+'</span></div>').join('');
  $('settingsStatus').innerHTML='<div class="signalrow"><div><div class="signalname">API</div><div class="signalmeta">'+esc(s.api?.status||'reachable')+'</div></div><span class="pill">OK</span></div><div class="signalrow"><div><div class="signalname">Market feed</div><div class="signalmeta">'+esc(s.market_data?.message||'Unavailable')+'</div></div><span class="pill">'+esc(s.market_data?.status||'Unavailable')+'</span></div><div class="signalrow"><div><div class="signalname">AI pipeline</div><div class="signalmeta">'+esc(s.ai?.message||'Not configured')+'</div></div><span class="pill">'+esc(s.ai?.status||'Not ready')+'</span></div><div class="signalrow"><div><div class="signalname">Broker</div><div class="signalmeta">'+esc(s.broker?.message||'Not configured')+'</div></div><span class="pill">'+esc(s.broker?.status||'Disconnected')+'</span></div>';
 }catch(e){markApi(false);setText('lastChecked','Unable to verify services');setText('marketDetails','The status API did not respond. This is not evidence that a provider is online.');toast('Could not refresh service status.')}
 await loadSession();
}
async function loadSession(){
 try{
  if(window.hatchable?.auth?.getSession){const s=await window.hatchable.auth.getSession();state.session=s&&s.user?s.user:null;}
  else state.session=null;
  if(state.session){$('accountButton').textContent=state.session.email||state.session.name||'Account';setText('sessionDetails','Signed in as '+(state.session.email||'TRADEAI user'));setText('watchlistMessage','Loading your account-scoped watchlist…');}
  else{ $('accountButton').textContent='Sign in / Create account';setText('sessionDetails','You are not signed in. Sign in to save private research.');}
 }catch{state.session=null;setText('sessionDetails','Session state could not be verified.')}
}
async function loadWatchlists(){
 const rows=$('watchlistRows');if(!rows)return;
 try{const data=await api('/api/watchlists');state.watchlists=data.items||[];renderWatchlists();setText('watchlistMessage',state.watchlists.length+' saved instrument(s). Market quotes are shown only when authorized data is configured.')}
 catch(e){rows.innerHTML='<tr><td colspan="5" class="empty">'+(e.status===401?'Sign in to load your private watchlist.':esc(e.message))+'</td></tr>';setText('watchlistMessage',e.status===401?'Sign in to save and view account-specific instruments.':'Watchlist API is unavailable.')}
}
function renderWatchlists(){
 const rows=$('watchlistRows');if(!state.watchlists.length){rows.innerHTML='<tr><td colspan="5" class="empty">No saved instruments yet. Add one above.</td></tr>';}
 else rows.innerHTML=state.watchlists.map(w=>'<tr><td><div class="sym">'+esc(w.symbol)+'</div><div class="subsym">Watchlist record</div></td><td>'+esc(w.exchange)+'</td><td>'+esc(w.note||'—')+'</td><td>'+esc(fmtDate(w.created_at))+'</td><td><button class="btn btn-danger" data-remove="'+Number(w.id)+'">Remove</button></td></tr>').join('');
 const dash=$('dashboardWatchlist');if(dash)dash.innerHTML=!state.watchlists.length?'<tr><td colspan="5" class="empty">No saved instruments. Open Watchlists to add symbols.</td></tr>':state.watchlists.slice(0,6).map(w=>'<tr><td><div class="sym">'+esc(w.symbol)+'</div></td><td>'+esc(w.exchange)+'</td><td>—</td><td><span class="pill">Quote unavailable</span></td><td><a class="btn" href="#watchlists">Details</a></td></tr>').join('');
 rows.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',async()=>{try{await api('/api/watchlists/'+btn.dataset.remove,{method:'DELETE'});toast('Instrument removed');loadWatchlists()}catch(e){toast(e.status===401?'Sign in required':e.message)}}));
}
$('watchlistForm')?.addEventListener('submit',async e=>{e.preventDefault();const symbol=$('symbolInput').value.trim().toUpperCase();const exchange=$('exchangeInput').value;const note=$('watchNote').value.trim();if(!/^[A-Z0-9._:-]{1,24}$/.test(symbol)){toast('Enter a valid instrument symbol');return}try{await api('/api/watchlists',{method:'POST',body:JSON.stringify({symbol,exchange,note})});$('symbolInput').value='';$('watchNote').value='';toast('Saved to your watchlist');await loadWatchlists()}catch(err){toast(err.status===401?'Please sign in first':err.message)}});
$('reloadWatchlist')?.addEventListener('click',loadWatchlists);
async function loadStrategies(){const el=$('strategyRows');try{const data=await api('/api/strategies');state.strategies=data.items||[];el.innerHTML=!state.strategies.length?'<tr><td colspan="5" class="empty">No saved strategies yet.</td></tr>':state.strategies.map(s=>'<tr><td><div class="sym">'+esc(s.name)+'</div></td><td>'+esc(s.symbol)+'</td><td>'+esc(s.timeframe)+'</td><td style="max-width:320px;white-space:normal">'+esc(s.rules)+'</td><td>'+esc(fmtDate(s.created_at))+'<div style="margin-top:6px"><button class="btn btn-danger" data-delete-strategy="'+Number(s.id)+'">Delete</button></div></td></tr>').join('');el.querySelectorAll('[data-delete-strategy]').forEach(btn=>btn.addEventListener('click',async()=>{try{await api('/api/strategies/'+btn.dataset.deleteStrategy,{method:'DELETE'});toast('Strategy removed');loadStrategies()}catch(e){toast(e.status===401?'Sign in required':e.message)}}))}catch(e){el.innerHTML='<tr><td colspan="5" class="empty">'+(e.status===401?'Sign in to create and view private strategies.':esc(e.message))+'</td></tr>'}}
$('strategyForm')?.addEventListener('submit',async e=>{e.preventDefault();const payload={name:$('strategyName').value.trim(),symbol:$('strategySymbol').value.trim().toUpperCase(),timeframe:$('strategyTimeframe').value,rules:$('strategyRule').value.trim()};if(!/^[A-Z0-9._:-]{1,24}$/.test(payload.symbol)){toast('Enter a valid instrument symbol');return}try{await api('/api/strategies',{method:'POST',body:JSON.stringify(payload)});$('strategyForm').reset();toast('Strategy specification saved');loadStrategies()}catch(err){toast(err.status===401?'Please sign in first':err.message)}});
$('reloadStrategies')?.addEventListener('click',loadStrategies);
$('refreshButton')?.addEventListener('click',()=>{loadStatus();if(location.hash==='#watchlists')loadWatchlists()});
$('signOutButton')?.addEventListener('click',async()=>{try{if(window.hatchable?.auth?.signOut)await window.hatchable.auth.signOut();state.session=null;toast('Signed out');loadSession();}catch{toast('Could not sign out from this browser session')}});
$('searchInstrument')?.addEventListener('click',async()=>{const q=$('instrumentQuery').value.trim();const box=$('instrumentResults');if(!q){box.textContent='Enter a symbol to search.';return}box.textContent='Checking authorized provider…';try{const result=await api('/api/market/search?symbol='+encodeURIComponent(q));box.textContent=JSON.stringify(result)}catch(err){box.textContent=err.message;box.className='empty'}});
const start=location.hash.slice(1);if(start&&$('page-'+start))nav(start);
loadStatus();
})();