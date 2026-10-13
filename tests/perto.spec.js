const { test, expect } = require('@playwright/test');

const activeProfile = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  display_name: 'Ana Eletricista',
  city: 'Brasília', state: 'DF', category: 'Eletricista',
  description: 'Instalação de tomadas e manutenção residencial.',
  price_from_cents: 8000, rating: null, status: 'active'
};
const pendingProfile = {
  ...activeProfile, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  display_name: 'Perfil ainda pendente', status: 'pending'
};

async function installMock(page, { user = null, profiles = [activeProfile, pendingProfile], requests = [] } = {}) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.addInitScript(({ user, profiles, requests }) => {
    const state = { user, profiles, requests, inserted: [], updated: [], rpcCalls: [], authCalls: [], authCallback: null, failNextRequestsLoad: false, errors: [] };
    window.__pertoTest = state;
    function query(table) {
      const opts = { mode: 'read', filters: [], limit: 100 };
      const chain = {
        select(_columns, settings = {}) { opts.head = settings.head || false; return chain; },
        eq(column, value) { opts.filters.push(p => p[column] === value); return chain; },
        ilike(column, term) {
          const needle = String(term).replace(/^%|%$/g, '').toLocaleLowerCase('pt-BR');
          opts.filters.push(p => String(p[column] || '').toLocaleLowerCase('pt-BR').includes(needle));
          return chain;
        },
        order() { return chain; },
        limit(value) { opts.limit = value; return chain; },
        insert(data) { opts.mode = 'insert'; opts.payload = data; return chain; },
        update(data) { opts.mode = 'update'; opts.payload = data; return chain; },
        run() {
          if (opts.mode === 'insert') {
            state.inserted.push({ table, payload: opts.payload });
            if (table === 'perto_requests') {
              const target = state.profiles.find(p => p.id === opts.payload.professional_id);
              if (!target || target.status !== 'active') {
                return { data: null, error: { message: 'perto_professional_not_active' } };
              }
              if (target.user_id === state.user?.id) {
                return { data: null, error: { message: 'perto_self_request_forbidden' } };
              }
              const recent=state.requests.filter(p => p.user_id === state.user?.id &&
                Date.now() - new Date(p.created_at).getTime() < 3600000);
              if (recent.length >= 5) {
                return { data: null, error: { message: 'perto_request_hourly_limit' } };
              }
            }
            if (table === 'perto_professionals' && ['status', 'rating'].some(k => Object.hasOwn(opts.payload, k))) {
              return { data: null, error: { message: 'Profile moderation fields are not writable by the client' } };
            }
            const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...opts.payload, status: table === 'perto_professionals' ? 'pending' : 'new' };
            if (table === 'perto_requests') state.requests.push(row);
            if (table === 'perto_professionals') state.profiles.push(row);
            return { data: row, error: null };
          }
          if (opts.mode === 'update') {
            state.updated.push({ table, payload: opts.payload });
            if (table === 'perto_professionals' && ['status', 'rating', 'user_id'].some(k => Object.hasOwn(opts.payload, k))) {
              return { data: null, error: { message: 'Profile owner and moderation fields are immutable' } };
            }
            const collection = table === 'perto_requests' ? state.requests : state.profiles;
            const row = collection.filter(p => opts.filters.every(f => f(p)))[0];
            if (!row) return { data: null, error: { message: 'No matching row' } };
            if (table === 'perto_professionals' && ['active', 'paused', 'rejected'].includes(row.status) &&
                ['display_name','city','state','category','description','price_from_cents'].some(k => Object.hasOwn(opts.payload, k) && row[k] !== opts.payload[k])) {
              row.status = 'pending';
            }
            Object.assign(row, opts.payload);
            return { data: row, error: null };
          }
          if (table === 'perto_requests' && state.failNextRequestsLoad) {
            state.failNextRequestsLoad = false;
            return { data: null, error: { message: 'Temporary network error' } };
          }
          const source = table === 'perto_requests'
            ? state.requests.filter(row => row.user_id === state.user?.id ||
                state.profiles.some(p => p.id === row.professional_id && p.user_id === state.user?.id))
            : state.profiles;
          const rows = source.filter(p => opts.filters.every(f => f(p))).slice(0, opts.limit);
          return { data: opts.head ? null : rows, error: null, count: rows.length };
        },
        maybeSingle() { const out = chain.run(); return Promise.resolve({ ...out, data: out.data?.[0] || null }); },
        single() { return Promise.resolve(chain.run()); },
        then(resolve, reject) { return Promise.resolve(chain.run()).then(resolve, reject); }
      };
      return chain;
    }
    const client = {
      from: query,
      rpc: async (name, args = {}) => {
        state.rpcCalls.push({ name, args });
        if (name !== 'perto_set_request_status') {
          return { data: null, error: { code: '42883' } };
        }
        const request = state.requests.find(row => row.id === args.p_request_id);
        const recipient = state.profiles.find(row => row.id === request?.professional_id);
        if (!request || recipient?.user_id !== state.user?.id || request.user_id === state.user?.id) {
          return { data: null, error: { code: '42501' } };
        }
        const valid = { new: 'viewed', viewed: 'contacted', contacted: 'closed' }[request.status];
        if (valid !== args.p_new_status) {
          return { data: null, error: { code: '22023' } };
        }
        request.status = valid;
        return { data: valid, error: null };
      },
      auth: {
        getSession: async () => ({ data: { session: state.user ? { user: state.user } : null }, error: null }),
        onAuthStateChange: callback => { state.authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; },
        signInWithPassword: async () => ({ error: { message: 'Not a real account' } }),
        signUp: async options => { state.authCalls.push({ type: 'signUp', options }); return { data: { session: null }, error: null }; },
        resetPasswordForEmail: async (email, options) => { state.authCalls.push({ type: 'reset', email, options }); return { error: null }; },
        updateUser: async options => { state.authCalls.push({ type: 'updateUser', options }); return { error: null }; },
        signOut: async () => { state.user = null; return { error: null }; }
      }
    };
    window.supabase = { createClient: () => client };
  }, { user, profiles, requests });
}

test('filters public active profiles and does not show pending profiles', async ({ page }) => {
  await installMock(page);
  await page.goto('/');
  await page.locator('#city').fill('Brasília');
  await page.locator('#state').selectOption('DF');
  await page.locator('#category').selectOption('Eletricista');
  await page.locator('#search-button').click();
  await expect(page.locator('.professional-card')).toHaveCount(1);
  await expect(page.locator('.professional-card')).toContainText('Ana Eletricista');
  await expect(page.locator('#results')).not.toContainText('Perfil ainda pendente');
  await page.locator('[data-request]').click();
  await expect(page.locator('#account-dialog')).toBeVisible();
  await expect(page.locator('#account-message')).toContainText('Entre ou crie uma conta');
});

test('authenticated customer can send a private request with no client-selected status', async ({ page }) => {
  await installMock(page, { user: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', email: 'cliente@example.test' } });
  await page.goto('/');
  await expect(page.locator('#sync-status')).toContainText('Conectado');
  await page.locator('#search-button').click();
  await page.locator('[data-request]').first().click();
  await expect(page.locator('#request-dialog')).toBeVisible();
  await page.locator('[name="contact"]').fill('cliente@example.test');
  await page.locator('[name="message"]').fill('Preciso instalar tomadas na cozinha.');
  await page.locator('#request-form [type="submit"]').click();
  await expect(page.locator('#request-dialog')).not.toBeVisible();
  await expect(page.locator('#request-list')).toContainText('Preciso instalar tomadas');
  const submitted = await page.evaluate(() => window.__pertoTest.inserted.find(x => x.table === 'perto_requests'));
  expect(submitted.payload.user_id).toBe('dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  expect(submitted.payload.professional_id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  expect(submitted.payload).not.toHaveProperty('status');
  await expect(page.locator('#request-list')).not.toContainText('cliente@example.test');
});

test('empty public catalog stays honest, no fictitious professionals', async ({ page }) => {
  await installMock(page, { profiles: [] });
  await page.goto('/');
  await expect(page.locator('#hero-count')).toHaveText('0');
  await page.locator('#search-button').click();
  await expect(page.locator('#results')).toContainText('Nenhum profissional ativo encontrado');
  await expect(page.locator('.professional-card')).toHaveCount(0);
});

test('English UI changes labels without changing canonical category values', async ({ page }) => {
  await installMock(page);
  await page.goto('/');
  await page.locator('[data-perto-lang="en"]').click();
  await expect(page).toHaveTitle('Perto — Find local professionals');
  await expect(page.locator('#search-button')).toHaveText('Find professionals');
  await expect(page.locator('#city')).toHaveAttribute('placeholder','e.g. Brasília');
  await page.locator('#category').selectOption('Eletricista');
  await expect(page.locator('#category')).toHaveValue('Eletricista');
  await page.locator('#search-button').click();
  await expect(page.locator('.professional-card')).toHaveCount(1);
  await expect(page.locator('.professional-card button')).toHaveText('Request a quote');
  await page.locator('.professional-card button').click();
  await expect(page.locator('#account-message')).toContainText('Sign in or create an account');
  await page.locator('#account-close').click();
  await page.locator('[data-perto-lang="pt-BR"]').click();
  await expect(page.locator('#search-button')).toHaveText('Buscar profissionais');
});

test('professional signup creates a pending, moderated profile', async ({ page }) => {
  const user = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', email: 'profissional@example.test' };
  await installMock(page, { user, profiles: [activeProfile] });
  await page.goto('/');
  await expect(page.locator('[data-create-profile]')).toBeVisible();
  await page.locator('[data-create-profile]').click();
  await page.locator('#profile-form [name="displayName"]').fill('Maria Reparos');
  await page.locator('#profile-form [name="city"]').fill('Goiânia');
  await page.locator('#profile-form [name="state"]').selectOption('GO');
  await page.locator('#profile-form [name="category"]').fill('Eletricista');
  await page.locator('#profile-form [name="description"]').fill('Instalação e manutenção elétrica residencial');
  await page.locator('#profile-form [name="priceFrom"]').fill('125');
  await page.locator('#profile-form [type="submit"]').click();
  await expect(page.locator('#profile-dialog')).not.toBeVisible();
  await expect(page.locator('#professional-profile')).toContainText('Maria Reparos');
  await expect(page.locator('.profile-status')).toHaveText('Em análise');
  const payload = await page.evaluate(() => window.__pertoTest.inserted.find(x => x.table === 'perto_professionals')?.payload);
  expect(payload.user_id).toBe(user.id);
  expect(payload.price_from_cents).toBe(12500);
  expect(payload).not.toHaveProperty('status');
  expect(payload).not.toHaveProperty('rating');
});

test('editing an approved professional profile does not write immutable columns and requires reapproval', async ({ page }) => {
  const user = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', email: 'profissional@example.test' };
  const owned = { ...activeProfile, id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', user_id: user.id };
  await installMock(page, { user, profiles: [activeProfile, owned] });
  await page.goto('/');
  await expect(page.locator('.profile-status')).toHaveText('Ativo');
  await page.locator('[data-edit-profile]').click();
  await page.locator('#profile-form [name="description"]').fill('Descrição atualizada e sujeita a nova revisão');
  await page.locator('#profile-form [type="submit"]').click();
  await expect(page.locator('#profile-dialog')).not.toBeVisible();
  await expect(page.locator('#professional-profile')).toContainText('Descrição atualizada');
  await expect(page.locator('.profile-status')).toHaveText('Em análise');
  const payload = await page.evaluate(() => window.__pertoTest.updated.find(x => x.table === 'perto_professionals')?.payload);
  expect(payload).toBeDefined();
  expect(payload).not.toHaveProperty('user_id');
  expect(payload).not.toHaveProperty('status');
  expect(payload).not.toHaveProperty('rating');
});

const professionalActor = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', email: 'prestador@example.test' };
const customerActor = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', email: 'cliente@example.test' };
const incomingRequest = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  user_id: customerActor.id,
  professional_id: activeProfile.id,
  category: 'Eletricista', city: 'Brasília',
  message: 'Gostaria de instalar uma tomada na cozinha.',
  contact: 'cliente@example.test', status: 'new', created_at: '2026-10-13T12:00:00Z'
};

test('recipient advances quote from new through contacted to closed without rewriting customer information', async ({ page }) => {
  await installMock(page, { user: professionalActor, profiles: [activeProfile], requests: [incomingRequest] });
  await page.goto('/');
  await expect(page.locator('#request-list')).toContainText('cliente@example.test');
  await expect(page.locator('[data-request-progress]')).toHaveText('Marcar como visualizado');
  await page.locator('[data-request-progress]').click();
  await expect(page.locator('.request-status')).toContainText('Visualizado');
  await expect(page.locator('[data-request-progress]')).toHaveText('Registrar contato');
  await page.locator('[data-request-progress]').click();
  await expect(page.locator('.request-status')).toContainText('Contato realizado');
  await expect(page.locator('[data-request-progress]')).toHaveText('Encerrar atendimento');
  await page.locator('[data-request-progress]').click();
  await expect(page.locator('.request-status')).toContainText('Encerrado');
  await expect(page.locator('[data-request-progress]')).toHaveCount(0);
  const state = await page.evaluate(() => window.__pertoTest);
  expect(state.requests[0].message).toBe(incomingRequest.message);
  expect(state.requests[0].contact).toBe(incomingRequest.contact);
  expect(state.rpcCalls.map(x => x.args.p_new_status)).toEqual(['viewed', 'contacted', 'closed']);
  expect(state.updated.filter(x => x.table === 'perto_requests')).toHaveLength(0);
});

test('customer can cancel a request but cannot update recipient workflow status', async ({ page }) => {
  await installMock(page, { user: customerActor, profiles: [activeProfile], requests: [incomingRequest] });
  await page.goto('/');
  await expect(page.locator('[data-request-progress]')).toHaveCount(0);
  await expect(page.locator('[data-cancel-request]')).toHaveCount(1);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-cancel-request]').click();
  await expect(page.locator('.request-status')).toContainText('Cancelado');
  await expect(page.locator('[data-cancel-request]')).toHaveCount(0);
  const state = await page.evaluate(() => window.__pertoTest);
  expect(state.requests[0].status).toBe('cancelled');
  expect(state.rpcCalls).toHaveLength(0);
});

test('closed or cancelled quotes expose no actions to professionals', async ({ page }) => {
  const requests = [
    { ...incomingRequest, status: 'closed' },
    { ...incomingRequest, id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', status: 'cancelled' }
  ];
  await installMock(page, { user: professionalActor, profiles: [activeProfile], requests });
  await page.goto('/');
  await expect(page.locator('[data-request-progress]')).toHaveCount(0);
  const state = await page.evaluate(() => window.__pertoTest);
  expect(state.rpcCalls).toHaveLength(0);
});

test('recipient workflow labels translate into English and keep statuses unchanged', async ({ page }) => {
  await installMock(page, { user: professionalActor, profiles: [activeProfile], requests: [incomingRequest] });
  await page.goto('/');
  await page.locator('[data-perto-lang="en"]').click();
  await expect(page.locator('[data-request-progress]')).toHaveText('Mark as viewed');
  await page.locator('[data-request-progress]').click();
  await expect(page.locator('.request-status')).toContainText('Viewed');
  await expect(page.locator('[data-request-progress]')).toHaveText('Mark as contacted');
});

test('email signup and reset links return to the Perto origin and path', async ({ page }) => {
  await installMock(page);
  await page.goto('/');
  await page.locator('#account-open').click();
  await page.locator('#auth-form [name="email"]').fill('cliente@example.test');
  await page.locator('#auth-form [name="password"]').fill('senha-segura-123');
  await page.locator('#sign-up').click();
  await expect(page.locator('#account-message')).toContainText('Confirme seu e-mail');
  await page.locator('#reset-password').click();
  await expect(page.locator('#account-message')).toContainText('link de recuperação');
  const calls = await page.evaluate(() => window.__pertoTest.authCalls);
  const expected = 'http://127.0.0.1:4179/';
  expect(calls.find(x => x.type === 'signUp').options.options.emailRedirectTo).toBe(expected);
  expect(calls.find(x => x.type === 'reset').options.redirectTo).toBe(expected);
});

test('password recovery event opens secure new-password UI and validates confirmation', async ({ page }) => {
  await installMock(page);
  await page.goto('/');
  await page.evaluate(() => window.__pertoTest.authCallback('PASSWORD_RECOVERY', {
    user: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', email: 'cliente@example.test' }
  }));
  await expect(page.locator('#password-dialog')).toBeVisible();
  await page.locator('#new-password-form [name="password"]').fill('senha-nova-123');
  await page.locator('#new-password-form [name="confirmPassword"]').fill('senha-diferente');
  await page.locator('#new-password-form button[type="submit"]').click();
  await expect(page.locator('#password-message')).toContainText('não conferem');
  let calls = await page.evaluate(() => window.__pertoTest.authCalls);
  expect(calls.filter(x => x.type === 'updateUser')).toHaveLength(0);
  await page.locator('#new-password-form [name="confirmPassword"]').fill('senha-nova-123');
  await page.locator('#new-password-form button[type="submit"]').click();
  await expect(page.locator('#password-dialog')).toBeHidden();
  calls = await page.evaluate(() => window.__pertoTest.authCalls);
  expect(calls.find(x => x.type === 'updateUser').options.password).toBe('senha-nova-123');
});

test('quote inbox filters sent and received requests independently', async ({ page }) => {
  const otherProfile = {
    ...activeProfile,
    id: '12121212-1212-4212-8212-121212121212',
    user_id: customerActor.id, display_name: 'Reparos Residenciais'
  };
  const outgoing = {
    ...incomingRequest, id: '13131313-1313-4313-8313-131313131313',
    user_id: professionalActor.id,
    professional_id: otherProfile.id,
    message: 'Preciso de ajuda em outro endereço.',
    contact: 'prestador@example.test'
  };
  await installMock(page, {
    user: professionalActor, profiles: [activeProfile, otherProfile],
    requests: [incomingRequest, outgoing]
  });
  await page.goto('/');
  await expect(page.locator('#request-count')).toHaveText('2');
  await expect(page.locator('.request-item')).toHaveCount(2);
  await page.locator('[data-request-filter="sent"]').click();
  await expect(page.locator('.request-item')).toHaveCount(1);
  await expect(page.locator('#request-list')).toContainText('outro endereço');
  await expect(page.locator('[data-request-progress]')).toHaveCount(0);
  await expect(page.locator('[data-request-filter="sent"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-request-filter="received"]').click();
  await expect(page.locator('.request-item')).toHaveCount(1);
  await expect(page.locator('#request-list')).toContainText('instalar uma tomada');
  await expect(page.locator('[data-cancel-request]')).toHaveCount(0);
  await expect(page.locator('[data-request-progress]')).toHaveCount(1);
  await page.locator('[data-request-filter="all"]').click();
  await expect(page.locator('.request-item')).toHaveCount(2);
});

test('inbox refresh discovers new requests and preserves existing data on transient failure', async ({ page }) => {
  await installMock(page, {
    user: professionalActor, profiles: [activeProfile], requests: [incomingRequest]
  });
  await page.goto('/');
  await expect(page.locator('#request-count')).toHaveText('1');
  await page.evaluate(() => {
    window.__pertoTest.requests.push({
      ...window.__pertoTest.requests[0],
      id: '14141414-1414-4414-8414-141414141414',
      message: 'Preciso de orientação para instalação de disjuntor.'
    });
  });
  await page.locator('#request-refresh').click();
  await expect(page.locator('#request-count')).toHaveText('2');
  await expect(page.locator('#request-list')).toContainText('disjuntor');
  await page.evaluate(() => {window.__pertoTest.failNextRequestsLoad = true;});
  await page.locator('#request-refresh').click();
  await expect(page.locator('#request-count')).toHaveText('2');
  await expect(page.locator('#request-list')).toContainText('disjuntor');
});

test('private inbox filters and refresh are hidden for signed-out visitors', async ({ page }) => {
  await installMock(page);
  await page.goto('/');
  await expect(page.locator('#request-refresh')).toBeHidden();
  await expect(page.locator('#request-filters')).toBeHidden();
  await expect(page.locator('#request-list')).toContainText('Entre para acompanhar pedidos');
});

test('self-directed quotes are refused with an understandable message', async ({ page }) => {
  await installMock(page, { user: professionalActor, profiles: [activeProfile] });
  await page.goto('/');
  await page.locator('#search-button').click();
  await page.locator('[data-request]').click();
  await page.locator('#request-form [name="contact"]').fill('prestador@example.test');
  await page.locator('#request-form [name="message"]').fill('Preciso de um orçamento para meu próprio perfil.');
  await page.locator('#request-form [type="submit"]').click();
  await expect(page.locator('#request-dialog')).toBeVisible();
  await expect(page.locator('#request-message')).toContainText('não pode solicitar orçamento ao próprio perfil');
  const submitted = await page.evaluate(() => window.__pertoTest.requests.length);
  expect(submitted).toBe(0);
});

test('five recent quotes trigger a localized hourly limit message', async ({ page }) => {
  const requests = Array.from({ length: 5 }, (_, index) => ({
    ...incomingRequest, id: '22222222-2222-4222-8222-' + String(index + 1).padStart(12, '0'),
    user_id: customerActor.id, created_at: new Date().toISOString()
  }));
  await installMock(page, { user: customerActor, profiles: [activeProfile], requests });
  await page.goto('/');
  await page.locator('#search-button').click();
  await page.locator('[data-request]').click();
  await page.locator('#request-form [name="contact"]').fill('cliente@example.test');
  await page.locator('#request-form [name="message"]').fill('Outro serviço que preciso orçar nesta semana.');
  await page.locator('#request-form [type="submit"]').click();
  await expect(page.locator('#request-dialog')).toBeVisible();
  await expect(page.locator('#request-message')).toContainText('Limite de 5 pedidos por hora');
  const count = await page.evaluate(() => window.__pertoTest.requests.length);
  expect(count).toBe(5);
});
