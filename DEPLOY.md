# Perto — migração para o repositório independente

O código de produção está na branch **`split/perto`** do hub. **Não desenvolver na `main` de `ideias-ia-lab`**.

## 1. Criar o repositório físico

A integração GitHub atual não disponibiliza o comando de criação de repositórios. Crie manualmente o repositório público **`HelioConde/perto`** em [github.com/new](https://github.com/new), **sem inicializar com README, .gitignore ou licença**.

No seu computador, com Git instalado:

```powershell
git clone --branch split/perto --single-branch https://github.com/HelioConde/ideias-ia-lab.git perto
cd perto
git branch -m main
git remote set-url origin https://github.com/HelioConde/perto.git
git push -u origin main
```

Isso migra a árvore standalone atual, mantendo todas as melhorias e as migrations da branch.

## 2. Habilitar publicação

Em `HelioConde/perto`: Settings → Pages → Build and deployment → Source → **GitHub Actions**. Depois acione o workflow `Perto — Publish GitHub Pages`, se necessário.

URL prevista **depois de publicar**: https://helioconde.github.io/perto/ (não considerar como site ativo antes de o Pages ficar verde).

## 3. Configurar autenticação no Supabase existente

Projeto: `pizzaria-db` (`bnlvvsjgpywpbfhwdcan`). Em Auth → URL Configuration → Redirect URLs, adicione `https://helioconde.github.io/perto/**` conforme suporte da versão atual. **Não mude o Site URL global**: outros produtos compartilham esse backend.

Somente a publishable key aparece em `supabase-config.js`. Nunca publicar `service_role`/secret key.

## 4. Moderação segura antes da busca pública

O cliente pode cadastrar perfil, que entra em `pending`. No ambiente administrativo confiável do Supabase, revise o conteúdo do perfil, e só depois permita `status = 'active'`. O trigger `perto_lock_moderation_status` impede a alteração de aprovação por usuários comuns e aceita os papéis administrativos `postgres`, `supabase_admin` ou `service_role`.

Não divulgar como verificados: aprovação de conteúdo ainda não é validação de identidade/licença.

## 5. Gates para o beta

- [x] fluxos de descoberta, pedido privado e perfil construídos;
- [x] sem prestadores fictícios;
- [x] RLS de pedidos/participantes e filtro de profissional ativo;
- [x] grants mínimos (anon sem UPDATE/INSERT; auth sem editar status/rating profissional);
- [x] cancelamento só pelo solicitante e sem alterar o pedido;
- [x] máximo de 5 novos pedidos por conta/hora (a proteção por IP/CAPTCHA fica para um beta público maior);
- [x] um perfil profissional por conta, estado inicial pendente e moderação administrativa;
- [x] PT-BR/EN com categorias persistindo o mesmo valor de banco;
- [x] testes Browser E2E desktop/mobile versionados;
- [x] workflow de publicação, sitemap, robots e páginas legais preparados;
- [ ] repositório `HelioConde/perto` criado e main importada;
- [ ] CI da main e GitHub Pages verdes no novo repositório;
- [ ] validação real: duas contas, navegador desktop/mobile, pedido, privacidade, cancelamento e aprovação;
- [ ] canal de suporte/privacidade dedicado e revisão jurídica dos textos antes de abrir cadastro ao público;
- [ ] coleta de feedback real e testes de abuso/volume;
- [ ] revisão de indexação/SEO no endereço publicado.

**Não liberar cadastro público real enquanto os gates de suporte, privacidade e segurança operacional não estiverem fechados.**

## Próxima fase (V2)

Avaliações verificadas, denúncias, moderação em painel restrito, prevenção de abuso por IP/CAPTCHA, categorias normalizadas, notificações e páginas SEO de locais com oferta real. Publicidade é o modelo principal previsto para o portfólio e permanece desativada até revisão de consentimento e política publicitária.

## 6. Autorizar moderadores (obrigatório antes de aprovar perfis)

O painel restrito está em `/admin.html`, após a publicação. A fila usa a RPC `perto_pending_moderation` e as decisões auditadas usam `perto_moderate_profile`. A atribuição da função de moderador **não** é automática.

Após a conta real do moderador estar cadastrada no Auth, um administrador do Supabase pode executar no SQL Editor, trocando o endereço de exemplo por um email verificado/autorizado:

```sql
insert into public.perto_moderators (user_id, is_active)
select id, true from auth.users
where lower(email) = lower('EMAIL_DO_MODERADOR_AQUI')
on conflict (user_id) do update set is_active = true;
```

**Nunca** adicionar essa operação ao frontend ou publicar tokens administrativos. A tabela de moderadores e a auditoria não têm acesso direto para `anon` ou `authenticated`. As RPCs verificam a associação ativa em cada chamada. Nenhuma conta recebe esse papel por padrão.

Teste com duas contas reais: uma moderadora e uma não autorizada; a segunda deve receber acesso negado ao tentar chamar ambas as RPCs. Perfis editados após aprovação voltam para `pending` e devem ser revisados novamente.

## 7. Homologação da moderação

- [ ] Conta moderadora devidamente autorizada via SQL administrativo.
- [ ] Listagem pendente real acessível apenas ao moderador autorizado.
- [ ] Aprovar/rejeitar, exigir justificativa de rejeição e registrar auditoria.
- [ ] Usuário comum incapaz de acessar fila e alterar decisões via chamadas diretas.
- [ ] Profissional incapaz de autoaprovar ou moderar seu próprio perfil.
- [ ] Atualização de perfil aprovado retorna a `pending` sem quebrar a edição.


## 8. Fluxo de acompanhamento de orçamentos

O destinatário do pedido pode atualizar somente o próprio orçamento pela RPC `perto_set_request_status`:

`new → viewed → contacted → closed`.

O cliente mantém exclusivamente o cancelamento de um pedido não encerrado por meio da policy RLS existente. O profissional não altera o texto, o contato, o autor ou o destinatário. O trigger `perto_audit_request_status` registra as alterações, inclusive cancelamentos; a tabela de auditoria não é legível diretamente via API pública. O campo `contact` continua visível apenas aos participantes conforme a policy de leitura.

A migration `20261013_perto_recipient_request_workflow.sql` já foi aplicada ao backend compartilhado. **Não reaplicar manualmente em produção**. Verifique migration history antes de importar o repositório.

## 9. Redirecionamento de autenticação e recuperação de senha

O frontend envia `emailRedirectTo` na criação de conta e `redirectTo` na recuperação, ambos apontando para o endereço base da instalação atual. No Supabase Auth → URL Configuration → Redirect URLs, autorize o endereço exato de produção `https://helioconde.github.io/perto/**` antes de abrir cadastro e recuperação de senha.

A nova tela de alteração de senha reage ao evento `PASSWORD_RECOVERY` e utiliza `auth.updateUser({password})` após confirmação. **Valide com um e-mail real**: criar conta, confirmar e-mail, recuperar senha, cadastrar e autenticar novamente. Não mudar a configuração global `Site URL` do Supabase compartilhado sem avaliar o impacto nos outros sites.

## 10. Homologação real do atendimento

- [ ] Cliente A envia orçamento a um prestador aprovado B.
- [ ] Prestador B recebe e pode avançar `new → viewed → contacted → closed`.
- [ ] Cliente A acompanha status e não pode avançá-lo como prestador.
- [ ] Conta C sem vínculo não recebe o pedido nem altera o status via RPC.
- [ ] Cliente A pode cancelar antes do encerramento, mas não depois.
- [ ] Pedido cancelado ou encerrado não pode ser reativado pelo profissional.
- [ ] Mensagem original e contato continuam protegidos/imodificáveis.
- [ ] Link de confirmação de e-mail e recuperação retornam para o Perto.

## 11. Segurança de orçamentos e caixa de entrada — rodada de 13/10

- Migration `20261013013000_perto_quote_integrity.sql` aplicada no Supabase compartilhado. O servidor rejeita envio de orçamento ao próprio perfil e exige as transições `new → viewed → contacted → closed`, sem saltar etapas.
- A listagem privada possui os filtros **Todos**, **Enviados** e **Recebidos**, e botão **Atualizar** com estados e rótulos PT-BR/EN.
- Erros de limite de pedidos, auto-solicitação e destino indisponível são explicados sem expor dados privados.
- Em falha temporária de sincronização, a interface preserva os últimos pedidos carregados. Na troca de usuário, o filtro retorna ao padrão para evitar confusão entre contas.
- CSS aplica `[hidden]{display:none!important}` para que os controles privados não reapareçam por sobrescrita de estilos.
- Testes Playwright no GitHub Actions: cenários de filtro enviado/recebido, atualização posterior, erro temporário, sessão anônima, desktop e mobile. Não são teste com duas identidades reais em produção.
- As tabelas administrativas `perto_moderators`, `perto_moderation_events` e `perto_request_status_events` têm RLS sem políticas deliberadamente e nenhuma concessão direta ao navegador. Avisos informativos `RLS Enabled No Policy` são esperados para essas tabelas, **não** indicam que seus dados estejam públicos.

### Verificações restantes

- [ ] Testar manualmente que a conta A não consegue solicitar orçamento ao próprio perfil aprovado.
- [ ] Testar recarga do inbox com dois navegadores distintos após um cliente enviar solicitação.
- [ ] Confirmar no painel do Supabase que as URLs de autenticação do site publicado são aceitas.
- [ ] Validar a aprovação por moderador com pessoa real designada.
- [ ] Completar suporte/LGPD antes de aceitar inscrições públicas.

**Regressão de segurança:** 42 testes Chromium desktop/mobile aprovados em https://github.com/HelioConde/ideias-ia-lab/actions/runs/38342657126, incluindo bloqueio de auto-orçamento e limite por hora.
