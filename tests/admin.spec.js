const { test, expect } = require('@playwright/test');

async function mockAdmin(page, { moderator = false, signedIn = true } = {}) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.addInitScript(({ moderator, signedIn }) => {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'moderador@example.test' };
    const profiles = [{
      id: '22222222-2222-4222-8222-222222222222',
      display_name: '<img src=x onerror=alert(1)> Maria Serviços',
      city: 'São Paulo', state: 'SP', category: 'Eletricista',
      description: 'Instalação de tomadas e pequenos reparos',
      price_from_cents: 9000, status: 'pending', created_at: '2026-10-12T15:00:00Z'
    }];
    const state = { user: signedIn ? user : null, moderator, profiles, decisions: [] };
    window.__pertoAdminTest = state;
    window.supabase = {
      createClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: state.user }, error: null }),
          signInWithPassword: async () => { state.user = user; return { error: null }; },
          signOut: async () => { state.user = null; return { error: null }; },
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
        },
        rpc: async (functionName, args = {}) => {
          if (!state.moderator || !state.user) {
            return { data: null, error: { code: '42501', message: 'perto_moderator_required' } };
          }
          if (functionName === 'perto_pending_moderation') {
            return { data: state.profiles.filter(p => p.status === 'pending'), error: null };
          }
          if (functionName === 'perto_moderate_profile') {
            if (!['active', 'rejected'].includes(args.p_decision)) {
              return { data: null, error: { code: '22023', message: 'invalid_decision' } };
            }
            if (args.p_decision === 'rejected' && String(args.p_reason || '').trim().length < 8) {
              return { data: null, error: { code: '22023', message: 'reason_required' } };
            }
            const profile = state.profiles.find(p => p.id === args.p_professional_id);
            if (!profile) return { data: null, error: { code: 'P0002', message: 'not_found' } };
            profile.status = args.p_decision;
            state.decisions.push(args);
            return { data: args.p_decision, error: null };
          }
          return { data: null, error: { code: '42883', message: 'RPC not found' } };
        }
      })
    };
  }, { moderator, signedIn });
}

test('unauthorized signed-in account cannot read or approve profiles', async ({ page }) => {
  await mockAdmin(page, { moderator: false, signedIn: true });
  await page.goto('/admin.html');
  await expect(page.locator('#admin-message')).toContainText('não possui permissão');
  await expect(page.locator('#admin-queue-area')).toBeHidden();
  const decisions = await page.evaluate(() => window.__pertoAdminTest.decisions);
  expect(decisions).toEqual([]);
});

test('moderator can review and approve a queued professional', async ({ page }) => {
  await mockAdmin(page, { moderator: true });
  await page.goto('/admin.html');
  await expect(page.locator('#admin-message')).toContainText('Acesso de moderação autorizado');
  await expect(page.locator('#admin-count')).toHaveText('1');
  await expect(page.locator('.admin-card')).toHaveCount(1);
  // Display user-controlled content as text, not executable HTML.
  await expect(page.locator('.admin-card h3')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.admin-card h3 img')).toHaveCount(0);
  await page.locator('[data-review="active"]').click();
  await expect(page.locator('#admin-decision-dialog')).toBeVisible();
  await page.locator('#admin-decision-submit').click();
  await expect(page.locator('#admin-decision-dialog')).not.toBeVisible();
  await expect(page.locator('#admin-count')).toHaveText('0');
  await expect(page.locator('#admin-message')).toContainText('Decisão registrada');
  const decisions = await page.evaluate(() => window.__pertoAdminTest.decisions);
  expect(decisions).toEqual([{
    p_professional_id: '22222222-2222-4222-8222-222222222222',
    p_decision: 'active',
    p_reason: null
  }]);
});

test('rejection requires a written reason before the decision is sent', async ({ page }) => {
  await mockAdmin(page, { moderator: true });
  await page.goto('/admin.html');
  await expect(page.locator('#admin-count')).toHaveText('1');
  await page.locator('[data-review="rejected"]').click();
  await expect(page.locator('#admin-decision-dialog')).toBeVisible();
  await page.locator('#admin-decision-submit').click();
  const before = await page.evaluate(() => window.__pertoAdminTest.decisions.length);
  expect(before).toBe(0);
  await page.locator('#admin-decision-form textarea').fill('Perfil sem descrição verificável.');
  await page.locator('#admin-decision-submit').click();
  await expect(page.locator('#admin-count')).toHaveText('0');
  const decisions = await page.evaluate(() => window.__pertoAdminTest.decisions);
  expect(decisions).toHaveLength(1);
  expect(decisions[0].p_decision).toBe('rejected');
  expect(decisions[0].p_reason).toBe('Perfil sem descrição verificável.');
});

test('moderation queue stays private while signed out', async ({ page }) => {
  await mockAdmin(page, { moderator: true, signedIn: false });
  await page.goto('/admin.html');
  await expect(page.locator('#admin-queue-area')).toBeHidden();
  await page.locator('#admin-login [name="email"]').fill('moderador@example.test');
  await page.locator('#admin-login [name="password"]').fill('senha-segura-123');
  await page.locator('#admin-login button[type="submit"]').click();
  await expect(page.locator('#admin-count')).toHaveText('1');
  await page.locator('#admin-logout').click();
  await expect(page.locator('#admin-queue-area')).toBeHidden();
});
