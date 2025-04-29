import { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookie } from './auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  clearAuthCookie(res);
  res.writeHead(302, { Location: '/api/login' });
  res.end();
}