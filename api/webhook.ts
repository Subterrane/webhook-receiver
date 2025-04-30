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

const MAX_EVENTS = 10;
const EVENTS_KEY = 'webhookEvents';

export const getEvents = async () => {
  try {
    console.log('Attempting to fetch events from Redis...');
    const events = await redis.lrange<StoredEvent>(EVENTS_KEY, 0, MAX_EVENTS - 1);
    console.log(`Retrieved ${events.length} events from Redis`);
    
    if (!events || events.length === 0) {
      console.log('No events found in Redis');
      return { events: [] };
    }
    
    return {
      events: events.map(event => ({
        event: event.payload,
        timestamp: event.timestamp
      }))
    };
  } catch (error) {
    console.error('Failed to retrieve events from Redis:', error);
    return { events: [] };
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
    
    // Store in Redis at the start of the list
    await redis.lpush(EVENTS_KEY, storedEvent);
    // Trim to keep only the last MAX_EVENTS
    await redis.ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1);
    
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