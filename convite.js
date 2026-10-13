(() => {
  'use strict';
  const params=new URL(window.location.href).searchParams;
  const allStates=new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);
  const allCategories=new Set(['Eletricista','Encanador','Montador','Diarista','Reformas','Beleza','Aulas','Informática','Serviços domésticos','Outros serviços']);
  const city=String(params.get('cidade')||'').trim().replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,100);
  const proposedState=String(params.get('uf')||'').toUpperCase();
  const proposedCategory=String(params.get('categoria')||'');
  const state=allStates.has(proposedState)?proposedState:'';
  const category=allCategories.has(proposedCategory)?proposedCategory:'';
  const lang=params.get('lang')==='en'||(!params.has('lang')&&localStorage.getItem('perto-language')==='en')?'en':'pt-BR';
  if(lang==='en'){
    document.documentElement.lang='en';
    document.title='List your service for free | Perto';
    document.querySelectorAll('[data-en]').forEach(el=>{el.textContent=el.dataset.en;});
  }
  const base=new URL('./',window.location.href);
  const register=new URL(base.href);
  register.searchParams.set('cadastro','profissional');
  register.searchParams.set('abrir','1');
  const invite=new URL('convite.html',base);
  if(city){
    register.searchParams.set('cidade',city);
    invite.searchParams.set('cidade',city);
  }
  if(state){
    register.searchParams.set('uf',state);
    invite.searchParams.set('uf',state);
  }
  if(category){
    register.searchParams.set('categoria',category);
    invite.searchParams.set('categoria',category);
  }
  register.hash='para-profissionais';
  const focus=[category,city,state].filter(Boolean).join(' · ');
  const focusElement=document.querySelector('#convite-focus');
  if(focus){
    focusElement.textContent=(lang==='en'?'Invitation for: ':'Convite para: ')+focus;
    focusElement.hidden=false;
  }
  document.querySelector('#convite-register').href=register.href;
  const message=lang==='en'
    ?'Know someone who offers local services? Registration on Perto is free during beta, subject to review. '+invite.href
    :'Conhece alguém que presta serviços? O cadastro no Perto é gratuito durante o beta, sujeito à aprovação. '+invite.href;
  document.querySelector('#convite-share').href='https://wa.me/?text='+encodeURIComponent(message);
})();