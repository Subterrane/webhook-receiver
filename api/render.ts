import { EventData } from './types';

export function renderEventTemplate(evt: EventData, index: number): string {
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
    `;
}