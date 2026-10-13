(() => {
  'use strict';

  const client = window.IDEIAS_SUPABASE?.client || null;
  const $ = selector => document.querySelector(selector);
  const loginForm = $('#admin-login');
  const sessionBadge = $('#admin-session');
  const connectedBox = $('#admin-connected');
  const message = $('#admin-message');
  const queueArea = $('#admin-queue-area');
  const queue = $('#admin-queue');
  const dialog = $('#admin-decision-dialog');
  const decisionForm = $('#admin-decision-form');
  const decisionSubmit = $('#admin-decision-submit');
  const decisionError = $('#admin-decision-error');
  let user = null;
  let pendingProfiles = [];
  let refreshId = 0;

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }
  function feedback(text, kind = '') {
    message.textContent = text;
    message.className = 'admin-message' + (kind ? ' ' + kind : '');
  }
  function date(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
  }
  function price(value) {
    return value == null ? 'A combinar' :
      (Number(value) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function deny() {
    queueArea.hidden = true;
    pendingProfiles = [];
    queue.replaceChildren();
    $('#admin-count').textContent = '0';
  }
  function renderQueue() {
    $('#admin-count').textContent = String(pendingProfiles.length);
    if (!pendingProfiles.length) {
      queue.innerHTML = '<div class="empty-box"><strong>Nenhum perfil pendente.</strong><span>Quando houver novas inscrições, elas aparecerão aqui.</span></div>';
      return;
    }
    queue.innerHTML = pendingProfiles.map(profile => {
      const name = escapeHtml(profile.display_name);
      return `<article class="admin-card">
        <h3>${name}</h3>
        <p class="admin-category">${escapeHtml(profile.category)}</p>
        <p class="admin-description">${escapeHtml(profile.description)}</p>
        <dl>
          <div><dt>Cidade</dt><dd>${escapeHtml(profile.city)}/${escapeHtml(profile.state)}</dd></div>
          <div><dt>Preço inicial</dt><dd>${escapeHtml(price(profile.price_from_cents))}</dd></div>
          <div><dt>Cadastro</dt><dd>${escapeHtml(date(profile.created_at))}</dd></div>
        </dl>
        <div class="admin-buttons">
          <button type="button" class="button primary" data-review="active" data-id="${escapeHtml(profile.id)}">Aprovar</button>
          <button type="button" class="button reject" data-review="rejected" data-id="${escapeHtml(profile.id)}">Rejeitar</button>
        </div>
      </article>`;
    }).join('');
  }

  async function loadQueue() {
    if (!client || !user) return deny();
    const token = ++refreshId;
    feedback('Carregando perfis pendentes…');
    const { data, error } = await client.rpc('perto_pending_moderation');
    if (token !== refreshId || !user) return;
    if (error) {
      deny();
      feedback(error.code === '42501'
        ? 'Esta conta não possui permissão de moderação. Solicite a liberação ao administrador do banco.'
        : 'Não foi possível carregar a fila de moderação. Confira sua conexão e a configuração do backend.', 'error');
      return;
    }
    pendingProfiles = Array.isArray(data) ? data : [];
    queueArea.hidden = false;
    renderQueue();
    feedback('Acesso de moderação autorizado.', 'success');
  }

  async function refreshSession() {
    if (!client) {
      deny();
      feedback('Serviço de autenticação indisponível.', 'error');
      return;
    }
    const token = ++refreshId;
    const { data, error } = await client.auth.getUser();
    if (token !== refreshId) return;
    user = error ? null : data?.user || null;
    loginForm.hidden = Boolean(user);
    connectedBox.hidden = !user;
    sessionBadge.textContent = user ? 'Sessão ativa' : 'Sem sessão';
    $('#admin-email').textContent = user?.email || '';
    if (!user) {
      deny();
      feedback(error && !/session missing/i.test(error.message || '')
        ? 'Não foi possível validar a sessão. Tente entrar novamente.'
        : 'Entre com uma conta autorizada a moderar perfis.');
      return;
    }
    await loadQueue();
  }

  function openDecision(profileId, action) {
    if (!['active', 'rejected'].includes(action)) return;
    const profile = pendingProfiles.find(profile => profile.id === profileId);
    if (!profile) return;
    decisionForm.reset();
    decisionForm.elements.profileId.value = profile.id;
    decisionForm.elements.decision.value = action;
    $('#admin-decision-title').textContent = action === 'active' ? 'Aprovar profissional' : 'Rejeitar profissional';
    $('#admin-decision-profile').textContent = profile.display_name + ' · ' + profile.category + ' · ' + profile.city + '/' + profile.state;
    const reason = decisionForm.elements.reason;
    reason.required = action === 'rejected';
    reason.minLength = action === 'rejected' ? 8 : 0;
    decisionSubmit.textContent = action === 'active' ? 'Confirmar aprovação' : 'Confirmar rejeição';
    decisionError.textContent = '';
    dialog.showModal();
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client || !loginForm.reportValidity()) return;
    const button = loginForm.querySelector('[type="submit"]');
    button.disabled = true;
    feedback('Autenticando…');
    try {
      const { error } = await client.auth.signInWithPassword({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value
      });
      loginForm.elements.password.value = '';
      if (error) throw error;
      await refreshSession();
    } catch {
      feedback('Não foi possível entrar. Confira suas credenciais.', 'error');
    } finally {
      button.disabled = false;
    }
  });
  $('#admin-logout').addEventListener('click', async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) feedback('Não foi possível encerrar a sessão.', 'error');
    else await refreshSession();
  });
  $('#admin-refresh').addEventListener('click', loadQueue);
  queue.addEventListener('click', event => {
    const button = event.target.closest('[data-review]');
    if (button) openDecision(button.dataset.id, button.dataset.review);
  });
  $('#admin-decision-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  decisionForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client || !user || !decisionForm.reportValidity()) return;
    decisionSubmit.disabled = true;
    decisionError.textContent = 'Registrando decisão…';
    try {
      const { error } = await client.rpc('perto_moderate_profile', {
        p_professional_id: decisionForm.elements.profileId.value,
        p_decision: decisionForm.elements.decision.value,
        p_reason: decisionForm.elements.reason.value.trim() || null
      });
      if (error) throw error;
      dialog.close();
      await loadQueue();
      if (!queueArea.hidden) feedback('Decisão registrada e perfil atualizado.', 'success');
    } catch (error) {
      console.error(error);
      decisionError.textContent = error.code === '42501'
        ? 'Você não tem autorização para aprovar este perfil.'
        : 'Falha ao registrar a decisão. Atualize a fila e tente novamente.';
    } finally {
      decisionSubmit.disabled = false;
    }
  });

  if (client) {
    client.auth.onAuthStateChange(() => setTimeout(refreshSession, 0));
  }
  refreshSession();
})();