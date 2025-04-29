export const config = {
  onelogin: {
    issuer: process.env.ONELOGIN_ISSUER,
    client_id: process.env.ONELOGIN_CLIENT_ID,
    client_secret: process.env.ONELOGIN_CLIENT_SECRET,
    redirect_uri: process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}/api/callback` : 
      'http://localhost:3000/api/callback'
  },
  cookie: {
    name: 'auth_session',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    }
  }
};