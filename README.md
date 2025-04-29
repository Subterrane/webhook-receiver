# Webhook Receiver

A secure TypeScript-based webhook receiver built for Vercel's serverless platform. This service provides a simple endpoint that logs and processes incoming webhook payloads with proper error handling and security headers. It includes a web dashboard protected by OneLogin OIDC authentication.

## Features

- Built with TypeScript for type safety
- Protected dashboard with OneLogin OIDC authentication
- Public webhook endpoint for receiving events
- Secure headers and request validation
- Detailed logging with timestamps
- Error handling and proper HTTP status codes
- Vercel serverless deployment ready
- Auto-refreshing dashboard interface

## Prerequisites

- Node.js (>= 20.1.0)
- npm (comes with Node.js)
- A OneLogin account with admin access
- A Vercel account

## Setup

### 1. OneLogin Configuration

1. Log into your OneLogin admin console
2. Create a new OpenID Connect application:
   - Go to Applications > Add App
   - Search for "OpenID Connect"
   - Give your application a name (e.g., "Webhook Receiver")
3. Configure the application:
   - In the "Configuration" tab:
     - Application Type: "Web"
     - Token Endpoint Authentication Method: "POST"
   - In the "SSO" tab:
     - Redirect URI: `https://your-vercel-domain/api/callback`
     - Login URL: `https://your-vercel-domain/api/login`
4. Note down the following credentials:
   - Client ID
   - Client Secret
   - Issuer URL (usually `https://your-subdomain.onelogin.com/oidc/2`)

### 2. Local Development Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd webhook-receiver
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up local environment variables:
   Create a `.env` file with:
   ```
   ONELOGIN_ISSUER=your_issuer_url
   ONELOGIN_CLIENT_ID=your_client_id
   ONELOGIN_CLIENT_SECRET=your_client_secret
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

### 3. Vercel Deployment

1. Install Vercel CLI if you haven't:
   ```bash
   npm install -g vercel
   ```

2. Set up environment variables in Vercel:
   ```bash
   npx vercel env add ONELOGIN_ISSUER
   npx vercel env add ONELOGIN_CLIENT_ID
   npx vercel env add ONELOGIN_CLIENT_SECRET
   ```

3. Deploy to Vercel:
   ```bash
   npx vercel deploy
   ```

## Usage

### Viewing Webhooks

1. Visit your deployed application URL
2. Log in with your OneLogin credentials
3. The dashboard will show the most recent webhook event and auto-refresh every 5 seconds

### Sending Webhooks

Send POST requests to the webhook endpoint:

```bash
curl -X POST \
  https://your-vercel-url/api/webhook \
  -H 'Content-Type: application/json' \
  -d '{"event": "test", "data": "Hello World"}'
```

Note: The webhook endpoint (`/api/webhook`) is public to receive events, but the dashboard is protected by authentication.

## Security Features

- OneLogin OIDC authentication for the dashboard
- HTTP-only secure cookies for session management
- Content-Type validation
- HTTP method validation
- Security headers (X-Content-Type-Options, X-Frame-Options, CSP)
- Error message sanitization

## Development

The project structure:
- `/api/index.ts` - Dashboard frontend and event display
- `/api/webhook.ts` - Webhook receiver endpoint
- `/api/login.ts` - OneLogin authentication initiation
- `/api/callback.ts` - OneLogin authentication callback
- `/api/logout.ts` - Session termination
- `/api/auth.ts` - Authentication utilities
- `/api/config.ts` - Configuration settings

## Available Scripts

- `npm run dev` - Run the development server locally
- `npm run build` - Build the TypeScript project
- `npm run deploy` - Deploy to Vercel

## Limitations

- In-memory event storage (events are lost on deployment/restart)
- Only shows the most recent event
- Single user access (no user-specific event views)

## Future Improvements

- Persistent storage for events (e.g., MongoDB, Redis)
- Multiple event history
- User-specific event views
- Webhook signature validation
- Custom event processing rules

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---
Last updated: 2024