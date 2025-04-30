import { VercelRequest, VercelResponse } from '@vercel/node';
import { getClient, setAuthCookie } from './auth';
import { getConfig } from './config';
import { parse } from 'cookie';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the code verifier from the cookie
    const cookies = parse(req.headers.cookie || '');
    const codeVerifier = cookies.code_verifier;

    if (!codeVerifier) {
      console.error('No code verifier found in cookies');
      throw new Error('No code verifier found');
    }

    const config = getConfig();
    const client = await getClient();
    const params = client.callbackParams(req);
    
    console.log('Callback params:', params);
    console.log('Redirect URI:', config.onelogin.redirect_uri);
    
    try {
      const tokenSet = await client.callback(
        config.onelogin.redirect_uri,
        params,
        { code_verifier: codeVerifier }
      );
      
      console.log('Token set received:', {
        access_token: tokenSet.access_token ? 'present' : 'missing',
        id_token: tokenSet.id_token ? 'present' : 'missing',
        token_type: tokenSet.token_type,
        expires_at: tokenSet.expires_at
      });

      // Clear the code verifier cookie
      res.setHeader('Set-Cookie', 'code_verifier=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      
      setAuthCookie(res, tokenSet);
      
      res.writeHead(302, { Location: '/' });
      res.end();
    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError);
      console.error('Client configuration:', {
        issuer: config.onelogin.issuer,
        client_id: config.onelogin.client_id ? 'present' : 'missing',
        client_secret: config.onelogin.client_secret ? 'present' : 'missing',
        redirect_uri: config.onelogin.redirect_uri
      });
      throw tokenError;
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}