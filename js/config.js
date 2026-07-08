var CONFIG = {
  APP_NAME: 'Conexao Social',
  APP_TAGLINE: 'CRM para Impacto Social',
  VERSION: 'v1.0',

  SUPABASE_URL: 'https://mtahebtububylnmauzsa.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10YWhlYnR1YnVieWxubWF1enNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTc3NjQsImV4cCI6MjA5MjM5Mzc2NH0.Lm3N5d9xd_HAGKesQzHJXwho_xqHjZ705kvhhlEZoAo',
  GEMINI_WORKER_URL: 'https://jaf-crm-gemini-proxy.joseailton-ailtontinho.workers.dev/',

  DB_NAME: 'conexao_social_crm',
  DB_VERSION: 1,

  TABELAS: ['familias','doacoes','campanhas','voluntarios','captacao','financeiro','ocorrencias','agenda'],

  AREAS_ATUACAO: [
    'Educacao', 'Saude', 'Assistencia Social', 'Meio Ambiente',
    'Cultura', 'Esporte', 'Direitos Humanos', 'Seguranca Alimentar',
    'Habitação', 'Geracao de Renda', 'Infancia e Juventude', 'Idosos'
  ],

  TIPOS_DOACAO: [
    'Cesta Basica', 'Dinheiro', 'Alimentos', 'Roupas',
    'Material Escolar', 'Medicamentos', 'Moveis', 'Eletrodomesticos',
    'Brinquedos', 'Produtos de Higiene', 'Outros'
  ],

  STATUS_FAMILIA: ['Ativa', 'Em Acompanhamento', 'Inativa', 'Desligada'],
  STATUS_DOACAO: ['Recebida', 'Pendente', 'Confirmada', 'Cancelada'],
  STATUS_CAMPANHA: ['Planejamento', 'Ativa', 'Encerrada', 'Suspensa'],
  STATUS_VOLUNTARIO: ['Ativo', 'Disponivel', 'Indisponivel', 'Inativo'],
  STATUS_OCORRENCIA: ['Registrada', 'Em Andamento', 'Resolvida', 'Arquivada'],
  STATUS_AGENDA: ['Agendado', 'Confirmado', 'Realizado', 'Cancelado', 'Remarcado'],
  STATUS_FINANCEIRO: ['Pendente', 'Pago', 'Cancelado'],

  TIPOS_OCORRENCIA: [
    'Saude', 'Moradia', 'Alimentacao', 'Educacao',
    'Documentacao', 'Trabalho/Renda', 'Assistencia Juridica',
    'Apoio Psicologico', 'Outros'
  ],

  TIPOS_FINANCEIRO: ['Receita', 'Despesa'],
  CATEGORIAS_FINANCEIRAS: [
    'Doacao', 'Evento', 'Edital', 'Parceria', 'Mensalidade',
    'Aluguel', 'Agua/Luz', 'Material', 'Transporte', 'Alimentacao',
    'Salarios', 'Manutencao', 'Outros'
  ],

  PAGE_SIZE: 99999,

  ALLOWED_COLS: {
    familias: [
      'id','nome','responsavel','cpf','telefone','whatsapp','email',
      'endereco','cidade','estado','situacao','membros','renda_familiar',
      'observacoes','criado_em'
    ],
    doacoes: [
      'id','familia','tipo','quantidade','valor','data','campanha',
      'doador','status','observacoes','criado_em'
    ],
    campanhas: [
      'id','nome','descricao','tipo','area_atuacao','meta','arrecadado',
      'data_inicio','data_fim','status','observacoes','criado_em'
    ],
    voluntarios: [
      'id','nome','telefone','whatsapp','email','area_interesse',
      'disponibilidade','profissao','status','observacoes','criado_em'
    ],
    captacao: [
      'id','doador','valor','tipo','campanha','data',
      'forma_pagamento','status','observacoes','criado_em'
    ],
    financeiro: [
      'id','descricao','tipo','categoria','valor','data',
      'forma_pagamento','status','observacoes','criado_em'
    ],
    ocorrencias: [
      'id','data','familia','tipo','descricao','prioridade',
      'encaminhamento','status','observacoes','criado_em'
    ],
    agenda: [
      'id','data','hora','tipo','familia','contato','telefone',
      'status','descricao','criado_em'
    ]
  }
};

var PAGE_NAMES = {
  dashboard: 'Dashboard',
  familias: 'Familias',
  doacoes: 'Doacoes',
  campanhas: 'Campanhas',
  voluntarios: 'Voluntarios',
  captacao: 'Captacao de Recursos',
  financeiro: 'Financeiro',
  agenda: 'Agenda',
  ocorrencias: 'Ocorrencias',
  relatorios: 'Relatorios',
  sync: 'Sincronizacao'
};
