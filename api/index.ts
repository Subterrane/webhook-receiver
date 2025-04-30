import { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserInfo } from './auth';
import { getLastEvent } from './webhook';
import { UserinfoResponse } from 'openid-client';

function renderLandingPage(req: VercelRequest): string {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Webhook Receiver</title>
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
            text-align: center;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .login-button {
            display: inline-block;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 1.1em;
            margin: 20px 0;
        }
        .login-button:hover {
            background: #0056b3;
        }
        .description {
            color: #666;
            margin: 20px 0;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Webhook Receiver</h1>
        <p class="description">
            A secure webhook receiver and dashboard for monitoring incoming webhooks.
            Login required to view webhook events.
        </p>
        <a href="/api/login" class="login-button">Login to Dashboard</a>
        <p>
            Webhook endpoint: <code>${req.headers.host}/api/webhook</code>
        </p>
    </div>
</body>
</html>`;
}

function renderDashboard(req: VercelRequest, userInfo: UserinfoResponse): string {
  const { event, timestamp } = getLastEvent();
  const userName = userInfo.name || userInfo.email || 'Unknown User';
  
  return `<!DOCTYPE html>
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
        .user-info {
            float: right;
            text-align: right;
            margin-top: -50px;
        }
        .user-name {
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
        }
        .event-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            clear: both;
            margin-top: 20px;
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
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
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
        <h1>Webhook Receiver Dashboard</h1>
        <div class="user-info">
            <div class="user-name">${userName}</div>
            <a href="/api/logout" class="logout">Logout</a>
        </div>
        
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userInfo = await getUserInfo(req);
    
    res.setHeader('Content-Type', 'text/html');
    
    if (userInfo) {
      console.log('User authenticated, showing dashboard');
      res.status(200).send(renderDashboard(req, userInfo));
    } else {
      console.log('User not authenticated, showing landing page');
      res.status(200).send(renderLandingPage(req));
    }
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}