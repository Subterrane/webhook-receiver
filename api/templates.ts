import { EventData } from './types';

function renderEventTemplate(evt: EventData, index: number, formattedTime: string): string {
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
    </div>`;
}

export function renderEventList(events: EventData[], currentTime: string): string {
    if (events.length === 0) {
        return `
        <div class="no-events">
            <p>No webhook events received yet.</p>
            <div class="debug-info">
                <strong>Debug Info:</strong><br>
                Checking for events at: ${currentTime}<br>
                Redis store checked: true<br>
                Got null events: true
            </div>
        </div>`;
    }

    const eventsHtml = events.map((evt, index) => {
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

        return renderEventTemplate(evt, index, formattedTime);
    }).join('');

    return `
    <div class="events-container">
        ${eventsHtml}
    </div>`;
}