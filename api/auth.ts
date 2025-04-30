import { Issuer, Client, TokenSet } from 'openid-client';
import { parse, serialize } from 'cookie';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from './config';

let client: Client | null = null;

// Store ID tokens in memory (note: this will reset on deploy)
const idTokens: Map<string, string> = new Map();

function validateConfig(): void {
  const config = getConfig();
  if (!config.onelogin.issuer) {
    throw new Error('ONELOGIN_ISSUER environment variable is required');
  }
  if (!config.onelogin.client_id) {
    throw new Error('ONELOGIN_CLIENT_ID environment variable is required');
  }
  if (!config.onelogin.client_secret) {
    throw new Error('ONELOGIN_CLIENT_SECRET environment variable is required');
  }
}

export async function getClient(): Promise<Client> {
  if (client) return client;
  
  validateConfig();
  const config = getConfig();
  
  console.log('Discovering issuer:', config.onelogin.issuer);
  const issuer = await Issuer.discover(config.onelogin.issuer!);
  
  client = new issuer.Client({
    client_id: config.onelogin.client_id!,
    client_secret: config.onelogin.client_secret!,
    redirect_uris: [config.onelogin.redirect_uri],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post'
  });
  
  return client;
}

export async function getUserInfo(req: VercelRequest): Promise<any | null> {
  try {
    const config = getConfig();
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[config.cookie.name];
    
    if (!token) {
      console.log('No auth token found in cookies');
      return null;
    }
    
    const client = await getClient();
    const userinfo = await client.userinfo(token);
    console.log('User info retrieved:', userinfo);
    return userinfo;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
}

export async function isAuthenticated(req: VercelRequest): Promise<boolean> {
  const userInfo = await getUserInfo(req);
  return userInfo !== null;
}

export function setAuthCookie(res: VercelResponse, token: TokenSet): void {
  if (!token.access_token) {
    throw new Error('No access token provided');
  }

  const config = getConfig();
  const cookie = serialize(
    config.cookie.name,
    token.access_token,
    config.cookie.options
  );

  // Store the ID token for logout
  if (token.id_token) {
    idTokens.set(token.access_token, token.id_token);
  }

  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res: VercelResponse): void {
  const config = getConfig();
  // Clear the auth cookie
  res.setHeader('Set-Cookie', [
    serialize(config.cookie.name, '', {
      ...config.cookie.options,
      maxAge: 0,
      expires: new Date(0)
    }),
    // Also clear the code verifier cookie if it exists
    serialize('code_verifier', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    })
  ]);
}

export function getStoredIdToken(accessToken: string): string | undefined {
  return idTokens.get(accessToken);
}