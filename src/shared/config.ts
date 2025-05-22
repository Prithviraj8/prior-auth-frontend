const USE_PROD_BACKEND = true; // Set to false to use localhost

export const API_BASE_URL = USE_PROD_BACKEND
  ? 'https://prior-auth-backend.vercel.app'
  : 'http://localhost:8000'; 