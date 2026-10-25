<div align="center">
  <h1>📍 Perto — Profissionais perto de você</h1>
  <p><strong>Encontre serviços por cidade e categoria, com perfis moderados e pedidos privados de orçamento.</strong></p>
  <p><a href="https://helioconde.github.io/perto/"><img alt="Abrir versão web" src="https://img.shields.io/badge/EXPERIMENTAR-PERTO-2563eb?style=for-the-badge"></a> <img alt="Status" src="https://img.shields.io/badge/status-homologa%C3%A7%C3%A3o%20beta-64748b?style=for-the-badge"></p>
  <p><a href="https://helioconde.github.io/perto/"><strong>Abrir Perto</strong></a> · <a href="https://helioconde.github.io/perto/convite.html"><strong>Sou profissional</strong></a> · <a href="DEPLOY.md"><strong>Publicação</strong></a></p>
</div>

## O que é?

O **Perto** é um experimento de marketplace local para aproximar clientes de prestadores de serviços, sem criar um catálogo fictício. Profissionais podem se cadastrar, completar o perfil e solicitar moderação; clientes pesquisam prestadores aprovados e enviam pedidos de orçamento.

**Situação:** website publicado, mas **a homologação com usuários reais e a operação de moderação ainda são etapas separadas**. Não é adequado anunciar disponibilidade de profissionais ou prometer respostas de orçamento sem dados atuais.

## Como funciona

| Para quem | Fluxo |
| --- | --- |
| **Cliente** | Filtra por cidade/categoria, consulta perfis aprovados, autentica-se e envia pedido |
| **Profissional** | Cria conta, preenche perfil, aguarda revisão e pode acompanhar solicitações |
| **Moderador** | Revisa perfis, aprova ou rejeita alterações e acompanha o histórico |

Perfis **pendentes, pausados ou rejeitados não aparecem no catálogo público**. Uma alteração relevante pode exigir revisão novamente.

### Compartilhamento sem inventar resultados

O projeto inclui uma [página de convite](https://helioconde.github.io/perto/convite.html) e links de busca compartilháveis. Quando uma pesquisa não retorna profissionais aprovados, a interface informa a ausência e oferece um convite para cadastramento — sem gerar anúncios artificiais.

## Funcionalidades documentadas

- Pesquisa pública por cidade, estado e categoria.
- Perfil profissional com aprovação moderada.
- Pedidos privados, acessíveis apenas a participantes autorizados.
- Autenticação pelo Supabase e políticas RLS.
- Página de convite de novos profissionais e compartilhamento voluntário.
- Português e inglês, design responsivo e páginas legais.
- Testes automatizados de navegação, UI e permissões.

## Tecnologia

**Frontend:** HTML, CSS e JavaScript, sem framework de build obrigatório.  
**Backend:** Supabase Auth e PostgreSQL com RLS.  
**Deploy:** GitHub Pages, com scripts de QA e Playwright.

Principais arquivos: `index.html`, `app.js`, `admin.html`, `admin.js`, `convite.html`, `convite.js`, `supabase-config.js`, `design-system.css`.

## Iniciar localmente

```bash
git clone https://github.com/HelioConde/perto.git
cd perto
python -m http.server 8000
```

Abra `http://localhost:8000`. Para executar verificações:

```bash
npm install
npm run check
npm run test:e2e
```

O funcionamento de cadastro e solicitações depende de um ambiente Supabase configurado corretamente. Consulte [DEPLOY.md](DEPLOY.md) e [FULLSTACK.md](FULLSTACK.md).

## Segurança e limites do beta

- **Somente perfis realmente aprovados** devem ser exibidos publicamente.
- Dados de contato e pedidos permanecem privados, com regras de permissão reforçadas no banco.
- O painel `admin.html` exige conta autorizada como moderadora, não apenas conhecimento da URL.
- É necessário homologar inscrições, confirmação de e-mail, permissões, cancelamentos e redirecionamentos.
- Testes anteriores e registros de catálogo vazio são **fotografias históricas**, não uma contagem em tempo real.

## Próximos passos

1. Validar o cadastro, a moderação e os pedidos com usuários de teste reais.
2. Documentar suporte, privacidade e processo de resposta a incidentes.
3. Concentrar a aquisição em uma cidade/categoria onde existam profissionais dispostos a participar.
4. Expandir a operação somente depois de comprovar utilidade e segurança.

### Mais documentação

[**Guia de publicação**](DEPLOY.md) · [**Arquitetura**](FULLSTACK.md) · [**Padrão visual**](DESIGN_SYSTEM.md) · [**Relatório do beta**](RELEASE_V1.md) · [**Histórico técnico completo**](docs/README_HISTORY_2026-10-25.md)

---

Desenvolvido por [Hélio Conde](https://github.com/HelioConde).
