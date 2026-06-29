// Production build uses nginx proxy: browser calls /api, nginx forwards to backend.
export const environment = {
  production: true,
  apiUrl: '/api',
};
