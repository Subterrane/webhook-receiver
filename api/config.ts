export function getConfig() {
  // Prefer VERCEL_URL_OVERRIDE for production URL if set
  const vercelUrl = process.env.VERCEL_URL_OVERRIDE || process.env.VERCEL_URL || 'localhost:3000';
  const protocol = vercelUrl.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${vercelUrl}`;

  return {
    onelogin: {
      issuer: process.env.ONELOGIN_ISSUER,
      client_id: process.env.ONELOGIN_CLIENT_ID,
      client_secret: process.env.ONELOGIN_CLIENT_SECRET,
      redirect_uri: `${baseUrl}/api/callback`,
      post_logout_redirect_uri: `${baseUrl}/api`
    },
    cookie: {
      name: 'auth_session',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 86400
      }
    }
  };
}