export const backendRequestHeaders = {
  'ngrok-skip-browser-warning': 'true',
};

export const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
};
