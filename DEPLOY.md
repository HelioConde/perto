# Perto — migração para o repositório independente

O projeto agora está em **[`HelioConde/perto`, branch `main`](https://github.com/HelioConde/perto)**. A branch `split/perto` do hub foi mantida como cópia histórica.

## 1. Repositório independente — concluído

- [x] Repositório público [HelioConde/perto](https://github.com/HelioConde/perto) criado.
- [x] Todos os 37 arquivos da branch `split/perto` importados em uma única migração para `main`.
- [x] Comparação de SHA dos blobs entre origem e destino: 37/37 arquivos idênticos.
- [x] Executados os primeiros workflows Static QA, Live Update QA e Live version no novo repositório.
- [x] Workflow GitHub Pages — ativado e publicação confirmada.

O histórico de trabalho anterior continua preservado em `HelioConde/ideias-ia-lab` como backup. A partir desta publicação, desenvolvimento e CI devem acontecer **somente em `HelioConde/perto`**.

## 2. Habilitar publicação

Em `HelioConde/perto`: Settings → Pages → Build and deployment → Source → **GitHub Actions**. Depois acione o workflow `Perto — Publish GitHub Pages`, se necessário.

URL de produção: https://helioconde.github.io/perto/ (Pages publicado; não confundir deploy com homologação de contas reais).

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
- [x] repositório `HelioConde/perto` criado e main importada (37/37 arquivos idênticos);
- [x] CI da main e GitHub Pages verdes no novo repositório;
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

## 12. Aquisição orgânica — perfis compartilháveis e convite de prestadores

- O dono de um perfil `active` pode compartilhar o link da ficha pública da homepage (`?profissional=UUID`) ou copiá-lo. O card público também permite compartilhamento por WhatsApp.
- Uma visita à URL com `profissional=UUID` executa consulta ao Supabase com filtros `status=active` e `id=UUID`; IDs malformados e perfis não aprovados não retornam os dados do profissional.
- Esta versão não cria páginas SEO por cidade nem gera resultados fictícios. O HTML da página tem metadados gerais da home e as prévias sociais de links individuais são **genéricas** (não personalizadas por perfil).
- A seção de convite explica que não existe promessa de clientes; quem compartilha escolhe voluntariamente abrir o WhatsApp. Nenhum marketing de disparo automático foi incluído.
- Verificar com usuários reais o fluxo: profissional cadastra → moderação aprova → profissional compartilha → cliente abre link → login → orçamento.
- Validar com 1 cidade piloto e categorias com oferta real, sem criar páginas doorway, e verificar textos LGPD e canal de contato antes de campanha de tráfego público.

## 13. Retomada segura após convite, login e confirmação

- Cadastro de profissional: clicar em **Cadastrar meu serviço** preserva `cadastro=profissional` na URL e em `emailRedirectTo`; após autenticação, abre o formulário caso o usuário ainda não tenha perfil.
- Pedido por link público: clicar em **Pedir orçamento** sem conta preserva apenas `profissional=UUID` e `pedido=1` no `emailRedirectTo`; após autenticação, retorna ao mesmo pedido, sem preencher ou enviar dados automaticamente.
- Validação de parâmetros impede incluir links externos no redirecionamento de autenticação. Os links são sempre relativos à própria instalação.
- O `redirectTo` de recuperação de senha continua apontando ao endereço base da aplicação.
- Testes automáticos em navegador (mock de autenticação) concluíram com **68 aprovações** na execução [38363431044](https://github.com/HelioConde/perto/actions/runs/38363431044).
- **Atenção:** antes de convidar prestadores reais, autorizar `https://helioconde.github.io/perto/**` em Supabase Auth → URL Configuration → Redirect URLs e homologar confirmação por e-mail/recuperação com contas reais.

## 14. Checklist de aquisição orgânica após a primeira auditoria real (13/10/2026)

O banco compartilhado tinha **zero profissionais cadastrados e zero pedidos** no momento da consulta. Portanto, a prioridade é aquisição piloto, não SEO massivo.

1. Escolher **uma cidade e duas categorias** em que exista oferta real.
2. Fazer 5 a 20 convites **manuais e consentidos** a profissionais, usando a busca vazia com filtros preenchidos. O link de convite retém apenas cidade, UF e categoria, com UF e categoria validadas.
3. Ajudar cada profissional a completar o cadastro. O status é pending até um moderador autorizado aprová-lo; não prometer aprovação automática.
4. Testar uma conta de cliente distinta, abrindo perfil público aprovado, autenticando e enviando pedido. Auditar a privacidade entre contas.
5. Medir profissionais aprovados, visitantes interessados e solicitações reais; só então considerar páginas locais com conteúdo original. Não fabricar anúncios ou avaliações.

**Redirecionamentos:** o projeto bnlvvsjgpywpbfhwdcan é compartilhado. Em [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/bnlvvsjgpywpbfhwdcan/auth/url-configuration), adicionar a URL base https://helioconde.github.io/perto/ e, para permitir parâmetros do fluxo, o padrão https://helioconde.github.io/perto/**. Não alterar a Site URL global. Confirmar que o template de e-mail padrão usa o link de confirmação que respeita redirectTo. A integração atual não permite ler ou alterar esta lista; marcar como pendente até homologar com e-mail real. Referência: https://supabase.com/docs/guides/auth/redirect-urls.


## 15. Landing page pública de convite

- Nova página convite.html, com Open Graph e conteúdo honesto para prestadores no beta.
- convite.js aceita exclusivamente cidade textual limitada, UF brasileira válida e categoria existente, monta o link de cadastro na home e só abre WhatsApp após clique.
- O sinal de cadastro profissional e abertura automática da autenticação representa um CTA explícito. A abertura automática é descartada antes do e-mail de confirmação; a intenção de cadastrar profissional, cidade, UF e categoria seguem para permitir retomada legítima.
- Páginas de perfis continuam somente com consulta pública aos perfis ativos, sem alegar SEO individual pré-renderizado.
- Antes da campanha, testar o cadastro e a confirmação em duas contas reais, a moderação e o pedido de orçamento. O projeto Supabase compartilhado ainda exige configuração/validação da allowlist de redirecionamentos.

## 16. Estado real da moderação — 13/10/2026

Uma consulta somente de leitura ao Supabase compartilhado confirmou: **0 moderadores autorizados, 0 profissionais cadastrados e 0 pedidos de orçamento**. O deploy está correto, mas **nenhuma conta pode aprovar perfis via painel** enquanto o papel de moderador não for atribuído por uma operação administrativa confiável.

Passos para habilitar com segurança:

1. Cadastrar uma conta real de moderação e confirmar o e-mail.
2. Conferir no painel Supabase o ID do usuário autenticado e autorizar **somente essa conta** pela operação SQL documentada na seção 6. Não atribuir privilégios a e-mails não verificados nem a todos os usuários.
3. Abrir https://helioconde.github.io/perto/admin.html como moderador, verificar a fila vazia e o acesso permitido. Abrir outra sessão como usuário comum e conferir o bloqueio.
4. Concluir o teste entre um profissional real, o moderador e um cliente diferente. Não criar perfis fictícios na base pública.
5. Revisar Auth Redirect URLs na configuração do projeto compartilhado (seção 9), sem alterar o Site URL de outros aplicativos.

A nova interface do prestador mostra o status (pendente, aprovado, rejeitado, pausado), permite atualização **manual** do status somente do próprio perfil e explica que mudanças em um perfil aprovado exigem nova moderação. O aplicativo não promete prazo de aprovação nem envia notificações inexistentes.

## 17. Pesquisa compartilhável e aquisição do primeiro cliente

Um visitante pode divulgar o **link de busca por região/categoria** gerado após pesquisar. O parâmetro `buscar=1` ativa os filtros de cidade, UF e categoria e executa a pesquisa na URL pública, sem autorização nem cookie de rastreamento. O campo de texto livre nunca entra nesse link. Não representar links de busca como páginas indexadas únicas, pois a home mantém `canonical` próprio.

Validação esperada: abrir `https://helioconde.github.io/perto/?buscar=1&cidade=Campinas&uf=SP&categoria=Eletricista`; o catálogo pode estar vazio enquanto não existirem anúncios aprovados. Compartilhar pesquisas é voluntário, não automático.

## 18. Contagem real do catálogo e início do beta

A contagem da home distingue **0 confirmado** de **erro de rede** e estado de carregamento. Caso a consulta ao Supabase confirme que não existem perfis ativos, a interface apresenta um convite explícito aos primeiros profissionais. Se a API estiver indisponível, nenhum número fictício será exibido. A interface fica coberta por E2E simulado e deve ser conferida em produção com a conexão anônima real.
