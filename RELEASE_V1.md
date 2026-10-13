# Perto — Gate de beta técnico

**Revisado em:** 12/10/2026.

## Estado honesto

O **núcleo técnico** foi atualizado na branch `split/perto`, com melhorias de segurança aplicadas no Supabase `pizzaria-db` e testes Browser E2E desktop/mobile no GitHub Actions. **O produto ainda não foi lançado:** não existe o repositório físico `HelioConde/perto`, GitHub Pages do destino ainda não foi habilitado e não houve homologação humana com contas reais.

## Alterações da rodada

- Banco: `20261012225500_active_professional_quote_guard.sql` — só permite novas solicitações para profissional ativo.
- Banco: `20261012232000_perto_least_privilege.sql` — restringe grants de navegador e cancelamento.
- Banco: `20261012234000_perto_request_antispam.sql` — um perfil por dono, valida conteúdo e estabelece quota de 5 pedidos/hora.
- Banco: `20261012235000_perto_moderator_db_roles.sql` — moderação apenas por papéis administrativos confiáveis.
- Frontend: envio com status padrão de servidor, formulário corrigido, versão de cache isolada, seletor PT-BR/EN, fontes mais legíveis.
- QA: `tests/perto.spec.js` + `.github/workflows/perto-qa.yml` testam cenários em desktop e mobile, inclusive segurança de contratos frontend e versão inglês.
- Publicação: `.github/workflows/pages.yml`, páginas de privacidade/termos, sitemap/robots.

A verificação técnica de SQL confirma as políticas, grants e triggers instalados. Não alegar que os testes simulados substituem dois usuários autenticados reais.

Leia `DEPLOY.md` antes de migrar ou abrir o beta.

## Complemento da rodada seguinte

- Corrigido UPDATE de perfil: não envia mais `user_id` (campo imutável).
- Revisão automática de informações: perfis `active`, `paused` e `rejected` voltam a `pending` ao editar campos públicos importantes.
- Adicionadas tabelas `perto_moderators` e `perto_moderation_events` (RLS ativo e sem permissões de leitura direta no navegador).
- RPCs `perto_pending_moderation` e `perto_moderate_profile` validam o usuário e auditam decisões.
- Página `admin.html` restrita, com fila e diálogo de aprovação/rejeição, sem token administrativo no navegador.
- Testes Playwright adicionados para cadastro/edição de perfil e moderação autorizada/não autorizada (simulados).
- Sem atribuir um moderador real nem publicar a página; testar duas contas reais continua obrigatório.


## Continuação — acompanhamento de pedidos e autenticação

- Aplicada no banco a migration `20261013_perto_recipient_request_workflow.sql`, com RPC restrita ao prestador destinatário e auditoria de todas as atualizações de status.
- Criados botões acessíveis no painel de pedidos recebidos para marcar visualização, registrar contato e encerrar atendimento.
- Traduções PT-BR/EN adicionadas ao fluxo.
- Redirecionamento de confirmação e recuperação de conta configurado para o endereço base deste app; interface de nova senha com confirmação de dois campos.
- Novos testes Playwright cobrindo solicitação enviada, progressão do prestador, cancelamento pelo cliente, estados terminais e recuperação de conta. Os testes são simulados e não substituem homologação de duas contas reais.

## Revisão de integridade e usabilidade — rodada 13/10

- Validação SQL de auto-orçamento bloqueado e mudança obrigatória de status em sequência.
- Inbox privado com filtros de enviados/recebidos e atualização sob demanda; mantém o histórico visível se a busca falhar temporariamente.
- Mensagens detalhadas para limite por hora, perfil inativo e auto-orçamento.
- Atributo `hidden` reforçado no CSS para não exibir controles privados quando não há sessão.
- Fixtures de testes agora imitam a política de leitura por participante dos pedidos, evitando falsos positivos por retorno irrestrito do mock.
- Testes QA executados no GitHub Actions em Chromium desktop e celular: 42 aprovados na execução 38342657126.
- Repositório standalone `HelioConde/perto` ainda não encontrado; publicação e teste de ponta a ponta em contas reais continuam pendentes.

- Validados também erros de auto-orçamento e limite de cinco pedidos/hora no frontend, em PT-BR, como parte da rodada de 42 testes aprovados no CI.
