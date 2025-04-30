import { VercelRequest, VercelResponse } from '@vercel/node';

// Store the last event in memory (note: this will reset on each deploy)
let lastEvent: any = null;
let lastEventTime: string | null = null;

export const getLastEvent = () => ({
  event: lastEvent,
  timestamp: lastEventTime
});

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
    
    // Store the event
    lastEvent = payload;
    lastEventTime = new Date().toISOString();
    
    // Log the received webhook
    console.log('[Webhook received]', {
      timestamp: lastEventTime,
      headers: req.headers,
      payload
    });

    return res.status(200).json({ 
      status: 'success',
      message: 'Webhook received'
    });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}