# Perto

Marketplace local moderado para encontrar profissionais ativos por cidade/categoria e encaminhar **pedidos privados de orçamento**.

**Situação (13/10/2026):** repositório independente [`HelioConde/perto`](https://github.com/HelioConde/perto) criado e **37 arquivos importados para `main`**, com comparação de conteúdo idêntica à branch original. As proteções já estão aplicadas no Supabase `pizzaria-db`. Os testes estáticos foram aprovados no novo repositório. **GitHub Pages já foi publicado** em https://helioconde.github.io/perto/, mas o produto não deve ser considerado beta público homologado até concluir testes com contas reais e revisar suporte/privacidade.

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

**[DEPLOY.md](DEPLOY.md)** — repositório e importação concluídos; GitHub Pages publicado; configurar os redirecionamentos de autenticação e homologar com usuários reais.  
**[RELEASE_V1.md](RELEASE_V1.md)** — relatório de segurança/escopo e pendências antes do beta público.  
**[FULLSTACK.md](FULLSTACK.md)** — arquitetura do produto e roadmap.

Publicidade não intrusiva é o caminho principal de monetização do portfólio, **ainda desativada**. Consentimento e conformidade são pré-requisitos para sua ativação.

## Aquisição orgânica de profissionais — experimento de lançamento

A primeira abordagem é concentrar o lançamento em **uma cidade e uma ou duas categorias**, em vez de gerar milhares de páginas vazias.

- Perfis **ativos e aprovados** podem ser compartilhados via WhatsApp e link direto `?profissional=UUID`. O link faz uma consulta pública ao banco e nunca mostra perfis pendentes, rejeitados ou privados.
- Perfil aprovado mostra botões de compartilhamento no catálogo e ao dono da conta; enquanto estiver pendente, não libera link no painel do profissional.
- A área **“Para quem presta serviços”** na home convida profissionais reais e explica cadastro gratuito no beta e moderação antes da publicação.
- Quando a pesquisa não retorna profissionais, há um convite para cadastrar um serviço, **sem inventar resultados**.
- **SEO responsável:** o sitemap lista somente páginas reais e úteis. Links `?profissional=UUID` são carregados por JavaScript, com metadados genéricos e canonical da home; **não são páginas individuais pré-renderizadas nem garantem indexação rica no Google/WhatsApp**. Criar páginas locais estáticas indexáveis somente após existir conteúdo real.
- O WhatsApp é aberto pelo clique do visitante; **não são enviados convites automáticos nem extraídos contatos**.
- Próximo gate: validar com contas reais, escolher região piloto, convidar cerca de 20 prestadores com consentimento e medir solicitações reais antes de investir em anúncios.

Para consultar a checklist de publicação/autenticação e limites do MVP, veja [DEPLOY.md](DEPLOY.md).

## Convites e cadastro sem perda de contexto

- Visitantes que começam a contratar por um link `?profissional=UUID` e precisam entrar recebem um redirecionamento de confirmação **restrito ao próprio Perto**, preservando a ficha do profissional e o pedido pendente.
- O botão de cadastro de prestador ativa `cadastro=profissional`; depois de confirmar o e-mail ou entrar numa conta existente, o editor de perfil abre quando ainda não existe perfil.
- Nenhum pedido ou perfil é criado automaticamente: o usuário precisa preencher e enviar o formulário.
- A recuperação de senha segue para o endereço base, sem carregar redirecionamentos de terceiros.
- **QA do onboarding:** 68 testes Playwright aprovados em [Perto MVP QA](https://github.com/HelioConde/perto/actions/runs/38363431044), incluindo retornos de confirmação, proteção de links e fluxo em dispositivos móveis.

## Primeiro público: aquisição local com formulário guiado

**Verificação do banco em 13/10/2026:** ainda não havia profissionais cadastrados (nenhum status na tabela) nem pedidos de orçamento. Não anunciar uma comunidade ativa antes de ter cadastros reais.

- A categoria do perfil agora é uma **lista de valores canônicos** igual à busca, incluindo “Outros serviços”. Isso impede diferenças de digitação que fariam o prestador não aparecer no filtro correto.
- Um resultado vazio com cidade, UF ou categoria selecionadas oferece um convite voluntário por WhatsApp com esses **critérios não pessoais** no link; não envia mensagens sozinho.
- O profissional convidado conserva cidade, estado e categoria ao se cadastrar, inclusive após confirmação do e-mail, e precisa finalizar o formulário antes de qualquer perfil ser criado.
- Categorias históricas fora da lista ainda podem ser editadas sem perda de informação.
- A versão pública continua sem anúncios falsos ou páginas artificiais para cidades vazias.
- O Supabase deste projeto é **compartilhado** com outros produtos. Não alterar o Site URL global. Verificar manualmente [Auth → URL Configuration](https://supabase.com/dashboard/project/bnlvvsjgpywpbfhwdcan/auth/url-configuration) e adicionar o endereço base do Perto e um padrão limitado à rota /perto/ que aceite o query string de cadastro.
- O conector atual não expõe a lista de Redirect URLs configurada; **não há confirmação de que estejam autorizadas**. Um teste com e-mail real é obrigatório antes de uma campanha.


## Página de convite para os primeiros profissionais

- Endereço: https://helioconde.github.io/perto/convite.html. Página HTML **indexável única**, com título e descrição Open Graph próprios, pensada para ser compartilhada em WhatsApp sem prometer contatos ou resultados fictícios.
- O botão de convite de busca sem resultados envia uma mensagem manual com link para essa página; cidade, UF e categoria são opcionais e validadas no cliente.
- A página explica o benefício, a moderação e os limites do beta, e encaminha à home para criar uma conta. O clique em **Cadastrar meu serviço** abre a autenticação diretamente, sem exigir outro clique.
- A identidade entre visita e cadastro é preservada no link e na confirmação de e-mail, mas **nenhum perfil ou orçamento é criado automaticamente**.
- O sitemap inclui apenas esta página genérica, não milhares de páginas locais. Não há ferramentas de disparo automático de mensagens.
- Verificação automática cobre prévia social, idioma, parâmetros inválidos, encaminhamento e preservação de dados. **Testes com Supabase Auth real permanecem pendentes de liberação dos redirect URLs**.
