import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initializeApp, LibContext } from 'framework-react-core';

async function main() {
  await initializeApp({configFilePath: '/static-config.json'});
  const { App } = await import('./App');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LibContext provideRouter={false}>
        <App />
      </LibContext>
    </StrictMode>,
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize application:', error);
});
