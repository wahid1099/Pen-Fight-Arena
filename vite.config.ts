import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    plugins: [react()],
    define: {
      __vite_firebase_config: JSON.stringify(env.VITE_FIREBASE_CONFIG || '')
    }
  };
});
