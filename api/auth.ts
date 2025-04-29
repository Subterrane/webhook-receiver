import { Issuer, Client, TokenSet } from 'openid-client';
import { config } from './config';
import { parse, serialize } from 'cookie';
import { VercelRequest, VercelResponse } from '@vercel/node';

let client: Client | null = null;

export async function getClient() {
  if (client) return client;
  
  const issuer = await Issuer.discover(config.onelogin.issuer!);
  client = new issuer.Client({
    client_id: config.onelogin.client_id!,
    client_secret: config.onelogin.client_secret!,
    redirect_uris: [config.onelogin.redirect_uri],
    response_types: ['code'],
  });
  
  return client;
}

export function setAuthCookie(res: VercelResponse, token: TokenSet) {
  const cookie = serialize(
    config.cookie.name,
    token.access_token!,
    config.cookie.options
  );
  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res: VercelResponse) {
  const cookie = serialize(config.cookie.name, '', {
    ...config.cookie.options,
    maxAge: 0
  });
  res.setHeader('Set-Cookie', cookie);
}

export async function isAuthenticated(req: VercelRequest): Promise<boolean> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[config.cookie.name];
  
  if (!token) return false;
  
  try {
    const client = await getClient();
    const userinfo = await client.userinfo(token);
    return !!userinfo;
  } catch (error) {
    return false;
  }
}

export function redirectToLogin(res: VercelResponse) {
  res.writeHead(302, { Location: '/api/login' });
  res.end();
}