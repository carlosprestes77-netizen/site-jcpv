# Site JCPV Advocacia

Site estático em HTML/CSS/JavaScript, sem build, banco ou dependências novas.

## Executar a prévia local

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4173/?triagem=1`. O servidor deve ser iniciado na raiz do repositório. A política usada pela triagem aponta diretamente para o HTML existente e funciona também nesse servidor simples.

## Pré-qualificação e links dos anúncios

- Site normal: `/` — não abre a triagem automaticamente.
- Entrada genérica: `/?triagem=1`.
- O plantão termina: `/?triagem=1&utm_content=o-plantao-termina`.
- Anos de serviço: `/?triagem=1&utm_content=anos-de-servico`.

Use o domínio da **prévia** para revisar esta branch. Os mesmos caminhos poderão ser usados em `https://www.jcpvadvocacia.com.br` depois de uma publicação autorizada. Não alterar anúncios antes disso.

`utm_content` aceita as duas identificações acima, inclusive os títulos com espaços/acentos ou separados por `_`. Valores desconhecidos e ausência de identificação usam `site`; `triagem=1` controla apenas a abertura. Há também botões discretos de abertura no herói e rodapé.

## Comportamento e dados

Duas etapas: primeiro nome/vínculo e renda bruta/UF. Sem respostas previamente escolhidas. Voltar e fechar/reabrir preservam as respostas enquanto a página permanece aberta; recarregar limpa os dados. A faixa de R$ 4.500 é apenas um critério comercial de acompanhamento, não um requisito legal; a renda é declarada. Nenhuma profissão, faixa ou UF é rejeitada.

O número existente, `5544988198287`, é reaproveitado. O botão final cria um texto com quebras de linha, codifica-o com `encodeURIComponent` e tenta abrir o WhatsApp. O visitante precisa tocar em **Enviar** no WhatsApp. A tela oferece nova tentativa, cópia e seleção manual do texto quando a área de transferência falha. Nenhum envio é automatizado.

As respostas ficam somente na memória/DOM. Não há escrita em banco, cookies, localStorage ou sessionStorage pela triagem. Nome/renda não entram em URLs do site, logs ou analytics. A URL transitória do WhatsApp contém a mensagem para o encaminhamento solicitado e não fica em um `href`, evitando sua captura por medição automática de cliques de saída.

Eventos GA4 novos: `triagem_open`, `triagem_complete`, `triagem_whatsapp_open`, todos com apenas `event_category: triagem`. Conclusão significa formulário válido; abertura significa tentativa de abrir o aplicativo, nunca envio ou contato confirmado. A triagem usa script independente das animações do site.

## Testar sem abrir WhatsApp nem enviar analytics

```sh
python3 tests/serve.py
```

Abra `http://127.0.0.1:4174/?triagem=1`. Esse servidor de QA remove o carregamento do GA4 e substitui as chamadas ao WhatsApp e aos eventos por registros temporários no DOM (`#qa-opens`, `#qa-events`, `#qa-storage`). Não registra respostas em disco. `&copy-failure=1` simula falha de cópia; `&offline=1` remove scripts externos para verificar a independência do formulário. Usar apenas localmente. O site normal não carrega esse código de teste.

O roteiro e os resultados observados estão em [docs/validacao-triagem.md](docs/validacao-triagem.md). Validação de sintaxe: `node --check triagem.js`. Não há pacote npm nem comando de build neste projeto.

## Publicação

Hospedagem identificada: Vercel, projeto `site-jcpv`, conectado a `carlosprestes77-netizen/site-jcpv`. O deploy de produção inspecionado veio da branch `main`, commit `e38d815`, com os domínios `jcpvadvocacia.com.br` e `www.jcpvadvocacia.com.br`.

A integração Git cria prévias para branches de trabalho. Esta entrega usa `feature/triagem-whatsapp` e PR para revisão. Não executar merge, promoção de deploy ou `vercel --prod` nesta etapa. A publicação futura depende de aprovação e revisão do PR; mudanças em `main` podem disparar deploy automático de produção. `vercel.json` mantém os rewrites existentes das páginas legais.
