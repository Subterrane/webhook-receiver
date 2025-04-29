import { VercelRequest, VercelResponse } from '@vercel/node';
import { getClient } from './auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const client = await getClient();
    const authUrl = client.authorizationUrl({
      scope: 'openid profile email',
      code_challenge_method: 'S256'
    });
    
    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}