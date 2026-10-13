const supabaseClient=window.IDEIAS_SUPABASE?.client||null;
const T=(key,vars)=>window.PERTO_I18N?.t(key,vars)||key;
const locale=()=>window.PERTO_I18N?.lang||'pt-BR';

const resultsEl=document.querySelector('#results');
const cityInput=document.querySelector('#city');
const stateSelect=document.querySelector('#state');
const categorySelect=document.querySelector('#category');
const termInput=document.querySelector('#term');
const requestDialog=document.querySelector('#request-dialog');
const requestForm=document.querySelector('#request-form');
const requestMessage=document.querySelector('#request-message');
const profileDialog=document.querySelector('#profile-dialog');
const profileForm=document.querySelector('#profile-form');
const profileMessage=document.querySelector('#profile-message');
const profileBox=document.querySelector('#professional-profile');
const requestList=document.querySelector('#request-list');
const accountDialog=document.querySelector('#account-dialog');
const accountOpen=document.querySelector('#account-open');
const accountForm=document.querySelector('#auth-form');
const accountProfile=document.querySelector('#account-profile');
const accountMessage=document.querySelector('#account-message');
const passwordDialog=document.querySelector('#password-dialog');
const passwordForm=document.querySelector('#new-password-form');
const passwordMessage=document.querySelector('#password-message');
const syncStatus=document.querySelector('#sync-status');

let currentUser=null;
let currentProfile=null;
let userRequests=[];
let searchResults=[];
let pendingRequestProfessionalId='';
let pendingProfessionalSignup=false;
let loadingAccount=false;
let requestFilter='all';
let searchHasRun=false;
let catalogCount=null;
let catalogCountLoading=true;
let confirmationEmail='';
let lastConfirmationResend=0;
let confirmationBusy=false;

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(cents){return cents==null?T('consult'):(Number(cents)/100).toLocaleString(locale(),{style:'currency',currency:'BRL'});}
function showToast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800);}
function statusLabel(status){return T(({pending:'statePending',active:'stateActive',paused:'statePaused',rejected:'stateRejected'})[status]||status);}
function requestStatusLabel(status){return T(({new:'quoteNew',viewed:'quoteViewed',contacted:'quoteContacted',closed:'quoteClosed',cancelled:'quoteCancelled'})[status]||status);}
function safeText(value,max=180){return String(value||'').trim().slice(0,max);}
function normalize(value){return String(value||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu,'');}
const publicBase=()=>new URL('./',window.location.href);
function updateIntentsInUrl(changes){
  const url=new URL(window.location.href);
  for(const [key,value] of Object.entries(changes)){
    if(value===null)url.searchParams.delete(key);
    else url.searchParams.set(key,value);
  }
  window.history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function referralContext(source){
  const city=safeText(source.city,100);
  const state=String(source.state||'').toUpperCase();
  const category=String(source.category||'');
  const validState=Array.from(stateSelect.options).some(item=>item.value===state&&state!=='');
  const validCategory=Array.from(categorySelect.options).some(item=>item.value===category&&category!=='');
  return {city,state:validState?state:'',category:validCategory?category:''};
}
function referralFromUrl(){
  const params=new URL(window.location.href).searchParams;
  return referralContext({city:params.get('cidade'),state:params.get('uf'),category:params.get('categoria')});
}
function referralFromSearch(){
  return referralContext({city:cityInput.value,state:stateSelect.value,category:categorySelect.value});
}
function addReferralToUrl(url,context){
  const values=referralContext(context);
  if(values.city)url.searchParams.set('cidade',values.city);
  if(values.state)url.searchParams.set('uf',values.state);
  if(values.category)url.searchParams.set('categoria',values.category);
  return url;
}
function authRedirectUrl(){
  const url=publicBase();
  const current=new URL(window.location.href);
  if(pendingProfessionalSignup||current.searchParams.get('cadastro')==='profissional'){
    url.searchParams.set('cadastro','profissional');
    addReferralToUrl(url,referralFromUrl());
    url.hash='para-profissionais';
  }else{
    const profileId=pendingRequestProfessionalId||current.searchParams.get('profissional');
    if(validProfileId(profileId)&&(pendingRequestProfessionalId||current.searchParams.get('pedido')==='1')){
      url.searchParams.set('profissional',profileId);
      url.searchParams.set('pedido','1');
    }
  }
  return url.href;
}
const validProfileId=id=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(id||''));
function publicProfileUrl(id){
  if(!validProfileId(id))return '';
  const url=publicBase();
  url.searchParams.set('profissional',id);
  return url.href;
}
function whatsappUrl(message){return 'https://wa.me/?text='+encodeURIComponent(message);}
function profileShareUrl(profile){
  return whatsappUrl(T('shareProfessionalText',{name:profile.display_name,category:profile.category,city:profile.city,state:profile.state,url:publicProfileUrl(profile.id)}));
}
function shareableSearchUrl(){
  const url=publicBase();
  url.searchParams.set('buscar','1');
  addReferralToUrl(url,referralFromSearch());
  return url.href;
}
function refreshSearchSharing(){
  const box=document.querySelector('#search-share');
  const filters=referralFromSearch();
  const canShare=searchHasRun && !!(filters.city||filters.state||filters.category);
  box.hidden=!canShare;
  if(!canShare)return;
  const parts=[filters.category,filters.city,filters.state].filter(Boolean).join(' · ');
  document.querySelector('#search-whatsapp').href=whatsappUrl(T('shareSearchText',{focus:parts,url:shareableSearchUrl()}));
}
async function copySearchUrl(){
  if(document.querySelector('#search-share').hidden)return;
  const url=shareableSearchUrl();
  try{
    if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(url);
    showToast(T('searchLinkCopied'));
  }catch(error){window.prompt(T('copySearchPrompt'),url);}
}
function professionalInviteUrl(context={}){
  const url=new URL('convite.html',publicBase());
  const values=referralContext(context);
  const focus=[values.category,values.city,values.state].filter(Boolean).join(' · ');
  addReferralToUrl(url,values);
  if(locale()==='en')url.searchParams.set('lang','en');
  return whatsappUrl(focus
    ?T('inviteLocalProfessionalText',{focus,url:url.href})
    :T('inviteProfessionalText',{url:url.href}));
}
function shareActions(profile){
  const link=publicProfileUrl(profile.id);
  if(!link)return '';
  return '<div class="profile-share-links">'+
    '<a class="share-profile" href="'+escapeHtml(profileShareUrl(profile))+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(T('shareWhatsApp'))+'</a>'+
    '<a class="copy-profile" href="'+escapeHtml(link)+'" data-copy-profile="'+escapeHtml(profile.id)+'">'+escapeHtml(T('copyProfileLink'))+'</a></div>';
}
async function copyProfileLink(id){
  const link=publicProfileUrl(id);if(!link)return;
  try{
    if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(link);
    showToast(T('profileLinkCopied'));
  }catch(error){
    window.prompt(T('copyLinkPrompt'),link);
  }
}
async function loadSharedProfile(){
  const id=new URL(window.location.href).searchParams.get('profissional');
  if(!id)return;
  if(!validProfileId(id)){showToast(T('invalidSharedProfile'));return;}
  if(!supabaseClient){showToast(T('searchUnavailable'));return;}
  try{
    const {data,error}=await supabaseClient.from('perto_professionals')
      .select('id,display_name,city,state,category,description,price_from_cents,rating,status')
      .eq('status','active').eq('id',id).limit(1);
    if(error)throw error;
    searchResults=data||[];
    renderResults();
    if(!searchResults.length)document.querySelector('#result-summary').textContent=T('sharedProfileUnavailable');
    document.querySelector('#results').scrollIntoView({block:'start'});
  }catch(error){
    console.error(error);
    resultsEl.innerHTML='<div class="empty-box error"><strong>'+escapeHtml(T('searchFailedTitle'))+'</strong><span>'+escapeHtml(T('tryAgain'))+'</span></div>';
  }
}

function renderCatalogCount(){
  document.querySelector('#hero-count').textContent=catalogCountLoading?'—':catalogCount===null?'—':String(catalogCount);
  document.querySelector('#hero-count-label').textContent=T(catalogCountLoading?'countLoading':catalogCount===null?'countUnavailable':catalogCount===0?'countEmpty':'available');
  document.querySelector('#hero-founders').hidden=catalogCount!==0;
}
async function loadActiveCount(){
  catalogCountLoading=true;renderCatalogCount();
  if(!supabaseClient){
    catalogCount=null;catalogCountLoading=false;renderCatalogCount();return;
  }
  try{
    const {count,error}=await supabaseClient.from('perto_professionals').select('id',{count:'exact',head:true}).eq('status','active');
    if(error||!Number.isSafeInteger(count)||count<0)throw error||new Error('invalid_count');
    catalogCount=count;
  }catch(error){
    console.error(error);catalogCount=null;
  }finally{
    catalogCountLoading=false;renderCatalogCount();
  }
}

function professionalCard(profile){
  const rating=profile.rating==null?'<span class="rating new">'+escapeHtml(T('ratingNew'))+'</span>':'<span class="rating">★ '+Number(profile.rating).toFixed(1)+'</span>';
  return '<article class="professional-card">'+
    '<div class="professional-top"><div><strong>'+escapeHtml(profile.display_name)+'</strong><span>'+escapeHtml(profile.category)+'</span></div>'+rating+'</div>'+
    '<p>'+escapeHtml(profile.description||'')+'</p>'+
    '<div class="professional-meta"><span>⌖ '+escapeHtml(profile.city)+'/'+escapeHtml(profile.state)+'</span><span>'+escapeHtml(T('from'))+' '+escapeHtml(money(profile.price_from_cents))+'</span></div>'+
    '<button class="button primary full" type="button" data-request="'+escapeHtml(profile.id)+'">'+escapeHtml(T('requestQuote'))+'</button>'+shareActions(profile)+
  '</article>';
}

function renderResults(){
  resultsEl.innerHTML=searchResults.length
    ?searchResults.map(professionalCard).join('')
    :'<div class="empty-box"><strong>'+escapeHtml(T('noProfessionals'))+'</strong><span>'+escapeHtml(T('noProfessionalsHelp'))+'</span><a class="button ghost invite-inline" href="'+escapeHtml(professionalInviteUrl(referralFromSearch()))+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(T('inviteProfessional'))+'</a></div>';
  document.querySelector('#result-summary').textContent=searchResults.length
    ?T('professionalsFound',{count:searchResults.length})
    :T('noResults');
}

async function searchProfessionals(){
  const url=new URL(window.location.href);
  if(url.searchParams.has('profissional')){
    url.searchParams.delete('profissional');
    url.searchParams.delete('pedido');
    window.history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  searchHasRun=false;
  refreshSearchSharing();
  if(!supabaseClient){showToast(T('searchUnavailable'));return;}
  const button=document.querySelector('#search-button');button.disabled=true;
  document.querySelector('#result-summary').textContent=T('searching');
  try{
    let query=supabaseClient.from('perto_professionals')
      .select('id,display_name,city,state,category,description,price_from_cents,rating,status')
      .eq('status','active')
      .order('rating',{ascending:false,nullsFirst:false})
      .limit(60);
    const city=safeText(cityInput.value,100);
    if(city)query=query.ilike('city','%'+city+'%');
    if(stateSelect.value)query=query.eq('state',stateSelect.value);
    if(categorySelect.value)query=query.ilike('category','%'+categorySelect.value+'%');
    const {data,error}=await query;if(error)throw error;
    const term=normalize(termInput.value);
    searchResults=(data||[]).filter(profile=>{
      if(!term)return true;
      return [profile.display_name,profile.category,profile.description].some(v=>normalize(v).includes(term));
    });
    searchHasRun=true;
    renderResults();
    refreshSearchSharing();
    if(new URL(window.location.href).searchParams.get('buscar')==='1'){
      const next=new URL(shareableSearchUrl());
      window.history.replaceState(null,'',next.pathname+next.search+next.hash);
    }
  }catch(error){console.error(error);searchResults=[];resultsEl.innerHTML='<div class="empty-box error"><strong>'+escapeHtml(T('searchFailedTitle'))+'</strong><span>'+escapeHtml(T('tryAgain'))+'</span></div>';document.querySelector('#result-summary').textContent=T('searchFailed');}
  finally{button.disabled=false;}
}

function openRequest(profileId){
  const profile=searchResults.find(item=>item.id===profileId);
  if(!profile)return;
  if(!currentUser){
    pendingRequestProfessionalId=profileId;
    updateIntentsInUrl({profissional:profileId,pedido:'1',cadastro:null});
    accountMessage.textContent=T('mustLogin');
    if(!accountDialog.open)accountDialog.showModal();
    return;
  }
  requestForm.reset();
  requestForm.elements.professionalId.value=profile.id;
  requestForm.elements.category.value=profile.category;
  requestForm.elements.city.value=profile.city;
  document.querySelector('#request-professional').innerHTML='<strong>'+escapeHtml(profile.display_name)+'</strong><span>'+escapeHtml(profile.category)+' · '+escapeHtml(profile.city)+'/'+escapeHtml(profile.state)+'</span>';
  requestMessage.textContent='';
  requestDialog.showModal();
}

async function sendRequest(){
  const values=Object.fromEntries(new FormData(requestForm));
  const payload={
    user_id:currentUser.id,
    professional_id:values.professionalId||null,
    category:safeText(values.category,100),
    city:safeText(values.city,100),
    message:safeText(values.message,1600),
    contact:safeText(values.contact,200)
  };
  const {data,error}=await supabaseClient.from('perto_requests').insert(payload).select('*').single();
  if(error)throw error;
  userRequests.unshift(data);
}

function renderRequestList(){
  document.querySelector('#request-count').textContent=String(userRequests.length);
  document.querySelector('#request-refresh').hidden=!currentUser;
  document.querySelector('#request-filters').hidden=!currentUser;
  const filteredRequests=userRequests.filter(request=>
    requestFilter==='all'||(requestFilter==='sent')===(request.user_id===currentUser?.id));
  if(!currentUser){
    requestList.innerHTML='<div class="empty-box compact"><strong>'+escapeHtml(T('noLoginRequests'))+'</strong><span>'+escapeHtml(T('privateRequests'))+'</span></div>';
    return;
  }
  requestList.innerHTML=filteredRequests.length?filteredRequests.map(request=>{
    const outgoing=request.user_id===currentUser.id;
    return '<article class="request-item">'+
      '<div><strong>'+escapeHtml(request.category)+'</strong><span>'+escapeHtml(request.city)+' · '+new Date(request.created_at).toLocaleDateString(locale())+'</span></div>'+
      '<p>'+escapeHtml(request.message)+'</p>'+
      (outgoing?'':'<div class="private-contact"><span>'+escapeHtml(T('contactProvided'))+'</span><strong>'+escapeHtml(request.contact||T('notProvided'))+'</strong></div>')+
      '<span class="request-status">'+escapeHtml(outgoing?T('sent')+' · '+requestStatusLabel(request.status):T('received')+' · '+requestStatusLabel(request.status))+'</span>'+
      (outgoing&&['new','viewed','contacted'].includes(request.status)?'<button class="button text danger-text" data-cancel-request="'+escapeHtml(request.id)+'" type="button">'+escapeHtml(T('cancelQuote'))+'</button>':'')+
      (!outgoing&&currentProfile?.id===request.professional_id&&['new','viewed','contacted'].includes(request.status)
        ?'<button class="button ghost request-progress" type="button" data-request-progress="'+escapeHtml(request.id)+'" data-next-status="'+(request.status==='new'?'viewed':request.status==='viewed'?'contacted':'closed')+'">'+escapeHtml(T(request.status==='new'?'markViewed':request.status==='viewed'?'markContacted':'closeRequest'))+'</button>'
        :'')+
    '</article>';
  }).join(''):'<div class="empty-box compact"><strong>'+escapeHtml(T(requestFilter==='all'?'noRequests':'noRequestsFilter'))+'</strong><span>'+escapeHtml(T('noRequestsHelp'))+'</span></div>';
}

function profileStatusGuidance(status){
  const details={
    pending:'profileReviewPending',
    active:'profileReviewActive',
    rejected:'profileReviewRejected',
    paused:'profileReviewPaused'
  };
  return T(details[status]||'profileReviewPending');
}

function renderProfile(){
  if(!currentUser){
    profileBox.innerHTML='<div class="empty-box compact"><strong>'+escapeHtml(T('offerService'))+'</strong><span>'+escapeHtml(T('loginForProfile'))+'</span><button class="button ghost" type="button" data-open-account>'+escapeHtml(T('signIn'))+'</button></div>';
    return;
  }
  if(!currentProfile){
    profileBox.innerHTML='<div class="empty-box compact"><strong>'+escapeHtml(T('noProfile'))+'</strong><span>'+escapeHtml(T('profilePendingHelp'))+'</span><button class="button primary" type="button" data-create-profile>'+escapeHtml(T('createProfile'))+'</button></div>';
    return;
  }
  profileBox.innerHTML='<article class="my-profile">'+
    '<div class="profile-head"><div><strong>'+escapeHtml(currentProfile.display_name)+'</strong><span>'+escapeHtml(currentProfile.category)+' · '+escapeHtml(currentProfile.city)+'/'+escapeHtml(currentProfile.state)+'</span></div><span class="profile-status '+escapeHtml(currentProfile.status)+'">'+escapeHtml(statusLabel(currentProfile.status))+'</span></div>'+
    '<p>'+escapeHtml(currentProfile.description||'')+'</p>'+
    '<div class="profile-price">'+escapeHtml(T('profileCost'))+' <strong>'+escapeHtml(money(currentProfile.price_from_cents))+'</strong></div>'+
    '<div class="profile-guidance" role="status"><strong>'+escapeHtml(T('profileStatusHeading'))+'</strong><p>'+escapeHtml(profileStatusGuidance(currentProfile.status))+'</p></div>'+
    '<div class="profile-actions">'+
    '<button class="button ghost" type="button" data-edit-profile>'+escapeHtml(T('editProfile'))+'</button>'+
    '<button class="button ghost" type="button" data-refresh-profile>'+escapeHtml(T('refreshProfileStatus'))+'</button></div>'+
    (currentProfile.status==='active'?shareActions(currentProfile):'')+
  '</article>';
}

function openProfileEditor(){
  if(!currentUser)return;
  profileForm.reset();
  profileForm.querySelectorAll('[aria-invalid="true"]').forEach(field=>{
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  });
  if(currentProfile){
    profileForm.elements.displayName.value=currentProfile.display_name||'';
    profileForm.elements.city.value=currentProfile.city||'';
    profileForm.elements.state.value=currentProfile.state||'';
    const previousCategory=currentProfile.category||'';
    if(previousCategory&&!Array.from(profileForm.elements.category.options).some(option=>option.value===previousCategory)){
      const legacyOption=document.createElement('option');
      legacyOption.value=previousCategory;
      legacyOption.textContent=previousCategory;
      legacyOption.dataset.legacy='true';
      profileForm.elements.category.append(legacyOption);
    }
    profileForm.elements.category.value=previousCategory;
    profileForm.elements.description.value=currentProfile.description||'';
    profileForm.elements.priceFrom.value=currentProfile.price_from_cents==null?'':(Number(currentProfile.price_from_cents)/100).toFixed(2);
    document.querySelector('#profile-title').textContent=T('editProfile');
  }else{
    const invited=referralFromUrl();
    const searched=referralFromSearch();
    const values={
      city:invited.city||searched.city,
      state:invited.state||searched.state,
      category:invited.category||searched.category
    };
    profileForm.elements.city.value=values.city;
    profileForm.elements.state.value=values.state;
    profileForm.elements.category.value=values.category;
    document.querySelector('#profile-title').textContent=T('createProfile');
  }
  const hint=document.querySelector('#profile-review-hint');
  hint.hidden=!currentProfile||currentProfile.status==='pending';
  hint.textContent=currentProfile?.status==='active'
    ?T('profileEditRequiresReview')
    :T('profileEditMayResubmit');
  profileMessage.textContent='';
  profileDialog.showModal();
}

async function refreshOwnProfile(){
  const owner=currentUser?.id;
  const id=currentProfile?.id;
  if(!owner||!id||!supabaseClient)return;
  const button=profileBox.querySelector('[data-refresh-profile]');
  if(button)button.disabled=true;
  try{
    const {data,error}=await supabaseClient.from('perto_professionals')
      .select('id,user_id,display_name,city,state,category,description,price_from_cents,rating,status,created_at,updated_at')
      .eq('id',id).eq('user_id',owner).maybeSingle();
    if(currentUser?.id!==owner||currentProfile?.id!==id)return;
    if(error)throw error;
    if(!data){showToast(T('profileRefreshMissing'));return;}
    const changed=data.status!==currentProfile.status;
    currentProfile=data;
    renderProfile();
    showToast(T(changed?'profileRefreshChanged':'profileRefreshUnchanged'));
    if(changed)await loadActiveCount();
  }catch(error){
    if(currentUser?.id===owner){console.error(error);showToast(T('profileRefreshFailed'));}
  }finally{
    const refreshed=profileBox.querySelector('[data-refresh-profile]');
    if(refreshed)refreshed.disabled=false;
  }
}

function profileFormError(values){
  const rules=[
    {field:'displayName',key:'profileInvalidName',min:2,max:120},
    {field:'city',key:'profileInvalidCity',min:2,max:100},
    {field:'category',key:'profileInvalidCategory',min:2,max:100},
    {field:'description',key:'profileInvalidDescription',min:15,max:1200}
  ];
  for(const rule of rules){
    const cleaned=String(values[rule.field]||'').trim();
    if(cleaned.length<rule.min||cleaned.length>rule.max){
      return {field:rule.field,key:rule.key};
    }
  }
  const state=String(values.state||'').toUpperCase();
  if(!Array.from(profileForm.elements.state.options).some(option=>option.value===state&&state)){
    return {field:'state',key:'profileInvalidState'};
  }
  const rawPrice=String(values.priceFrom||'').trim();
  if(rawPrice!==''){
    const value=Number(rawPrice);
    const cents=Math.round(value*100);
    if(!Number.isFinite(value)||value<0||value>21474836.47||!Number.isSafeInteger(cents)){
      return {field:'priceFrom',key:'profileInvalidPrice'};
    }
  }
  return null;
}

async function saveProfile(){
  const values=Object.fromEntries(new FormData(profileForm));
  const price=values.priceFrom===''?null:Math.round(Number(values.priceFrom)*100);
  const payload={
    user_id:currentUser.id,
    display_name:safeText(values.displayName,120),
    city:safeText(values.city,100),
    state:safeText(values.state,2).toUpperCase(),
    category:safeText(values.category,100),
    description:safeText(values.description,1200),
    price_from_cents:Number.isFinite(price)?price:null,
    updated_at:new Date().toISOString()
  };
  if(currentProfile){
    const {user_id:_immutableOwner,...editable}=payload;
    const {data,error}=await supabaseClient.from('perto_professionals').update(editable).eq('id',currentProfile.id).eq('user_id',currentUser.id).select('id,user_id,display_name,city,state,category,description,price_from_cents,rating,status,created_at,updated_at').single();
    if(error)throw error;currentProfile=data;
  }else{
    const {data,error}=await supabaseClient.from('perto_professionals').insert(payload).select('id,user_id,display_name,city,state,category,description,price_from_cents,rating,status,created_at,updated_at').single();
    if(error)throw error;currentProfile=data;
  }
}

async function loadUserData(){
  if(!currentUser)return;
  loadingAccount=true;updateAccountUi();
  const owner=currentUser.id;
  const [profileResult,requestsResult]=await Promise.all([
    supabaseClient.from('perto_professionals').select('id,user_id,display_name,city,state,category,description,price_from_cents,rating,status,created_at,updated_at').eq('user_id',currentUser.id).maybeSingle(),
    supabaseClient.from('perto_requests').select('*').order('created_at',{ascending:false}).limit(100)
  ]);
  if(currentUser?.id!==owner)return;
  loadingAccount=false;
  if(profileResult.error)accountMessage.textContent=T('loadProfileFailed');
  else currentProfile=profileResult.data?{...profileResult.data}:null;
  if(requestsResult.error)accountMessage.textContent=T('loadRequestsFailed');
  else userRequests=requestsResult.data||[];
  updateAccountUi();renderProfile();renderRequestList();
}

async function refreshRequestInbox(){
  const owner=currentUser?.id;
  if(!owner||loadingAccount)return;
  const button=document.querySelector('#request-refresh');
  button.disabled=true;
  button.textContent=T('refreshingRequests');
  try{
    const {data,error}=await supabaseClient.from('perto_requests')
      .select('*').order('created_at',{ascending:false}).limit(100);
    if(currentUser?.id!==owner)return;
    if(error)throw error;
    userRequests=data||[];
    renderRequestList();
    showToast(T('requestsRefreshed'));
  }catch(error){
    if(currentUser?.id===owner){
      console.error(error);
      showToast(T('requestsRefreshFailed'));
    }
  }finally{
    button.disabled=false;
    button.textContent=T('refreshRequests');
  }
}

function authErrorText(error){
  const m=String(error?.message||'').toLowerCase();
  if(m.includes('invalid login credentials'))return T('invalidCredentials');
  if(m.includes('email not confirmed'))return T('emailNotConfirmed');
  if(m.includes('already registered'))return T('emailAlready');
  if(m.includes('password should be at least'))return T('shortPassword');
  return T('authError');
}
function showConfirmationHelp(email){
  confirmationEmail=String(email||'').trim();
  document.querySelector('#email-confirmation-help').hidden=!confirmationEmail;
  document.querySelector('#resend-confirmation').disabled=confirmationBusy||Date.now()-lastConfirmationResend<60000;
}
function hideConfirmationHelp(){
  confirmationEmail='';
  document.querySelector('#email-confirmation-help').hidden=true;
}
function updateAccountUi(){
  accountOpen.disabled=!supabaseClient;accountOpen.textContent=currentUser?T('myAccount'):T('signIn');
  syncStatus.textContent=currentUser?(loadingAccount?T('loadingAccount'):T('connected')+' · '+(currentUser.email||T('myAccount'))):T('searchStatus');
  accountForm.hidden=Boolean(currentUser)||!supabaseClient;accountProfile.hidden=!currentUser;
  if(currentUser){
    document.querySelector('#account-email').textContent=currentUser.email||T('accountConnected');
    hideConfirmationHelp();
  }
}

document.querySelector('#request-refresh').addEventListener('click',refreshRequestInbox);
document.querySelector('#request-filters').addEventListener('click',event=>{
  const button=event.target.closest('[data-request-filter]');
  if(!button||!currentUser)return;
  requestFilter=button.dataset.requestFilter;
  document.querySelectorAll('[data-request-filter]').forEach(filter=>{
    const active=filter.dataset.requestFilter===requestFilter;
    filter.classList.toggle('active',active);
    filter.setAttribute('aria-pressed',String(active));
  });
  renderRequestList();
});

document.querySelector('#search-button').addEventListener('click',searchProfessionals);
document.querySelector('#search-copy').addEventListener('click',copySearchUrl);
[cityInput,stateSelect,categorySelect,termInput].forEach(el=>{
  el.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchProfessionals();}});
  el.addEventListener('input',()=>{searchHasRun=false;refreshSearchSharing();});
  el.addEventListener('change',()=>{searchHasRun=false;refreshSearchSharing();});
});
resultsEl.addEventListener('click',event=>{const b=event.target.closest('[data-request]');if(b)openRequest(b.dataset.request);});
document.addEventListener('click',event=>{
  const copy=event.target.closest('[data-copy-profile]');
  if(copy){event.preventDefault();copyProfileLink(copy.dataset.copyProfile);}
});
document.querySelector('#register-professional').addEventListener('click',()=>{
  if(!currentUser){
    pendingProfessionalSignup=true;
    pendingRequestProfessionalId='';
    const initial=referralFromUrl(),chosen=referralFromSearch();
    const values={
      city:initial.city||chosen.city,
      state:initial.state||chosen.state,
      category:initial.category||chosen.category
    };
    updateIntentsInUrl({
      cadastro:'profissional',pedido:null,profissional:null,
      cidade:values.city||null,uf:values.state||null,categoria:values.category||null
    });
    accountMessage.textContent=T('registerSignInHelp');
    if(!accountDialog.open)accountDialog.showModal();
  }else if(currentProfile){
    profileBox.scrollIntoView({block:'center'});
  }else{openProfileEditor();}
});

document.querySelector('#request-close').addEventListener('click',()=>requestDialog.close());
requestDialog.addEventListener('click',e=>{if(e.target===requestDialog)requestDialog.close();});
requestForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!currentUser||!requestForm.reportValidity())return;
  const b=requestForm.querySelector('[type="submit"]');b.disabled=true;requestMessage.textContent=T('sending');
  try{await sendRequest();requestDialog.close();renderRequestList();showToast(T('quoteSent'));}
  catch(error){
    console.error(error);
    const message=String(error?.message||'');
    const key=message.includes('perto_request_hourly_limit')?'quoteRateLimited'
      :message.includes('perto_professional_not_active')?'quoteInactive'
      :message.includes('perto_self_request_forbidden')?'quoteSelfBlocked'
      :'quoteFailed';
    requestMessage.textContent=T(key);
  }
  finally{b.disabled=false;}
});

requestList.addEventListener('click',async event=>{
  const progress=event.target.closest('[data-request-progress]');
  if(progress){
    if(!currentUser||!currentProfile)return;
    const id=progress.dataset.requestProgress;
    const next=progress.dataset.nextStatus;
    const request=userRequests.find(item=>item.id===id);
    if(!request||request.user_id===currentUser.id||request.professional_id!==currentProfile.id)return;
    const permitted={new:'viewed',viewed:'contacted',contacted:'closed'};
    if(permitted[request.status]!==next)return;
    progress.disabled=true;
    try{
      const {data,error}=await supabaseClient.rpc('perto_set_request_status',{p_request_id:id,p_new_status:next});
      if(error)throw error;
      userRequests=userRequests.map(item=>item.id===id?{...item,status:data}:item);
      renderRequestList();
      showToast(T('requestProgressSaved'));
    }catch(error){
      console.error(error);
      progress.disabled=false;
      showToast(T('requestProgressFailed'));
    }
    return;
  }
  const cancel=event.target.closest('[data-cancel-request]');if(!cancel)return;
  if(!window.confirm(T('confirmCancel')))return;
  cancel.disabled=true;
  try{
    const {data,error}=await supabaseClient.from('perto_requests').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',cancel.dataset.cancelRequest).eq('user_id',currentUser.id).select('*').single();
    if(error)throw error;userRequests=userRequests.map(item=>item.id===data.id?data:item);renderRequestList();showToast(T('cancelled'));
  }catch(error){console.error(error);showToast(T('cancelFailed'));}
  finally{cancel.disabled=false;}
});

profileBox.addEventListener('click',event=>{
  if(event.target.closest('[data-create-profile]')||event.target.closest('[data-edit-profile]'))openProfileEditor();
  if(event.target.closest('[data-open-account]'))accountDialog.showModal();
  if(event.target.closest('[data-refresh-profile]'))refreshOwnProfile();
});
document.querySelector('#profile-close').addEventListener('click',()=>profileDialog.close());
profileDialog.addEventListener('click',e=>{if(e.target===profileDialog)profileDialog.close();});
function clearProfileFieldError(event){
  const field=event.target;
  if(!field?.hasAttribute?.('aria-invalid'))return;
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
  profileMessage.textContent='';
}
profileForm.addEventListener('input',clearProfileFieldError);
profileForm.addEventListener('change',clearProfileFieldError);
profileForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!currentUser||!profileForm.reportValidity())return;
  const invalid=profileFormError(Object.fromEntries(new FormData(profileForm)));
  if(invalid){
    profileMessage.textContent=T(invalid.key);
    const field=profileForm.elements[invalid.field];
    field.setAttribute('aria-invalid','true');
    field.setAttribute('aria-describedby','profile-message');
    field.focus();
    return;
  }
  const b=profileForm.querySelector('[type="submit"]');b.disabled=true;profileMessage.textContent=T('savingProfile');
  try{await saveProfile();profileDialog.close();renderProfile();showToast(currentProfile.status==='pending'?T('profileSaved'):T('profileUpdated'));}
  catch(error){console.error(error);profileMessage.textContent=String(error?.message||'').includes('moderation')?T('profileModerationError'):T('profileSaveError');}
  finally{b.disabled=false;}
});

accountOpen.addEventListener('click',()=>accountDialog.showModal());
document.querySelector('#account-close').addEventListener('click',()=>accountDialog.close());
accountDialog.addEventListener('click',e=>{if(e.target===accountDialog)accountDialog.close();});
accountForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!supabaseClient)return;const b=accountForm.querySelector('[type="submit"]');b.disabled=true;accountMessage.textContent=T('signingIn');
  const email=accountForm.elements.email.value.trim();
  try{
    const {error}=await supabaseClient.auth.signInWithPassword({email,password:accountForm.elements.password.value});
    if(error)throw error;
    hideConfirmationHelp();
    accountMessage.textContent=T('accountConnected');
  }catch(error){
    if(String(error?.message||'').toLowerCase().includes('email not confirmed'))showConfirmationHelp(email);
    else hideConfirmationHelp();
    accountMessage.textContent=authErrorText(error);
  }finally{b.disabled=false;}
});
document.querySelector('#sign-up').addEventListener('click',async()=>{
  if(!supabaseClient)return;const email=accountForm.elements.email.value.trim(),password=accountForm.elements.password.value;
  if(!email||password.length<8){accountMessage.textContent=T('signupInvalid');return;}
  const b=document.querySelector('#sign-up');b.disabled=true;accountMessage.textContent=T('creatingAccount');
  try{
    const {data,error}=await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:authRedirectUrl()}});
    if(error)throw error;
    if(data.session){hideConfirmationHelp();accountMessage.textContent=T('accountCreated');}
    else{showConfirmationHelp(email);accountMessage.textContent=T('confirmEmail');}
  }catch(error){hideConfirmationHelp();accountMessage.textContent=authErrorText(error);}
  finally{b.disabled=false;}
});
document.querySelector('#resend-confirmation').addEventListener('click',async()=>{
  if(!supabaseClient||!confirmationEmail||confirmationBusy)return;
  if(Date.now()-lastConfirmationResend<60000){
    accountMessage.textContent=T('confirmationCooldown');return;
  }
  confirmationBusy=true;
  const button=document.querySelector('#resend-confirmation');
  button.disabled=true;
  accountMessage.textContent=T('resendingConfirmation');
  try{
    const {error}=await supabaseClient.auth.resend({
      type:'signup',email:confirmationEmail,options:{emailRedirectTo:authRedirectUrl()}
    });
    if(error)throw error;
    lastConfirmationResend=Date.now();
    accountMessage.textContent=T('confirmationResent');
    setTimeout(()=>{
      if(!confirmationBusy&&confirmationEmail)button.disabled=Date.now()-lastConfirmationResend<60000;
    },60000);
  }catch(error){
    accountMessage.textContent=T('confirmationResendFailed');
    console.error(error);
  }finally{
    confirmationBusy=false;
    button.disabled=Date.now()-lastConfirmationResend<60000;
  }
});
document.querySelector('#reset-password').addEventListener('click',async()=>{
  if(!supabaseClient)return;const email=accountForm.elements.email.value.trim();if(!email){accountMessage.textContent=T('emailRequired');return;}
  try{const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:new URL('./',window.location.href).href});if(error)throw error;accountMessage.textContent=T('resetSent');}
  catch(error){accountMessage.textContent=authErrorText(error);}
});
document.querySelector('#sign-out').addEventListener('click',async()=>{if(!supabaseClient)return;const {error}=await supabaseClient.auth.signOut();accountMessage.textContent=error?T('signOutError'):T('signedOut');});

document.querySelector('#password-close').addEventListener('click',()=>passwordDialog.close());
passwordForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!supabaseClient||!passwordForm.reportValidity())return;
  const password=passwordForm.elements.password.value;
  const confirmation=passwordForm.elements.confirmPassword.value;
  if(password!==confirmation){passwordMessage.textContent=T('passwordsDoNotMatch');return;}
  const button=passwordForm.querySelector('[type="submit"]');
  button.disabled=true;passwordMessage.textContent=T('updatingPassword');
  try{
    const {error}=await supabaseClient.auth.updateUser({password});
    if(error)throw error;
    passwordForm.reset();
    passwordDialog.close();
    showToast(T('passwordChanged'));
  }catch(error){
    console.error(error);
    passwordMessage.textContent=T('passwordChangeFailed');
  }finally{button.disabled=false;}
});

async function continuePendingIntent(){
  if(!currentUser)return;
  const url=new URL(window.location.href);
  const candidate=pendingRequestProfessionalId||
    (url.searchParams.get('pedido')==='1'?url.searchParams.get('profissional'):null);
  if(validProfileId(candidate)){
    if(!searchResults.some(p=>p.id===candidate)){
      await loadSharedProfile();
    }
    if(!searchResults.some(p=>p.id===candidate)){
      pendingRequestProfessionalId='';
      updateIntentsInUrl({pedido:null});
      return;
    }
    pendingRequestProfessionalId='';
    updateIntentsInUrl({pedido:null});
    if(accountDialog.open)accountDialog.close();
    openRequest(candidate);
    return;
  }
  if(pendingProfessionalSignup||url.searchParams.get('cadastro')==='profissional'){
    pendingProfessionalSignup=false;
    updateIntentsInUrl({cadastro:null});
    if(accountDialog.open)accountDialog.close();
    if(!currentProfile)openProfileEditor();
    else profileBox.scrollIntoView({block:'center'});
  }
}

async function initAuth(){
  if(!supabaseClient){updateAccountUi();renderProfile();renderRequestList();return;}
  let activeUserId=null;
  const setSession=session=>{
    const user=session?.user||null;if(user?.id===activeUserId)return;activeUserId=user?.id||null;currentUser=user;currentProfile=null;userRequests=[];requestFilter='all';
    document.querySelectorAll('[data-request-filter]').forEach(button=>{const active=button.dataset.requestFilter==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    updateAccountUi();
    if(user){
      setTimeout(async()=>{await loadUserData();if(currentUser?.id===user.id)await continuePendingIntent();},0);
    }else{renderProfile();renderRequestList();}
  };
  supabaseClient.auth.onAuthStateChange((event,s)=>setTimeout(()=>{
    setSession(s);
    if(event==='PASSWORD_RECOVERY'){
      if(accountDialog.open)accountDialog.close();
      passwordMessage.textContent='';
      if(!passwordDialog.open)passwordDialog.showModal();
    }
  },0));
  const {data,error}=await supabaseClient.auth.getSession();if(error){accountMessage.textContent=T('sessionError');renderProfile();renderRequestList();return;}setSession(data.session);
}

async function init(){
  updateAccountUi();renderProfile();renderRequestList();
  await loadActiveCount();
  searchResults=[];resultsEl.innerHTML='<div class="empty-box"><strong>'+escapeHtml(T('initialSearch'))+'</strong><span>'+escapeHtml(T('onlyApproved'))+'</span></div>';
  document.querySelector('#invite-professional').href=professionalInviteUrl();
  await loadSharedProfile();
  await initAuth();
  const invitation=new URL(window.location.href).searchParams;
  if(invitation.get('buscar')==='1'&&!invitation.has('profissional')&&invitation.get('cadastro')!=='profissional'){
    const filters=referralFromUrl();
    cityInput.value=filters.city;
    stateSelect.value=filters.state;
    categorySelect.value=filters.category;
    termInput.value='';
    await searchProfessionals();
  }
  if(invitation.get('cadastro')==='profissional'&&invitation.get('abrir')==='1'&&!currentUser&&supabaseClient){
    accountMessage.textContent=T('registerSignInHelp');
    if(!accountDialog.open)accountDialog.showModal();
    updateIntentsInUrl({abrir:null});
  }
}
init();

// Language changes preserve filters, session and user-supplied content.
window.addEventListener('perto:language-change',()=>{
  renderCatalogCount();
  updateAccountUi();
  renderProfile();
  renderRequestList();
  document.querySelector('#invite-professional').href=professionalInviteUrl();
  refreshSearchSharing();
  if(searchResults.length)renderResults();
  else if(resultsEl.querySelector('.empty-box') && resultsEl.textContent.includes('Busque por cidade ou categoria.')){
    resultsEl.innerHTML='<div class="empty-box"><strong>'+escapeHtml(T('initialSearch'))+'</strong><span>'+escapeHtml(T('onlyApproved'))+'</span></div>';
  } else if(resultsEl.querySelector('.empty-box') && resultsEl.textContent.includes('Search by city or category.')){
    resultsEl.innerHTML='<div class="empty-box"><strong>'+escapeHtml(T('initialSearch'))+'</strong><span>'+escapeHtml(T('onlyApproved'))+'</span></div>';
  }
});
