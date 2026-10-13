# Perto — Design System v1.1

> Marketplace beta de serviços locais com tipografia legível, navegação transparente e dados reais.

## Taste Skill — direção visual

- Identidade: verde floresta e sálvia, fundo quase branco, superfícies leves, sem imagens genéricas que simulem pessoas ou avaliações.
- Manrope: títulos, números e marca. DM Sans: corpo, formulários e dados. Fallback sans-serif.
- Uma única chamada H1 por tela, eyebrows discretos, H2 claros e CTAs distinguíveis.
- Textos principais 15–17px, metadados 12–14px, rótulos 13px ou mais. Evitar fontes de 8–10px.
- Escala de espaçamento: 4, 8, 12, 16, 20, 24, 32, 40, 48 e 64px.

## Tokens globais

| Nome CSS | Cor | Uso |
| --- | --- | --- |
| --ink | #1b3025 | Texto principal |
| --muted | #506558 | Informações secundárias |
| --accent | #236747 | Botões e links de ação |
| --accent-dark | #194d35 | Hover e cabeçalhos |
| --bg | #f5f8f5 | Fundo do site |
| --soft | #eaf4ee | Blocos auxiliares |
| --line | #d7e4d9 | Divisórias |
| --focus | #b3e3c0 | Indicador de foco |

Arredondamentos: 12px / 18px / 26px. Sombra --shadow de baixa opacidade.

## Awesome Design — componentes consistentes

- Cabeçalho: .topbar e .brand em todas as páginas; .primary-nav na home para serviços e profissionais.
- Botões: .button.primary, .button.ghost e .button.text, alvos mínimos de 44px; ícones decorativos não substituem texto.
- Busca: .search-panel, .search-grid, .field. Use sempre labels associados aos campos.
- Cartões: .professional-card, .panel, .admin-card, .invite-benefits. Mesmas bordas, sombras e espaçamentos.
- Modais: .dialog e .dialog-head, foco visível, fechamento nativo por Escape e formulário preservado após erros.
- Feedback: .empty-box, .profile-guidance, .form-message. Zero de profissionais real nunca é confundido com indisponibilidade do banco.
- Páginas legais: .legal-content compartilha tipografia e largura de leitura; estilos locais duplicados foram retirados.

## Web Design Guidelines — auditoria

1. Skip link para o conteúdo principal aparece ao receber foco de teclado.
2. Landmarks main/nav e headings sem ambiguidades; status de busca anunciado com aria-live polite.
3. Foco visível em todos os controles, labels reais, textos de ajuda preservados e botões legíveis.
4. Contraste melhorado por um verde secundário mais escuro.
5. Sem overflow horizontal em 320, 390, 768 ou 1440px nas páginas home, convite, privacidade, termos e moderação.
6. Respeitar prefers-reduced-motion.
7. Não usar placeholders como rótulos; preservar o idioma selecionado na navegação.

## Image to Code — referência de tela renderizada

Nenhuma imagem ou screenshot externa foi anexada nesta rodada. O próprio HTML/CSS é a fonte visual; o Playwright gera capturas de tela da interface funcional. Para referência futura, comparar os screenshots com o CSS e traduzir diferenças em componentes editáveis em vez de inserir um print como interface.

## Playwright CLI — teste e screenshots

Comandos locais: npm install; npx playwright install chromium; npx playwright test.

GitHub Actions > Perto MVP QA > artefato perto-design-screenshots.
Capturas: home, convite, privacidade, termos e acesso de moderação; desktop 1440px e celular 390px. Apenas fixtures públicas, sem e-mails ou pedidos privados.

## Limites da validação

Testes simulados e screenshots não substituem cadastro com e-mail real, permissão de moderador, aprovação de profissional e orçamento entre duas contas. Esses testes operacionais permanecem separados.

## Auditoria automática WCAG (rodada seguinte)

Incluímos auditoria axe-core (WCAG 2.0/2.1 A e AA) via Playwright em Chromium nas cinco entradas: home, convite, termos, privacidade e moderação. A navegação para a seção English das páginas legais evita percorrer todo o texto português. Links de pular conteúdo são traduzidos em home e convite e os destinos de foco têm `tabindex=-1`.

O teste automatizado detecta parte dos problemas, mas não substitui auditorias manuais com leitor de tela, teclado, zoom e contraste em dispositivos reais.

## Diálogos explicáveis por leitor de tela

Além de títulos nomeados por `aria-labelledby`, as janelas de login, perfil profissional, orçamento, recuperação de senha e moderação agora relacionam explicitamente o contexto de cada formulário por `aria-describedby`. A associação é verificada no Playwright para todas as cinco janelas nos projetos desktop e mobile. Esse refinamento melhora a leitura de contexto, mas a homologação completa com leitor de tela real permanece uma etapa manual.
