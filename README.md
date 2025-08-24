# taskflow-shell

Aplicação Host (Shell) em Angular para orquestrar Micro Frontends (Module Federation) focados em gestão de tarefas e colaboração em equipe. Este shell carrega remotes como taskflow-component, taskflow-reactive e taskflow-functional.

[![Angular](https://img.shields.io/badge/Angular-19-dd0031?logo=angular&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#licença)

## Sumário
- [Visão Geral](#visão-geral)
- [Requisitos](#requisitos)
- [Instalação e Setup](#instalação-e-setup)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Desenvolvimento (Host MFE)](#desenvolvimento-host-mfe)
- [Configuração de Remotes (Module Federation)](#configuração-de-remotes-module-federation)
- [Rotas do Host para Remotes](#rotas-do-host-para-remotes)
- [Theming e Estilos (SCSS/Tailwind)](#theming-e-estilos-scsstailwind)
- [Testes e Qualidade](#testes-e-qualidade)
- [Versionamento e Commits](#versionamento-e-commits)
- [Contribuição](#contribuição)
- [Licença](#licença)

## Visão Geral
Este repositório fornece o host Angular responsável por:
- Carregar e compor Micro Frontends via Module Federation.
- Disponibilizar navegação e layout unificados.
- Gerenciar configuração compartilhada (tema, autenticação, endpoints).

Remotes típicos integrados:
- taskflow-component (UI e serviços para gestão de tarefas) em http://localhost:4201
- taskflow-reactive (colaboração em tempo real) em http://localhost:4202
- taskflow-functional (analytics/relatórios) em http://localhost:4203

## Requisitos
- Node.js: 18.19+ ou 20.11+ (LTS recomendado) ou 22+
- npm 9+ (ou pnpm/yarn; atenção ao script clean que usa pnpm)
- Angular CLI 19+
- Navegador Chrome/Chromium para testes (Karma)

## Instalação e Setup
Clone o repositório e instale as dependências:
```bash
git clone https://github.com/RTAcps/taskflow-shell.git
cd taskflow-shell

# Instalação com pnpm (recomendado para compatibilidade com o script "clean")
pnpm install
# ou, se preferir, npm
npm install
```

## Scripts Disponíveis
Conforme package.json:

- Desenvolvimento (Host na porta padrão 4200):
  - `pnpm start` → `ng serve`
- Build:
  - `pnpm build` → `ng build`
  - `pnpm watch` → `ng build --watch --configuration development`
- Testes:
  - `pnpm test` → `ng test`
- Limpeza:
  - `pnpm clean` → remove dist, node_modules; limpa cache npm e reinstala com pnpm
- Dev Server para MF (subir host e remotes juntos, se configurado):
  - `pnpm run:all` → `@angular-architects/module-federation` dev server

Dica: use `npm run` ou `pnpm` para listar todos os scripts disponíveis.

## Desenvolvimento (Host MFE)
Suba somente o host:
```bash
pnpm start
# Servirá em: http://localhost:4200
```

Suba host + remotes em conjunto (seu ambiente local com MF):
```bash
pnpm run run:all
# O dev server do Module Federation tentará orquestrar host e remotes
```

Observações:
- Para que `run:all` funcione, configure o dev server do MF com seu manifesto/lista de remotes (veja a documentação do @angular-architects/module-federation). Um exemplo de manifesto é mostrado abaixo.

Exemplo de manifesto (genérico) para o dev server:
```json
{
  "$schema": "https://raw.githubusercontent.com/angular-architects/module-federation-plugin/main/libs/mf-dev-server/schema.json",
  "port": 4200,
  "remotes": {
    "taskflow": {
      "url": "http://localhost:4201/remoteEntry.js"
    },
    "reactive": {
      "url": "http://localhost:4202/remoteEntry.js"
    },
    "functional": {
      "url": "http://localhost:4203/remoteEntry.js"
    }
  }
}
```
Salve este arquivo conforme sua configuração do mf-dev-server e aponte-o no setup do plugin, caso necessário.

## Configuração de Remotes (Module Federation)
Exemplo de module-federation.config.js do Host (ajuste conforme seus nomes reais):
```js
// module-federation.config.js (Host)
module.exports = {
  remotes: {
    taskflow: 'taskflow@http://localhost:4201/remoteEntry.js',
    reactive: 'reactive@http://localhost:4202/remoteEntry.js',
    functional: 'functional@http://localhost:4203/remoteEntry.js',
  },
  // shared: { ... } // utilize as recomendações do schematic para compartilhar @angular/*, rxjs etc.
};
```

Dicas:
- Use variáveis de ambiente ou um manifesto JSON para resolver URLs dinamicamente entre ambientes (dev/homolog/prod).
- Mantenha as versões de Angular dos remotes alinhadas com o host para evitar conflitos de shared.

## Rotas do Host para Remotes
A forma mais simples de integrar é com loadRemoteModule:

```ts
// app.routes.ts (Host)
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';

export const routes: Routes = [
  {
    path: 'taskflow',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4201/remoteEntry.js',
        exposedModule: './Module' // ajuste conforme o remote expõe
      }).then((m) => m.RemoteEntryModule),
  },
  {
    path: 'reactive',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4202/remoteEntry.js',
        exposedModule: './Module'
      }).then((m) => m.RemoteEntryModule),
  },
  {
    path: 'analytics',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4203/remoteEntry.js',
        exposedModule: './Module'
      }).then((m) => m.RemoteEntryModule),
  },
  { path: '', redirectTo: 'taskflow', pathMatch: 'full' },
  { path: '**', redirectTo: 'taskflow' },
];
```

Se os remotes expuserem componentes standalone, é possível usar `loadComponent`:
```ts
// Exemplo alternativo:
{
  path: 'taskflow',
  loadComponent: () =>
    loadRemoteModule({
      type: 'module',
      remoteEntry: 'http://localhost:4201/remoteEntry.js',
      exposedModule: './TaskflowComponent',
    }).then((m) => m.TaskflowComponent),
}
```

## Theming e Estilos (SCSS/Tailwind)
O projeto inclui Tailwind CSS e SCSS.

- Dependências: tailwindcss 3.3.5, postcss, autoprefixer, @tailwindcss/forms.
- Passos típicos (confira seus arquivos):
  - tailwind.config.js com paths de templates (src/**/*.html, src/**/*.ts).
  - postcss.config.js habilitando tailwindcss e autoprefixer.
  - styles.css/scss incluindo diretivas:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```
  - Garanta que o arquivo de estilos global esteja referenciado em angular.json.
- Centralize tokens de tema (cores, espaçamentos) em SCSS e permita overrides via CSS variables, quando necessário.

## Testes e Qualidade
- Testes: Jasmine + Karma
  ```bash
  pnpm test
  ```
- Cobertura (exemplo):
  ```bash
  ng test --code-coverage
  ```
- Lint/Format (se configurados):
  - Recomenda-se ESLint e Prettier. Adicione scripts `lint` e `format` se necessário.

## Versionamento e Commits
- SemVer sugerido (MAJOR.MINOR.PATCH)
- Commits: Conventional Commits (feat:, fix:, chore:, refactor:, docs:)
- Como host, mantenha sincronização de versões de Angular com os remotes para minimizar conflitos em shared.

## Contribuição
1. Abra uma issue descrevendo bug/feature
2. Crie uma branch: `feat/nome-curto` ou `fix/nome-curto`
3. Siga Conventional Commits
4. Adicione/atualize testes e documentação
5. Abra um PR relacionando a issue

## Licença
MIT. Inclua um arquivo LICENSE na raiz do repositório e mantenha a referência aqui.

---
Notas:
- O script `clean` usa pnpm. Instale pnpm (`npm i -g pnpm`) ou ajuste o script para usar npm/yarn conforme sua preferência.
- `run:all` depende da configuração do mf-dev-server para orquestrar os remotes. Ajuste o manifesto conforme suas portas e nomes de exposição.
