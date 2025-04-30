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
        code {
            background: #272822;
            color: #f8f8f2;
            padding: 2px 5px;
            border-radius: 3px;
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
        <a href="/api/login" class="login-button" onclick="localStorage.removeItem('refreshCount');">Login to Dashboard</a>
    </div>
</body>
</html>`;
}

async function renderDashboard(req: VercelRequest, userInfo: UserinfoResponse): Promise<string> {
  console.log('Rendering dashboard, fetching last event...');
  const { event, timestamp } = await getLastEvent();
  console.log('Got event for dashboard:', { event, timestamp });
  
  // Serialize user info for client-side storage
  const serializedUserInfo = JSON.stringify(userInfo);
  const userName = userInfo.name || userInfo.email || 'Unknown User';
  const currentTime = new Date().toISOString();
  
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
            position: relative;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-right: 100px;
        }
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        .header-left {
            flex-grow: 1;
        }
        .header-right {
            flex-shrink: 0;
            text-align: right;
            margin-left: 20px;
        }
        .user-info {
            margin-bottom: 10px;
        }
        .user-name {
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
            white-space: nowrap;
        }
        .event-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
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
            margin: 20px 0;
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
            white-space: nowrap;
        }
        .logout:hover {
            background: #c82333;
        }
        .debug-info {
            font-size: 0.9em;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .refresh-info {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
            text-align: right;
        }
    </style>
    <script>
        // Store the user info in localStorage
        const userInfo = ${serializedUserInfo};
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        function updateDisplay() {
            // Get count from localStorage or start at 0
            let refreshCount = parseInt(localStorage.getItem('refreshCount') || '0');
            refreshCount++;
            
            // Store updated count
            localStorage.setItem('refreshCount', refreshCount.toString());
            
            // Update display
            const countEl = document.getElementById('refresh-count');
            const timeEl = document.getElementById('refresh-time');
            if (countEl) {
                countEl.textContent = refreshCount;
            }
            if (timeEl) {
                timeEl.textContent = new Date().toISOString();
            }
        }

        async function updateEventData() {
            try {
                const response = await fetch('/api/index', {
                    headers: {
                        'x-fetch-data': 'true'
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        // Session expired, clear storage and reload
                        localStorage.removeItem('userInfo');
                        localStorage.removeItem('refreshCount');
                        window.location.reload();
                        return;
                    }
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();
                let container = document.querySelector('.container');
                let eventContainer = document.querySelector('.event-container');
                let noEvents = document.querySelector('.no-events');
                let endpointInfo = document.querySelector('.endpoint-info');

                // Remove existing event or no-event containers
                if (eventContainer) eventContainer.remove();
                if (noEvents) noEvents.remove();

                if (data.event) {
                    // Create event container
                    const newContainer = document.createElement('div');
                    newContainer.className = 'event-container';
                    
                    // Create timestamp div
                    const timestampDiv = document.createElement('div');
                    timestampDiv.className = 'timestamp';
                    timestampDiv.textContent = 'Last event received: ' + data.timestamp;
                    newContainer.appendChild(timestampDiv);
                    
                    // Create pre element for event data
                    const pre = document.createElement('pre');
                    pre.textContent = JSON.stringify(data.event, null, 2);
                    newContainer.appendChild(pre);
                    
                    // Insert before endpoint info
                    container.insertBefore(newContainer, endpointInfo);
                } else {
                    // Create no events container
                    const newContainer = document.createElement('div');
                    newContainer.className = 'no-events';
                    
                    const message = document.createElement('p');
                    message.textContent = 'No webhook events received yet.';
                    newContainer.appendChild(message);
                    
                    const debugInfo = document.createElement('div');
                    debugInfo.className = 'debug-info';
                    debugInfo.innerHTML = \`
                        <strong>Debug Info:</strong><br>
                        Checking for events at: \${new Date().toISOString()}<br>
                        Redis store checked: true<br>
                        Got null event: true<br>
                        Got null timestamp: true
                    \`;
                    newContainer.appendChild(debugInfo);
                    
                    // Insert before endpoint info
                    container.insertBefore(newContainer, endpointInfo);
                }
            } catch (error) {
                console.error('Error updating event data:', error);
            }
        }

        function refresh() {
            updateDisplay();
            updateEventData();
            setTimeout(refresh, 5000);
        }

        // Initialize when page loads
        window.onload = refresh;
    </script>
</head>
<body>
    <div class="container">
        <div class="header-container">
            <div class="header-left">
                <h1>Webhook Receiver Dashboard</h1>
            </div>
            <div class="header-right">
                <div class="user-info">
                    <div class="user-name">${userName}</div>
                    <a href="/api/logout" class="logout" onclick="localStorage.removeItem('refreshCount');">Logout</a>
                </div>
                <div class="refresh-info">
                    Page rendered: ${currentTime}<br>
                    Refresh #<span id="refresh-count">0</span><br>
                    Last: <span id="refresh-time"></span>
                </div>
            </div>
        </div>

        ${event ? `
            <div class="event-container">
                <div class="timestamp">Last event received: ${timestamp}</div>
                <pre>${JSON.stringify(event, null, 2)}</pre>
            </div>
        ` : `
            <div class="no-events">
                <p>No webhook events received yet.</p>
                <div class="debug-info">
                    <strong>Debug Info:</strong><br>
                    Checking for events at: ${currentTime}<br>
                    Redis store checked: true<br>
                    Got null event: ${!event}<br>
                    Got null timestamp: ${!timestamp}
                </div>
            </div>
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
  console.log('Dashboard handler called:', {
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Check if this is a data-only request
    const isDataRequest = req.headers['x-fetch-data'] === 'true';
    
    if (isDataRequest) {
      res.setHeader('Content-Type', 'application/json');
      
      // For data requests, just verify the token exists
      const isValid = await isTokenValid(req);
      if (!isValid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Return only the event data
      const { event, timestamp } = await getLastEvent();
      return res.status(200).json({ event, timestamp });
    } else {
      // For full page loads, get the complete user info
      const userInfo = await getUserInfo(req);
      res.setHeader('Content-Type', 'text/html');
      
      if (userInfo) {
        console.log('User authenticated, showing dashboard');
        const dashboard = await renderDashboard(req, userInfo);
        res.status(200).send(dashboard);
      } else {
        console.log('User not authenticated, showing landing page');
        res.status(200).send(renderLandingPage(req));
      }
    }
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}