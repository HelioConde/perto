# Perto

Marketplace local moderado para encontrar profissionais ativos por cidade/categoria e encaminhar **pedidos privados de orçamento**.

**Situação (12/10/2026):** MVP técnico preparado na branch `split/perto` do laboratório. As proteções de banco foram aplicadas ao `pizzaria-db` e os testes desktop/mobile são automatizados. O projeto **ainda não está publicado** num repositório físico próprio e **não deve receber cadastros públicos reais** antes de homologação.

## Recursos disponíveis

- Busca gratuita, sem conta, apenas com perfis ativos aprovados — sem anúncios de profissionais fictícios.
- Cadastro e edição de perfil profissional; conta nova entra como pendente para moderação.
- Conta Supabase Auth e envio de pedido privado; contato é acessível somente aos participantes.
- Lista de pedidos enviados/recebidos e cancelamento pelo próprio cliente.
- Idiomas PT-BR (padrão) e inglês, inclusive em mensagens dinâmicas principais.
- Layout responsivo, navegação por teclado, páginas legais e SEO básico.
- Banco com RLS, grants mínimos, quota inicial de 5 pedidos por conta/hora e um perfil por conta.
- Browser E2E desktop/mobile no GitHub Actions.

## Moderação segura

O painel administrativo fica em `admin.html` depois do deploy e requer uma conta cadastrada como moderadora no banco. Aprovações e rejeições são auditadas. Alterações relevantes em perfis antes aprovados devolvem o cadastro para revisão. Consulte [DEPLOY.md](DEPLOY.md) para conceder permissão sem expor chaves privadas.

## Arquitetura e QA

- Frontend HTML/CSS/JS.
- Backend compartilhado: Supabase `pizzaria-db`, tabelas `perto_professionals` e `perto_requests`.
- Migrations: `supabase/migrations/` — **as novas migrations dessa rodada já foram aplicadas ao banco**.
- Frontend possui **somente publishable key**; nunca adicionar credenciais privadas.

```bash
npm install
npm run check
npm run test:e2e
```

## Próximos passos

**[DEPLOY.md](DEPLOY.md)** — criar `HelioConde/perto`, migrar a branch, habilitar Pages, configurar redirect de autenticação e homologar com usuários reais.  
**[RELEASE_V1.md](RELEASE_V1.md)** — relatório de segurança/escopo e pendências antes do beta público.  
**[FULLSTACK.md](FULLSTACK.md)** — arquitetura do produto e roadmap.

Publicidade não intrusiva é o caminho principal de monetização do portfólio, **ainda desativada**. Consentimento e conformidade são pré-requisitos para sua ativação.
