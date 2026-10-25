# Validação da pré-qualificação

Execução em 25/10/2026 no navegador Chromium integrado, com o site real servido localmente. Os testes de conclusão usaram o harness de `tests/serve.py` para interceptar WhatsApp/GA4. Nenhuma mensagem real foi enviada.

| Verificação | Resultado observado |
| --- | --- |
| Acesso normal e abertura manual | `/` não abre a janela. O botão do herói abre e recebe o foco de volta ao fechar. |
| Abertura automática | `triagem=1` abre o dialog e foca o primeiro nome. |
| Respostas iniciais | Nenhum rádio marcado e nenhuma UF escolhida; 27 UFs únicas. |
| Validação | Nome vazio/espaços e ausência de vínculo, renda e UF impedem avanço. Erros em português e foco no primeiro campo inválido. Digitar não rouba o foco. |
| Voltar/fechar/reabrir | Nome, vínculo, renda e UF permanecem durante a sessão da página. |
| Matriz de profissão/renda | As 20 combinações (5 vínculos × 4 opções de renda) chegam à mensagem sem rejeição. |
| Estados | As 27 UFs foram selecionadas e chegaram à mensagem com a sigla correspondente. |
| Atribuição | Slugs dos dois anúncios reconhecidos; título com acento/espaços reconhecido; UTM desconhecida e ausência usam site. |
| Mensagem e destino | Número 5544988198287; `URL.searchParams.get('text')` igual ao texto mostrado, preservando acentos, valores e quebras de linha. |
| Privacidade da triagem | Zero escritas de respostas no Storage. URLs de navegação não recebem respostas. Os eventos contêm somente categoria genérica e nome da ação. |
| Analytics | Um evento de abertura, conclusão válida e tentativa de WhatsApp por fluxo; tentar novamente adiciona somente tentativa, sem nova conclusão. Sem `generate_lead` pela triagem. |
| Alternativas | Nova tentativa gera outra abertura. Cópia real conferida na área de transferência com dados fictícios. Falha simulada seleciona todo o texto e mostra instrução manual. |
| CDN indisponível | Removidos os scripts externos no harness; triagem continua abrindo, validando e preparando o WhatsApp. |
| Teclado | 12 Tabs consecutivos permanecem no dialog; Shift+Tab no início vai ao último botão; Escape fecha, libera a rolagem e devolve foco ao botão de entrada. |
| Responsividade | Conferida em 1440×1000, 390×844 e 320×568. Sem transbordamento horizontal; alternativas com pelo menos 48px; rolagem interna e botão final acessível em celular pequeno. |
| Sintaxe e diff | `node --check triagem.js` e `git diff --check` aprovados. |

O teste de Tab revelou passagem do foco pelo corpo da página no limite do dialog nativo. Foi adicionado um ciclo explícito de teclado e o cenário foi repetido com sucesso. Na revisão móvel, a largura nativa do dialog foi corrigida e as ações passaram a acompanhar a rolagem.

## Reproduzir

1. Iniciar `python3 tests/serve.py` na raiz do checkout e abrir os três links de entrada documentados no README.
2. Testar sem respostas, selecionar as opções, voltar, fechar, reabrir e concluir. Conferir mensagem, acentos, quebras de linha e número em `#qa-opens`.
3. Repetir com cada vínculo/faixa e cada UF. Os outputs de QA podem ser inspecionados no DOM, sem requisições ao WhatsApp.
4. Conferir `#qa-events`: somente `triagem_open`, `triagem_complete`, `triagem_whatsapp_open` e categoria `triagem`. `#qa-storage` deve continuar `[]` sem aceitar o banner de cookies preexistente.
5. Repetir com UTM inválida, sem UTM, `copy-failure=1` e `offline=1`.
6. Testar Tab, Shift+Tab e Escape, e os três tamanhos de tela acima. Recarregar e conferir que as respostas foram limpas.

## Limites da verificação

A abertura física de aplicativos nativos WhatsApp em Android/iOS e o envio final dependem do dispositivo do visitante; não foram executados. O teste de responsividade usa viewport do navegador, sem teclado virtual de um aparelho físico. A captura dos eventos foi local, sem gerar conversões reais no GA4. O comportamento preexistente do restante do site e de sua política de cookies foi preservado.
