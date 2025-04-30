import { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserInfo, isTokenValid } from './auth';
import { getEvents } from './webhook';
import { UserinfoResponse } from 'openid-client';
import { EventData } from './types';
import { renderEventTemplate } from './render';

function renderLandingPage(): string {
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
        .github-link {
            display: inline-block;
            margin-top: 20px;
            color: #6e7781;
            text-decoration: none;
            font-size: 0.9em;
        }
        .github-link:hover {
            color: #0969da;
            text-decoration: underline;
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
        <br>
        <a href="https://github.com/Subterrane/webhook-receiver" class="github-link" target="_blank" rel="noopener noreferrer">View on GitHub</a>
    </div>
</body>
</html>`;
}

async function renderDashboard(req: VercelRequest, userInfo: UserinfoResponse): Promise<string> {
  console.log('Rendering dashboard, fetching events...');
  const { events } = await getEvents();
  console.log('Got events for dashboard:', events);
  
  // Serialize user info for client-side storage
  const serializedUserInfo = JSON.stringify(userInfo);
  const userName = userInfo.name || userInfo.email || 'Unknown User';
  const currentTime = new Date().toISOString();

  // Prepare events section HTML
  const eventsSection = events.length > 0
    ? `<div class="events-container">
         ${(events as EventData[]).map((evt, index) => renderEventTemplate(evt, index)).join('')}
       </div>`
    : `<div class="no-events">
         <p>No webhook events received yet.</p>
         <div class="debug-info">
           <strong>Debug Info:</strong><br>
           Checking for events at: ${currentTime}<br>
           Redis store checked: true<br>
           Got null events: true
         </div>
       </div>`;

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
        .events-container {
            margin: 20px 0;
        }
        .event-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            margin-bottom: 15px;
        }
        .event-container:last-child {
            margin-bottom: 0;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #dee2e6;
        }
        .metadata {
            background: #fff;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 0.9em;
            border: 1px solid #e9ecef;
        }
        .metadata-item {
            margin: 4px 0;
            line-height: 1.4;
            color: #495057;
        }
        .metadata-key {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
            display: inline-block;
        }
        pre {
            background: #272822;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 0;
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

        function formatTimestamp(isoString) {
            try {
                const date = new Date(isoString);
                return new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                }).format(date);
            } catch (error) {
                console.error('Error formatting timestamp:', error);
                return isoString; // Fallback to ISO string if parsing fails
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
                let eventsContainer = document.querySelector('.events-container');
                let noEvents = document.querySelector('.no-events');
                let endpointInfo = document.querySelector('.endpoint-info');

                // Remove existing events or no-event containers
                if (eventsContainer) eventsContainer.remove();
                if (noEvents) noEvents.remove();

                if (data.events && data.events.length > 0) {
                    // Create events container
                    const newContainer = document.createElement('div');
                    newContainer.className = 'events-container';
                    
                    // Add each event
                    data.events.forEach((eventData, index) => {
                        const eventElement = document.createElement('div');
                        eventElement.className = 'event-container';
                        
                        const timestampDiv = document.createElement('div');
                        timestampDiv.className = 'timestamp';
                        timestampDiv.textContent = \`Event #\${index + 1} received: \${formatTimestamp(eventData.timestamp)}\`;
                        eventElement.appendChild(timestampDiv);

                        // Add metadata section
                        const metadata = {
                            'Source IP': eventData.headers['x-forwarded-for'] || eventData.headers['x-real-ip'] || 'Unknown',
                            'User Agent': eventData.headers['user-agent'] || 'Not provided',
                            'Content Type': eventData.headers['content-type'] || 'Not specified',
                            'Content Length': eventData.headers['content-length'] ? \`\${eventData.headers['content-length']} bytes\` : 'Unknown',
                            'Host': eventData.headers['host'] || 'Unknown'
                        };

                        const metadataDiv = document.createElement('div');
                        metadataDiv.className = 'metadata';
                        
                        Object.entries(metadata).forEach(([key, value]) => {
                            const item = document.createElement('div');
                            item.className = 'metadata-item';
                            
                            const keySpan = document.createElement('span');
                            keySpan.className = 'metadata-key';
                            keySpan.textContent = \`\${key}:\`;
                            
                            item.appendChild(keySpan);
                            item.appendChild(document.createTextNode(\` \${value}\`));
                            
                            metadataDiv.appendChild(item);
                        });
                        
                        eventElement.appendChild(metadataDiv);
                        
                        const pre = document.createElement('pre');
                        pre.textContent = JSON.stringify(eventData.event, null, 2);
                        eventElement.appendChild(pre);
                        
                        newContainer.appendChild(eventElement);
                    });
                    
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
                    const currentTime = formatTimestamp(new Date().toISOString());
                    debugInfo.innerHTML = \`
                        <strong>Debug Info:</strong><br>
                        Checking for events at: \${currentTime}<br>
                        Redis store checked: true<br>
                        Got null events: true
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

        ${eventsSection}

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

  // Generate the events section HTML
  const eventsHtml = renderEventList(renderEvents, currentTime);
  
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
        .events-container {
            margin: 20px 0;
        }
        .event-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            margin-bottom: 15px;
        }
        .event-container:last-child {
            margin-bottom: 0;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #dee2e6;
        }
        .metadata {
            background: #fff;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 0.9em;
            border: 1px solid #e9ecef;
        }
        .metadata-item {
            margin: 4px 0;
            line-height: 1.4;
            color: #495057;
        }
        .metadata-key {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
            display: inline-block;
        }
        pre {
            background: #272822;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 0;
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
        // Declare EventData type for TypeScript validation
        declare interface EventData {
            event: any;
            timestamp: string;
            headers: {
                'x-forwarded-for'?: string;
                'x-real-ip'?: string;
                'user-agent'?: string;
                'content-type'?: string;
                'content-length'?: string;
                'host'?: string;
                [key: string]: string | undefined;
            };
        }

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

        function formatTimestamp(isoString) {
            try {
                const date = new Date(isoString);
                return new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                }).format(date);
            } catch (error) {
                console.error('Error formatting timestamp:', error);
                return isoString; // Fallback to ISO string if parsing fails
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
                let eventsContainer = document.querySelector('.events-container');
                let noEvents = document.querySelector('.no-events');
                let endpointInfo = document.querySelector('.endpoint-info');

                // Remove existing events or no-event containers
                if (eventsContainer) eventsContainer.remove();
                if (noEvents) noEvents.remove();

                if (data.events && data.events.length > 0) {
                    // Create events container
                    const newContainer = document.createElement('div');
                    newContainer.className = 'events-container';
                    
                    // Add each event
                    data.events.forEach((eventData: EventData, index) => {
                        const eventElement = document.createElement('div');
                        eventElement.className = 'event-container';
                        
                        const timestampDiv = document.createElement('div');
                        timestampDiv.className = 'timestamp';
                        timestampDiv.textContent = \`Event #\${index + 1} received: \${formatTimestamp(eventData.timestamp)}\`;
                        eventElement.appendChild(timestampDiv);

                        // Add metadata section
                        const metadata = {
                            'Source IP': eventData.headers['x-forwarded-for'] || eventData.headers['x-real-ip'] || 'Unknown',
                            'User Agent': eventData.headers['user-agent'] || 'Not provided',
                            'Content Type': eventData.headers['content-type'] || 'Not specified',
                            'Content Length': eventData.headers['content-length'] ? \`\${eventData.headers['content-length']} bytes\` : 'Unknown',
                            'Host': eventData.headers['host'] || 'Unknown'
                        };

                        const metadataDiv = document.createElement('div');
                        metadataDiv.className = 'metadata';
                        
                        Object.entries(metadata).forEach(([key, value]) => {
                            const item = document.createElement('div');
                            item.className = 'metadata-item';
                            
                            const keySpan = document.createElement('span');
                            keySpan.className = 'metadata-key';
                            keySpan.textContent = \`\${key}:\`;
                            
                            item.appendChild(keySpan);
                            item.appendChild(document.createTextNode(\` \${value}\`));
                            
                            metadataDiv.appendChild(item);
                        });
                        
                        eventElement.appendChild(metadataDiv);
                        
                        const pre = document.createElement('pre');
                        pre.textContent = JSON.stringify(eventData.event, null, 2);
                        eventElement.appendChild(pre);
                        
                        newContainer.appendChild(eventElement);
                    });
                    
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
                    const currentTime = formatTimestamp(new Date().toISOString());
                    debugInfo.innerHTML = \`
                        <strong>Debug Info:</strong><br>
                        Checking for events at: \${currentTime}<br>
                        Redis store checked: true<br>
                        Got null events: true
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

        ${events.length > 0 ? `
            <div class="events-container">
                    ${events.map((evt, index) => {
                    const date = new Date(evt.timestamp);
                    const formattedTime = new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    }).format(date);

                    // Extract relevant headers
                    const metadata = {
                        'Source IP': evt.headers['x-forwarded-for'] || evt.headers['x-real-ip'] || 'Unknown',
                        'User Agent': evt.headers['user-agent'] || 'Not provided',
                        'Content Type': evt.headers['content-type'] || 'Not specified',
                        'Content Length': evt.headers['content-length'] ? evt.headers['content-length'] + ' bytes' : 'Unknown',
                        'Host': evt.headers['host'] || 'Unknown'
                    };

                    return `
                    <div class="event-container">
                        <div class="timestamp">Event #${index + 1} received: ${formattedTime}</div>
                        <div class="metadata">
                            ${Object.entries(metadata).map(([key, value]) => 
                                `<div class="metadata-item"><span class="metadata-key">${key}:</span> ${value}</div>`
                            ).join('')}
                        </div>
                        <pre>${JSON.stringify(evt.event, null, 2)}</pre>
                    </div>
                `}).join('')}
            </div>
        ` : `
            <div class="no-events">
                <p>No webhook events received yet.</p>
                <div class="debug-info">
                    <strong>Debug Info:</strong><br>
                    Checking for events at: ${new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    }).format(new Date(currentTime))}<br>
                    Redis store checked: true<br>
                    Got null events: true
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
      
      // Return the events data
      const { events } = await getEvents();
      return res.status(200).json({ events });
    } else {
      // For full page loads, get the complete user info
      const userInfo = await getUserInfo(req);
      res.setHeader('Content-Type', 'text/html');
      
      if (userInfo) {
        console.log('User authenticated, showing dashboard');
        const dashboard = await renderDashboard(req, userInfo);
        return res.status(200).send(dashboard);
      } else {
        console.log('User not authenticated, showing landing page');
        return res.status(200).send(renderLandingPage());
      }
    }
  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}