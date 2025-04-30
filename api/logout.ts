import { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookie, getClient, getStoredIdToken } from './auth';
import { getConfig } from './config';
import { parse } from 'cookie';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const client = await getClient();
    const config = getConfig();
    
    // Get the current access token from cookies
    const cookies = parse(req.headers.cookie || '');
    const accessToken = cookies[config.cookie.name];
    
    // Get the stored ID token
    const idToken = accessToken ? getStoredIdToken(accessToken) : undefined;
    
    // Clear our local session
    clearAuthCookie(res);

    if (idToken) {
      // Get the OneLogin end session URL with ID token hint
      const logoutUrl = client.endSessionUrl({
        id_token_hint: idToken,
        post_logout_redirect_uri: `https://${config.onelogin.redirect_uri.split('/')[2]}/api`,
        client_id: config.onelogin.client_id
      });

      console.log('Redirecting to OneLogin logout with ID token');
      res.writeHead(302, { Location: logoutUrl });
      res.end();
    } else {
      // If no ID token, just redirect back to our landing page
      console.log('No ID token available, redirecting to landing page');
      res.writeHead(302, { Location: '/api' });
      res.end();
    }
  } catch (error) {
    console.error('Logout error:', error);
    // If there's an error, at least clear local session and redirect
    clearAuthCookie(res);
    res.writeHead(302, { Location: '/api' });
    res.end();
  }
}