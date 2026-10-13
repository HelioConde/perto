# Perto — arquitetura fullstack

Repositório individual planejado: `HelioConde/perto`.

## Produto

Marketplace local mínimo para buscar profissionais aprovados por cidade/categoria e enviar pedidos privados de orçamento.

## Backend compartilhado

Supabase `pizzaria-db`.

Tabelas:
- `perto_professionals`
- `perto_requests`
- `product_subscriptions`

## Implementado

- busca pública sem exigir conta;
- filtro por cidade, estado, categoria e termo;
- somente perfis com `status = active` aparecem publicamente;
- estado vazio honesto: nenhum prestador fictício é criado;
- cards com nome, categoria, descrição, cidade/UF, preço inicial e rating quando existir;
- Supabase Auth para clientes/profissionais;
- pedido privado de orçamento com bloqueio de solicitação ao próprio perfil;
- contato de retorno armazenado no pedido e visível somente aos participantes;
- histórico de pedidos enviados e recebidos com filtros e sincronização manual sem apagar dados após falha temporária;
- cancelamento pelo solicitante;
- cadastro/edição de perfil profissional;
- novos perfis sempre entram como `pending`;
- trigger no banco impede autoaprovação por usuário autenticado;
- índice de busca por status/UF/cidade/categoria;
- índices de pedidos;
- colunas antigas `phone` e `whatsapp` não possuem permissão SELECT para `anon` nem `authenticated`;
- frontend seleciona apenas colunas públicas seguras;
- grants por coluna para impedir alterar proprietário, notas, status de moderação e texto original dos pedidos;
- quota inicial de 5 solicitações de orçamento por usuário/hora e validação de destino ativo no banco;
- perfil editado exige reaprovação; índice único evita múltiplos perfis por conta;
- painel administrativo com funções protegidas, auditoria e justificativa de rejeição;
- suporte a PT-BR e inglês;
- testes E2E simulados para desktop/mobile e fluxo da moderação;
- UI própria responsiva;
- CI dedicado.

## Moderação

O proprietário do perfil pode editar as informações, mas não pode promover o próprio `status` para `active`.

A moderação usa `admin.html` com Supabase Auth e RPCs `perto_pending_moderation` / `perto_moderate_profile`. Apenas usuários registrados em `perto_moderators` pelo administrador legítimo conseguem utilizar as funções. Aprovações e rejeições geram auditoria em `perto_moderation_events`. Alterações relevantes em perfis já aprovados retornam a `pending`. É proibido moderar o próprio perfil.

## Privacidade

A busca pública não expõe telefone, WhatsApp nem contato do cliente.

O cliente informa uma forma de retorno dentro de `perto_requests.contact`; a policy permite leitura do pedido ao solicitante e ao dono do perfil associado.

## Próximas entregas

- homologação de cadastro/aprovação/rejeição com dois usuários reais e permissão de moderador configurada;
- avaliações verificadas;
- denúncia e bloqueio;
- rate limit avançado por IP/dispositivo e CAPTCHA quando houver público (quota por usuário já aplicada);
- categorias padronizadas;
- páginas SEO por categoria + cidade quando houver oferta real;
- notificações de novo pedido;
- homologar com usuários reais a RPC de andamento do atendimento (já implementada);
- verificação de identidade/empresa quando fizer sentido.

## Monetização

Plano para profissionais, destaque patrocinado claramente identificado ou cobrança por lead qualificado.

## QA obrigatório

- nenhum resultado;
- cidade com acento;
- filtros combinados;
- perfil pending não aparece;
- tentativa de autoaprovação;
- pedido sem login;
- pedido privado;
- cancelamento;
- profissional vê pedidos dirigidos ao próprio perfil;
- contato não aparece publicamente;
- isolamento RLS;
- mobile;
- moderação.
