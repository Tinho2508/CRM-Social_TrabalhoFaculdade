# Conexao Social - CRM para ONGs

Um sistema CRM completo e offline-first para organizações do terceiro setor, adaptado do JAF-CRM (seguros) para gestão de impacto social.

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript (vanilla) |
| Armazenamento Local | IndexedDB (via idb-keyval) |
| Cloud | Supabase (PostgreSQL + Realtime + Auth) |
| IA | Gemini AI (proxy Cloudflare Workers) |
| Exportação | SheetJS (XLSX) |

## Arquitetura

```mermaid
flowchart TB
    subgraph Frontend
        A[index.html] --> B[css/style.css]
        A --> C[js/config.js]
        A --> D[js/db.js]
        A --> E[js/ui.js]
        A --> F[js/app-core.js]
        A --> G[js/app-nav.js]
        A --> H[js/crud-engine.js]
        A --> I[js/pages-crud1.js]
        A --> J[js/pages-crud2.js]
    end

    subgraph Storage
        K[(IndexedDB<br/>Offline)]
    end

    subgraph Cloud
        L[Supabase<br/>PostgreSQL]
        M[Gemini AI<br/>Cloudflare Worker]
    end

    F --> K
    G --> K
    H --> K
    G --> L
    G --> M
```

## Fluxo de Dados

```mermaid
flowchart LR
    User([Usuario]) --> UI[Interface]
    UI --> CRUD[CRUD Engine]
    CRUD --> DB[(IndexedDB)]
    DB --> Sync[Sincronizacao]
    Sync --> SUP[Supabase]
    SUP --> UI
    UI --> AI[Gemini AI]
    AI --> UI
```

## Mapeamento de Entidades

| JAF CRM (Seguros) | Conexao Social (ONG) | Descricao |
|-------------------|---------------------|-----------|
| Clientes | Familias | Familias atendidas pela ONG |
| Apolices | Doacoes | Doacoes recebidas |
| Propostas | Campanhas | Campanhas de arrecadacao |
| Leads | Voluntarios | Voluntarios cadastrados |
| Producao | Captacao | Captacao de recursos |
| Comissoes | Financeiro | Fluxo financeiro |
| Sinistros | Ocorrencias | Ocorrencias sociais |
| - | Agenda | Agenda de atendimentos |

## Modelo de Dados

```mermaid
erDiagram
    FAMILIAS ||--o{ DOACOES : recebe
    FAMILIAS ||--o{ OCORRENCIAS : possui
    CAMPANHAS ||--o{ DOACOES : gera
    CAMPANHAS ||--o{ CAPTACAO : capta
    VOLUNTARIOS ||--o{ AGENDA : participa
    FAMILIAS ||--o{ AGENDA : agenda

    FAMILIAS {
        string id PK
        string nome
        string responsavel
        string cpf
        string telefone
        string endereco
        string situacao
        int membros
        float renda_familiar
    }

    DOACOES {
        string id PK
        string familia FK
        string tipo
        float valor
        date data
        string campanha FK
        string status
    }

    CAMPANHAS {
        string id PK
        string nome
        string tipo
        float meta
        float arrecadado
        date data_inicio
        date data_fim
        string status
    }

    VOLUNTARIOS {
        string id PK
        string nome
        string telefone
        string email
        string area_interesse
        string disponibilidade
        string status
    }

    OCORRENCIAS {
        string id PK
        date data
        string familia FK
        string tipo
        string prioridade
        string status
    }

    CAPTACAO {
        string id PK
        string doador
        float valor
        string campanha FK
        string forma_pagamento
        string status
    }

    FINANCEIRO {
        string id PK
        string descricao
        string tipo
        string categoria
        float valor
        string status
    }

    AGENDA {
        string id PK
        datetime data_hora
        string tipo
        string familia FK
        string contato
        string status
    }
```

## Funcionalidades

### Core
- CRUD completo para todas as entidades
- Busca rapida com atalho `Ctrl+K`
- Modo escuro
- Exportacao para Excel (XLSX)
- Visao 360° de familias
- Kanban para voluntarios

### Offline-first
- IndexedDB como armazenamento primario
- Sincronizacao bidirecional com Supabase
- Realtime updates via Supabase Subscription

### IA
- Integracao com Gemini AI para analise de dados
- Sugestoes inteligentes baseadas no contexto

## Como Usar

1. Abra o `index.html` no navegador (Chrome recomendado)
2. Faca login com qualquer email/senha (autenticacao local)
3. Configure as chaves do Supabase e Gemini no modal de Configuracoes (`Ctrl+,` ou menu)
4. Comece cadastrando familias, campanhas e voluntarios

### Atalhos de Teclado

| Atalho | Acao |
|--------|------|
| `Ctrl+K` | Busca rapida |
| `Ctrl+,` | Configuracoes |
| `Esc` | Fechar modal |

## Estrutura de Arquivos

```
crm-ongs/
├── index.html          # Entry point
├── README.md           # Documentacao
├── css/
│   └── style.css       # Estilos com tema ONG
└── js/
    ├── config.js       # Constantes, entidades, enums
    ├── db.js           # Camada IndexedDB
    ├── ui.js           # Helpers de interface
    ├── app-core.js     # Login, logout, dark mode, init
    ├── app-nav.js      # Navegacao, sync, Gemini, busca
    ├── crud-engine.js  # Engine CRUD generico
    ├── pages-crud1.js  # Dashboard, Familias, Doacoes, Campanhas, Voluntarios
    └── pages-crud2.js  # Captacao, Financeiro, Agenda, Ocorrencias, Relatorios, Sync
```

## Licenca

Projeto academico - Trabalho de Faculdade
