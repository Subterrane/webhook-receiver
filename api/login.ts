import { VercelRequest, VercelResponse } from '@vercel/node';
import { getClient } from './auth';
import { generators } from 'openid-client';
import { getConfig } from './config';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const config = getConfig();
    console.log('Config loaded:', {
      issuer: config.onelogin.issuer ? 'present' : 'missing',
      client_id: config.onelogin.client_id ? 'present' : 'missing',
      client_secret: config.onelogin.client_secret ? 'present' : 'missing',
      redirect_uri: config.onelogin.redirect_uri
    });

    const client = await getClient();
    
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    
    res.setHeader('Set-Cookie', `code_verifier=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Path=/`);

    const authUrl = client.authorizationUrl({
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    console.log('Generated auth URL:', authUrl);
    
    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}