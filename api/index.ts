import { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthenticated, redirectToLogin } from './auth';

// Store the last event in memory (note: this will reset on each deploy)
let lastEvent: any = null;
let lastEventTime: string | null = null;

export const getLastEvent = () => ({
  event: lastEvent,
  timestamp: lastEventTime
});

export const setLastEvent = (event: any) => {
  lastEvent = event;
  lastEventTime = new Date().toISOString();
};

// Handler for the root page
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check if user is authenticated
  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return redirectToLogin(res);
  }

  const { event, timestamp } = getLastEvent();
  
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Webhook Receiver Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .event-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        pre {
            background: #272822;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .no-events {
            color: #666;
            font-style: italic;
        }
        .endpoint-info {
            margin-top: 20px;
            padding: 15px;
            background: #e9ecef;
            border-radius: 4px;
        }
        code {
            background: #272822;
            color: #f8f8f2;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .logout {
            float: right;
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        .logout:hover {
            background: #c82333;
        }
    </style>
    <script>
        // Auto-refresh the page every 5 seconds
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    </script>
</head>
<body>
    <div class="container">
        <a href="/api/logout" class="logout">Logout</a>
        <h1>Webhook Receiver Dashboard</h1>
        
        ${event ? `
            <div class="event-container">
                <div class="timestamp">Last event received: ${timestamp}</div>
                <pre>${JSON.stringify(event, null, 2)}</pre>
            </div>
        ` : `
            <div class="no-events">No webhook events received yet.</div>
        `}

        <div class="endpoint-info">
            <h3>Endpoint Information:</h3>
            <p>Send POST requests to: <code>${req.headers.host}/api/webhook</code></p>
            <p>Example curl command:</p>
            <pre>curl -X POST \\
  https://${req.headers.host}/api/webhook \\
  -H 'Content-Type: application/json' \\
  -d '{"event": "test", "data": "Hello World"}'</pre>
        </div>
    </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}