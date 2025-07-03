// ==============================================
// CONFIGURAÇÃO DE AMBIENTE - SUPABASE
// ==============================================

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey?: string;
  };
  app: {
    env: 'development' | 'staging' | 'production';
    url: string;
    debugMode: boolean;
    enableLogging: boolean;
    enableRealtime: boolean;
  };
  integrations: {
    gaTrackingId?: string;
    sentryDsn?: string;
  };
}

// Função para validar se as variáveis obrigatórias estão presentes
function validateEnvVars(): void {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Variáveis de ambiente obrigatórias não encontradas:\n` +
      `${missingVars.map(v => `- ${v}`).join('\n')}\n\n` +
      `📝 Crie um arquivo .env na raiz do projeto com:\n` +
      `VITE_SUPABASE_URL=https://seu-projeto.supabase.co\n` +
      `VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui\n\n` +
      `Para mais detalhes, consulte o README.md`
    );
  }
}

// Validar na inicialização
validateEnvVars();

// Configuração principal da aplicação
export const appConfig: AppConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceKey: import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  },
  app: {
    env: (import.meta.env.VITE_APP_ENV as AppConfig['app']['env']) || 'development',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV,
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true' || import.meta.env.DEV,
    enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false', // habilitado por padrão
  },
  integrations: {
    gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  },
};

// Helper para debug
export const isDevelopment = () => appConfig.app.env === 'development';
export const isProduction = () => appConfig.app.env === 'production';
export const isDebugMode = () => appConfig.app.debugMode;

// Logger condicional
export const logger = {
  info: (...args: unknown[]) => {
    if (appConfig.app.enableLogging) {
      console.info('🔵 [INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (appConfig.app.enableLogging) {
      console.warn('🟡 [WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (appConfig.app.enableLogging) {
      console.error('🔴 [ERROR]', ...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (appConfig.app.debugMode) {
      console.debug('🟣 [DEBUG]', ...args);
    }
  },
};

// Log das configurações na inicialização (apenas em desenvolvimento)
if (isDevelopment()) {
  logger.info('🚀 Configurações da aplicação carregadas:', {
    env: appConfig.app.env,
    supabaseUrl: appConfig.supabase.url,
    realtimeEnabled: appConfig.app.enableRealtime,
    debugMode: appConfig.app.debugMode,
  });
} 