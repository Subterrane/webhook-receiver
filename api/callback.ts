import { VercelRequest, VercelResponse } from '@vercel/node';
import { getClient, setAuthCookie } from './auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const client = await getClient();
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(config.onelogin.redirect_uri, params);
    
    setAuthCookie(res, tokenSet);
    
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}