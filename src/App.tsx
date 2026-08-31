import { useEffect } from 'react';

// This site is retired. The Ignite Brigade Finder now lives at the URL below.
// Every route (including /admin/*) permanently redirects there.
const NEW_URL = 'https://ignite.kumaraguru.in/find-brigade';

function App() {
  useEffect(() => {
    window.location.replace(NEW_URL);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        color: '#334155',
        textAlign: 'center',
        padding: '1.5rem',
      }}
    >
      <div>
        <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>This site has moved.</p>
        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
          Redirecting you to{' '}
          <a href={NEW_URL} style={{ color: '#2563eb' }}>
            ignite.kumaraguru.in/find-brigade
          </a>
          …
        </p>
      </div>
    </div>
  );
}

export default App;
