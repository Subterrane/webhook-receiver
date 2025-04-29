import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add some basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'");

    const payload = req.body;
    
    // Log the received webhook with timestamp
    console.log('[Webhook received]', {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      payload
    });

    return res.status(200).json({ 
      status: 'success',
      message: 'Webhook received'
    });
  } catch (error) {
    console.error('[Webhook Error]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
}