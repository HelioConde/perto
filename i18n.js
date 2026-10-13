(() => {
  'use strict';
  const pt = {
    pageTitle:'Perto — Profissionais e serviços por cidade', searchStatus:'Busca pública', signIn:'Entrar',
    localEyebrow:'SERVIÇOS LOCAIS', heroTitle:'Procure pelo serviço.<br><span>Converse com quem atende.</span>',
    heroCopy:'O Perto exibe somente perfis ativos no banco. Nenhum prestador fictício é inserido para preencher resultados.',
    activePros:'Profissionais ativos', available:'disponíveis no catálogo agora',
    city:'Cidade',state:'Estado',category:'Categoria',term:'Busca',allStates:'Todos',allCategories:'Todas',
    cityExample:'Ex.: Brasília', termExample:'Nome ou descrição',searchAction:'Buscar profissionais',
    resultsEyebrow:'RESULTADOS',resultsTitle:'Profissionais encontrados',searchToStart:'Faça uma busca para começar.',
    clientEyebrow:'PARA CLIENTES',myRequests:'Meus pedidos',proEyebrow:'PARA PROFISSIONAIS',myProfile:'Meu perfil',
    refreshRequests:'Atualizar',refreshingRequests:'Atualizando pedidos…',requestsRefreshed:'Pedidos atualizados.',
    requestsRefreshFailed:'Não foi possível atualizar os pedidos.',allRequests:'Todos',sentRequests:'Enviados',
    receivedRequests:'Recebidos',noRequestsFilter:'Não há pedidos neste filtro.',
    footer:'Perfis novos passam por moderação antes de aparecer na busca pública. Pedidos ficam privados entre as partes envolvidas.',
    quoteEyebrow:'PEDIDO DE ORÇAMENTO',quoteTitle:'Falar com profissional',close:'Fechar',
    replyContact:'Contato para retorno',contactExample:'WhatsApp ou e-mail',explainNeed:'Explique o que precisa',
    needExample:'Ex.: Preciso instalar duas tomadas e revisar um disjuntor...',sendQuote:'Enviar pedido privado',
    profileEyebrow:'PERFIL PROFISSIONAL',createProfile:'Cadastrar serviço',
    moderationCopy:'Novos perfis entram como <strong>pendentes</strong> e não aparecem publicamente até moderação.',
    professionalName:'Nome profissional',nameExample:'Ex.: João Elétrica',select:'Selecione',
    serviceDescription:'Descrição do serviço',descriptionExample:'Descreva o que você faz e sua área de atendimento.',
    priceFrom:'Preço a partir de (opcional)',priceExample:'Ex.: 80',saveProfile:'Salvar perfil',
    accountEyebrow:'SUA CONTA',accountTitle:'Entrar no Perto',accountCopy:'A busca pública não exige conta. Conta é necessária para enviar pedidos ou cadastrar perfil profissional.',
    email:'E-mail',password:'Senha',createAccount:'Criar conta',forgotPassword:'Esqueci a senha',
    passwordRecoveryEyebrow:'RECUPERAÇÃO DE CONTA',newPasswordTitle:'Criar nova senha',
    newPasswordHelp:'Escolha uma nova senha com pelo menos 8 caracteres.',newPassword:'Nova senha',
    confirmNewPassword:'Confirmar senha',saveNewPassword:'Atualizar senha',passwordsDoNotMatch:'As senhas não conferem.',
    updatingPassword:'Atualizando a senha…',passwordChanged:'Senha atualizada com sucesso.',passwordChangeFailed:'Não foi possível atualizar a senha. Peça um novo link de recuperação.',
    connectedAs:'Conectado como',signOut:'Sair da conta',
    categoryElectrician:'Eletricista', categoryPlumber:'Encanador',categoryFurniture:'Montador',
    categoryCleaner:'Diarista',categoryRenovation:'Reformas',categoryBeauty:'Beleza',
    categoryLessons:'Aulas',categoryIT:'Informática',categoryHome:'Serviços domésticos',
    loadingAccount:'Carregando conta…',connected:'Conectado',myAccount:'Minha conta',
    ratingNew:'Novo no Perto',from:'A partir de',requestQuote:'Pedir orçamento',consult:'Consultar',
    noProfessionals:'Nenhum profissional ativo encontrado.',
    noProfessionalsHelp:'Isso significa que não há perfil aprovado para esses filtros agora — não exibimos prestadores fictícios.',
    professionalsFound:'{count} profissional(is) ativo(s) encontrado(s).',
    noResults:'Nenhum resultado ativo para os filtros informados.',
    searchUnavailable:'Busca temporariamente indisponível.',searching:'Buscando perfis ativos…',
    searchFailedTitle:'Não foi possível concluir a busca.',tryAgain:'Tente novamente.',searchFailed:'Falha na busca.',
    mustLogin:'Entre ou crie uma conta para enviar o pedido.',
    noLoginRequests:'Entre para acompanhar pedidos.',privateRequests:'Os pedidos são privados.',
    contactProvided:'Contato informado pelo cliente',notProvided:'Não informado',
    sent:'Enviado',received:'Recebido',cancelQuote:'Cancelar pedido',
    markViewed:'Marcar como visualizado',markContacted:'Registrar contato',closeRequest:'Encerrar atendimento',
    changingRequest:'Atualizando andamento…',requestProgressSaved:'Andamento do pedido atualizado.',requestProgressFailed:'Não foi possível atualizar o andamento.',
    noRequests:'Nenhum pedido ainda.',noRequestsHelp:'Escolha um profissional ativo na busca para começar.',
    offerService:'Quer oferecer um serviço?',loginForProfile:'Entre para cadastrar seu perfil profissional.',
    noProfile:'Você ainda não tem perfil profissional.',
    profilePendingHelp:'O cadastro entra em análise antes de aparecer publicamente.',
    editProfile:'Editar informações',profileCost:'Preço inicial:',
    awaitingModeration:'Seu perfil ainda não aparece na busca pública. A ativação exige moderação.',
    sending:'Enviando pedido…',quoteSent:'Pedido enviado com privacidade.',quoteFailed:'Não foi possível enviar o pedido.',
    quoteRateLimited:'Limite de 5 pedidos por hora atingido. Tente novamente mais tarde.',
    quoteInactive:'Este profissional não está disponível para novos pedidos.',
    quoteSelfBlocked:'Você não pode solicitar orçamento ao próprio perfil.',
    confirmCancel:'Cancelar este pedido?',cancelled:'Pedido cancelado.',cancelFailed:'Não foi possível cancelar.',
    savingProfile:'Salvando perfil…',profileSaved:'Perfil salvo e enviado para análise.',
    profileUpdated:'Perfil atualizado.',profileModerationError:'O status do perfil só pode ser alterado pela moderação.',
    profileSaveError:'Não foi possível salvar o perfil.',
    signingIn:'Entrando…',accountConnected:'Conta conectada.',
    signupInvalid:'Informe um e-mail e uma senha com pelo menos 8 caracteres.',
    creatingAccount:'Criando conta…',accountCreated:'Conta criada e conectada.',
    confirmEmail:'Conta criada. Confirme seu e-mail e depois entre.',
    emailRequired:'Informe seu e-mail primeiro.',
    resetSent:'Se o e-mail estiver cadastrado, enviaremos um link de recuperação.',
    signedOut:'Você saiu da conta.',signOutError:'Não foi possível sair.',
    loadProfileFailed:'Não foi possível carregar seu perfil profissional.',loadRequestsFailed:'Não foi possível carregar seus pedidos.',
    sessionError:'Não foi possível verificar a sessão.',
    initialSearch:'Busque por cidade ou categoria.',onlyApproved:'Somente perfis ativos e aprovados serão exibidos.',
    invalidCredentials:'E-mail ou senha incorretos.',emailNotConfirmed:'Confirme seu e-mail antes de entrar.',
    emailAlready:'Este e-mail já possui conta.',shortPassword:'Use uma senha com pelo menos 8 caracteres.',
    authError:'Não foi possível concluir. Confira os dados e tente novamente.',
    statePending:'Em análise',stateActive:'Ativo',statePaused:'Pausado',stateRejected:'Não aprovado',
    quoteNew:'Novo',quoteViewed:'Visualizado',quoteContacted:'Contato realizado',
    quoteClosed:'Encerrado',quoteCancelled:'Cancelado',
    language:'Idioma da interface'
  };
  const en = {
    pageTitle:'Perto — Find local professionals',searchStatus:'Public search',signIn:'Sign in',
    localEyebrow:'LOCAL SERVICES',heroTitle:'Find the service.<br><span>Connect with a professional.</span>',
    heroCopy:'Perto displays only approved active profiles. We do not create fictional professionals to fill search results.',
    activePros:'Active professionals',available:'currently listed',
    city:'City',state:'State',category:'Category',term:'Search',allStates:'All',allCategories:'All',
    cityExample:'e.g. Brasília',termExample:'Name or description',searchAction:'Find professionals',
    resultsEyebrow:'RESULTS',resultsTitle:'Matching professionals',searchToStart:'Search to get started.',
    clientEyebrow:'FOR CUSTOMERS',myRequests:'My requests',proEyebrow:'FOR PROFESSIONALS',myProfile:'My profile',
    refreshRequests:'Refresh',refreshingRequests:'Refreshing requests…',requestsRefreshed:'Requests refreshed.',
    requestsRefreshFailed:'Could not refresh requests.',allRequests:'All',sentRequests:'Sent',
    receivedRequests:'Received',noRequestsFilter:'No requests in this filter.',
    footer:'New profiles are reviewed before appearing in public search. Requests remain private to participants.',
    quoteEyebrow:'QUOTE REQUEST',quoteTitle:'Contact professional',close:'Close',
    replyContact:'Contact for replies',contactExample:'WhatsApp or email',explainNeed:'Describe what you need',
    needExample:'e.g. Install two sockets and inspect a breaker...',sendQuote:'Send private request',
    profileEyebrow:'PROFESSIONAL PROFILE',createProfile:'Register your service',
    moderationCopy:'New profiles are <strong>pending</strong> and do not appear publicly until approved.',
    professionalName:'Professional name',nameExample:'e.g. Ana Electrician',select:'Select',
    serviceDescription:'Service description',descriptionExample:'Describe your services and service area.',
    priceFrom:'Starting price (optional)',priceExample:'e.g. 80',saveProfile:'Save profile',
    accountEyebrow:'YOUR ACCOUNT',accountTitle:'Sign in to Perto',
    accountCopy:'Public search does not require an account. Sign in to send quote requests or register as a professional.',
    email:'Email',password:'Password',createAccount:'Create account',forgotPassword:'Forgot password',
    passwordRecoveryEyebrow:'ACCOUNT RECOVERY',newPasswordTitle:'Create a new password',
    newPasswordHelp:'Choose a new password with at least 8 characters.',newPassword:'New password',
    confirmNewPassword:'Confirm password',saveNewPassword:'Update password',passwordsDoNotMatch:'Passwords do not match.',
    updatingPassword:'Updating password…',passwordChanged:'Password updated successfully.',passwordChangeFailed:'Could not update password. Request a new recovery link.',
    connectedAs:'Signed in as',signOut:'Sign out',
    categoryElectrician:'Electrician',categoryPlumber:'Plumber',categoryFurniture:'Furniture assembly',
    categoryCleaner:'Cleaning',categoryRenovation:'Renovations',categoryBeauty:'Beauty',
    categoryLessons:'Tutoring',categoryIT:'IT support',categoryHome:'Home services',
    loadingAccount:'Loading account…',connected:'Connected',myAccount:'My account',
    ratingNew:'New on Perto',from:'From',requestQuote:'Request a quote',consult:'Ask for price',
    noProfessionals:'No active professionals found.',
    noProfessionalsHelp:'There are no approved profiles matching these filters yet. We never show fake listings.',
    professionalsFound:'{count} active professional(s) found.',noResults:'No active results for these filters.',
    searchUnavailable:'Search temporarily unavailable.',searching:'Searching active profiles…',
    searchFailedTitle:'Could not complete the search.',tryAgain:'Please try again.',searchFailed:'Search failed.',
    mustLogin:'Sign in or create an account to send this request.',
    noLoginRequests:'Sign in to track your requests.',privateRequests:'Requests are private.',
    contactProvided:'Customer contact details',notProvided:'Not provided',
    sent:'Sent',received:'Received',cancelQuote:'Cancel request',
    markViewed:'Mark as viewed',markContacted:'Mark as contacted',closeRequest:'Close request',
    changingRequest:'Updating status…',requestProgressSaved:'Request status updated.',requestProgressFailed:'Could not update request status.',
    noRequests:'No requests yet.',noRequestsHelp:'Choose an active professional from search to start.',
    offerService:'Want to offer a service?',loginForProfile:'Sign in to create your professional profile.',
    noProfile:'You do not have a professional profile yet.',
    profilePendingHelp:'Your new profile is reviewed before appearing in public results.',
    editProfile:'Edit information',profileCost:'Starting price:',
    awaitingModeration:'Your profile is not publicly listed yet. Approval requires moderation.',
    sending:'Sending request…',quoteSent:'Private request sent.',quoteFailed:'Could not send your request.',
    quoteRateLimited:'You reached the limit of 5 requests per hour. Please try later.',
    quoteInactive:'This professional is not accepting new requests.',
    quoteSelfBlocked:'You cannot request a quote from your own profile.',
    confirmCancel:'Cancel this request?',cancelled:'Request cancelled.',cancelFailed:'Could not cancel request.',
    savingProfile:'Saving profile…',profileSaved:'Profile saved and submitted for review.',
    profileUpdated:'Profile updated.',profileModerationError:'Only moderators can change profile approval.',
    profileSaveError:'Could not save profile.',
    signingIn:'Signing in…',accountConnected:'Account connected.',
    signupInvalid:'Provide an email and a password with at least 8 characters.',
    creatingAccount:'Creating account…',accountCreated:'Account created and signed in.',
    confirmEmail:'Account created. Confirm your email before signing in.',
    emailRequired:'Enter your email first.',
    resetSent:'If the account exists, a password reset link will be sent.',
    signedOut:'You have signed out.',signOutError:'Could not sign out.',
    loadProfileFailed:'Could not load your profile.',loadRequestsFailed:'Could not load requests.',
    sessionError:'Could not verify your session.',
    initialSearch:'Search by city or category.',onlyApproved:'Only active approved profiles are listed.',
    invalidCredentials:'Incorrect email or password.',emailNotConfirmed:'Confirm your email before signing in.',
    emailAlready:'This email is already registered.',shortPassword:'Use a password with at least 8 characters.',
    authError:'Could not continue. Check your details and try again.',
    statePending:'Pending review',stateActive:'Active',statePaused:'Paused',stateRejected:'Rejected',
    quoteNew:'New',quoteViewed:'Viewed',quoteContacted:'Contacted',
    quoteClosed:'Closed',quoteCancelled:'Cancelled',language:'Interface language'
  };
  const all = { 'pt-BR': pt, en };
  let lang = localStorage.getItem('perto-language') === 'en' ? 'en' : 'pt-BR';
  function t(key, vars = {}) {
    let str = all[lang][key] || pt[key] || key;
    return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  }
  function apply() {
    document.documentElement.lang = lang;
    document.title = t('pageTitle');
    document.querySelectorAll('[data-perto-text]').forEach(el => { el.textContent = t(el.dataset.pertoText); });
    document.querySelectorAll('[data-perto-html]').forEach(el => { el.innerHTML = t(el.dataset.pertoHtml); });
    document.querySelectorAll('[data-perto-placeholder]').forEach(el => { el.placeholder = t(el.dataset.pertoPlaceholder); });
    document.querySelectorAll('[data-perto-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.pertoAria)); });
    document.querySelectorAll('[data-perto-lang]').forEach(el => {
      const selected = el.dataset.pertoLang === lang;
      el.classList.toggle('active', selected);
      el.setAttribute('aria-pressed', String(selected));
    });
  }
  const controls = document.querySelector('.top-actions');
  if (controls) {
    const field = document.createElement('div');
    field.className = 'language-toggle';
    field.setAttribute('role', 'group');
    field.setAttribute('aria-label', 'Idioma / Language');
    field.innerHTML = '<button type="button" data-perto-lang="pt-BR">PT</button><button type="button" data-perto-lang="en">EN</button>';
    controls.insertBefore(field, controls.firstChild);
    field.addEventListener('click', e => {
      const button = e.target.closest('[data-perto-lang]');
      if (!button) return;
      lang = button.dataset.pertoLang === 'en' ? 'en' : 'pt-BR';
      localStorage.setItem('perto-language', lang);
      apply();
      window.dispatchEvent(new Event('perto:language-change'));
    });
  }
  window.PERTO_I18N = { t, apply, get lang() { return lang; } };
  apply();
})();
