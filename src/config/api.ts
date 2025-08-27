// Configuração da API baseada no ambiente
export const getApiConfig = () => {
  const hostname = window.location.hostname;
  const isNgrok = hostname.includes('ngrok') || hostname.includes('ngrok-free.app');
  const isDevelopment = import.meta.env.MODE === 'development';
  
  if (isNgrok) {
    // Se estamos acessando via ngrok, usar a mesma URL para API
    return {
      baseURL: `${window.location.protocol}//${window.location.host}/api`,
      isNgrok: true
    };
  }
  
  if (isDevelopment) {
    // Em desenvolvimento local, usar proxy
    return {
      baseURL: '/api',
      isNgrok: false
    };
  }
  
  // Em produção
  return {
    baseURL: import.meta.env.VITE_API_URL || 'https://skinaecopecas.com.br/api',
    isNgrok: false
  };
};

export const API_CONFIG = getApiConfig();