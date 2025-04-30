import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

interface StoredEvent {
  payload: any;
  timestamp: string;
  headers: { [key: string]: string };
}

export const getLastEvent = async () => {
  try {
    console.log('Attempting to fetch event from Redis...');
    const event = await redis.get<StoredEvent>('lastEvent');
    console.log('Retrieved from Redis:', event);
    
    if (!event) {
      console.log('No event found in Redis');
      return { event: null, timestamp: null };
    }
    
    return {
      event: event.payload,
      timestamp: event.timestamp
    };
  } catch (error) {
    console.error('Failed to retrieve event from Redis:', error);
    return { event: null, timestamp: null };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Webhook handler called with method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const timestamp = new Date().toISOString();
    
    // Prepare the event data
    const storedEvent: StoredEvent = {
      payload: req.body,
      timestamp,
      headers: req.headers as { [key: string]: string }
    };

    console.log('Attempting to store event in Redis:', storedEvent);
    
    // Store in Redis
    await redis.set('lastEvent', storedEvent);
    console.log('Successfully stored event in Redis');

    return res.status(200).json({ 
      status: 'success',
      message: 'Webhook received and stored',
      timestamp,
      event: storedEvent.payload
    });
  } catch (error) {
    console.error('Failed to store webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}