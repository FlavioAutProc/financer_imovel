# Controle de Empréstimos — PWA

App para controlar pagamento de parcelas de empréstimos (carnê digital),
com painel de dívida, anexo de comprovantes e exportação para XLSX/PDF/imagem.
Todos os dados ficam salvos no IndexedDB **do próprio aparelho** — nada é
enviado para servidor nenhum.

## Arquivos

```
index.html      → o app em si
manifest.json   → metadados de instalação (nome, ícone, cor, modo standalone)
sw.js           → service worker: cache do app e das libs de exportação p/ uso offline
icons/          → ícones em vários tamanhos (192, 512, maskable, apple-touch)
```

## Por que isso precisa ser hospedado (não é só abrir o arquivo)

Service Worker **não funciona** abrindo `index.html` direto do disco
(`file://`). O navegador exige HTTPS (ou `http://localhost` em teste local).
Sem isso, o app até funciona, mas sem instalação nem modo offline.

## Como hospedar (grátis, sem servidor próprio)

**Opção 1 — GitHub Pages**
1. Crie um repositório novo no GitHub e suba estes arquivos (mantendo a
   pasta `icons/` como está).
2. Vá em *Settings → Pages*, escolha a branch (`main`) e a pasta raiz (`/`).
3. Espere alguns minutos — o GitHub te dá uma URL tipo
   `https://seuusuario.github.io/repositorio/`.
4. Abra essa URL no celular.

**Opção 2 — Netlify (arrastar e soltar)**
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arraste a pasta inteira do projeto para lá.
3. Netlify gera uma URL HTTPS na hora. Pronto.

**Opção 3 — Vercel**
1. `npx vercel` dentro da pasta do projeto (requer Node instalado), ou
   suba a pasta pelo painel web da Vercel.

Qualquer uma das três serve — o app não precisa de backend, é só arquivos
estáticos.

## Como instalar no celular depois de hospedado

- **Android/Chrome**: abra a URL; um banner "Instalar" aparece dentro do
  próprio app (ou use o menu ⋮ → "Adicionar à tela inicial").
- **iPhone/Safari**: abra a URL, toque em **Compartilhar** → **Adicionar à
  Tela de Início**. O iOS não expõe o prompt automático — é sempre manual,
  isso é limitação do próprio Safari, não do app.

Depois de instalado, abre em tela cheia, com ícone próprio, sem barra de
endereço — e continua funcionando **sem internet**, exceto na primeira vez
que precisa carregar (para o service worker guardar os arquivos em cache).

## Atualizando o app depois de hospedado

Sempre que editar `index.html`, `manifest.json` ou os ícones e subir de
novo, abra `sw.js` e **incremente a linha**:

```js
const CACHE_VERSION = 'v1'; // mude para 'v2', 'v3', etc.
```

Isso força o service worker a descartar o cache antigo e buscar os
arquivos novos. Sem isso, quem já instalou o app pode continuar vendo a
versão anterior por um tempo (esse é o comportamento normal de cache
offline, não é bug).

## Limitações importantes (honestidade em vez de venda)

- **Sem sincronização entre aparelhos.** Os dados vivem no IndexedDB do
  navegador/aparelho onde o app foi instalado. Trocar de celular ou
  reinstalar o navegador perde tudo — **use o botão de Backup (JSON)
  regularmente** e guarde o arquivo em outro lugar (e-mail, nuvem, etc.).
- **Limpar dados do site/app remove tudo**, inclusive comprovantes
  anexados (eles ficam no mesmo IndexedDB).
- **Offline cobre o app e as libs de exportação já usadas uma vez** — na
  primeiríssima abertura, é preciso estar online para o service worker
  baixar tudo.
