# Webhook Receiver

A secure TypeScript-based webhook receiver built for Vercel's serverless platform. This service provides a simple endpoint that logs and processes incoming webhook payloads with proper error handling and security headers. It includes a web dashboard protected by OneLogin OIDC authentication.

## Features

- Built with TypeScript for type safety
- Protected dashboard with OneLogin OIDC authentication
- Public webhook endpoint for receiving events
- Secure headers and request validation
- Redis-backed event storage
- Detailed logging with timestamps
- Error handling and proper HTTP status codes
- Vercel serverless deployment ready
- Auto-refreshing dashboard interface
- User information display from OneLogin
- Complete Single Sign-On (SSO) logout flow
- Efficient OIDC token validation

## Prerequisites

- Node.js (>= 20.1.0)
- npm (comes with Node.js)
- A OneLogin account with admin access
- A Vercel account
- An Upstash account (free tier works)

## Setup

### 1. Initial Project Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd webhook-receiver
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### 2. Vercel Setup

1. Install Vercel CLI if you haven't:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel to get your production URL:
   ```bash
   npx vercel deploy
   ```

3. List your deployments to get your production URL:
   ```bash
   npx vercel ls webhook-receiver
   ```
   Note down your production URL (e.g., `webhook-receiver.vercel.app`)

### 3. OneLogin Configuration

1. Log into your OneLogin admin console
2. Go to Applications > Add App > OpenID Connect
3. Give your application a name (e.g., "Webhook Receiver")

4. In the Configuration tab, set:
   - Login URL: `https://your-production-url/api/login`
     Example: `https://webhook-receiver.vercel.app/api/login`
   - Redirect URIs: `https://your-production-url/api/callback`
     Example: `https://webhook-receiver.vercel.app/api/callback`
   - Post Logout Redirect URIs: `https://your-production-url/api`
     Example: `https://webhook-receiver.vercel.app/api`

5. In the SSO tab, note down:
   - Client ID
   - Client Secret
   - Issuer URL (usually `https://your-subdomain.onelogin.com/oidc/2`)

### 4. Upstash Redis Setup

1. Create a free Redis database at [Upstash](https://upstash.com/)
2. After creating your database, note down:
   - REST URL
   - REST Token

These credentials will be needed in the next step.

### 5. Environment Variables Setup

Set up your environment variables in Vercel:

```bash
# OneLogin Configuration
npx vercel env add ONELOGIN_ISSUER      # Your OneLogin Issuer URL from SSO tab
npx vercel env add ONELOGIN_CLIENT_ID    # Your OneLogin Client ID from SSO tab
npx vercel env add ONELOGIN_CLIENT_SECRET # Your OneLogin Client Secret from SSO tab
npx vercel env add VERCEL_URL_OVERRIDE   # Your production URL without https:// prefix

# Redis Configuration
npx vercel env add UPSTASH_REDIS_REST_URL   # Your Upstash Redis REST URL
npx vercel env add UPSTASH_REDIS_REST_TOKEN # Your Upstash Redis REST Token
```

### 6. Final Deployment

Deploy to production:
```bash
npx vercel --prod
```

## Usage

### Viewing Webhooks

1. Visit your dashboard at `https://your-production-url/api`
   Example: `https://webhook-receiver.vercel.app/api`
2. Log in with your OneLogin credentials
3. The dashboard will show:
   - Your user information (name/email)
   - The most recent webhook event
   - Auto-refresh every 5 seconds

### Sending Webhooks

Send POST requests to the webhook endpoint:

```bash
curl -X POST \
  https://your-production-url/api/webhook \
  -H 'Content-Type: application/json' \
  -d '{"event": "test", "data": "Hello World"}'
```

Note: The webhook endpoint (`/api/webhook`) is public to receive events, but the dashboard is protected by authentication.

## Project Structure

- `/api/index.ts` - Dashboard frontend and event display
- `/api/webhook.ts` - Webhook receiver endpoint
- `/api/login.ts` - OneLogin authentication initiation
- `/api/callback.ts` - OneLogin authentication callback
- `/api/logout.ts` - Session termination
- `/api/auth.ts` - Authentication utilities
- `/api/config.ts` - Configuration settings

## Authentication Flow

1. Landing Page:
   - Public access at `/api`
   - Shows login button and basic information

2. Login:
   - Redirects to OneLogin
   - Uses OIDC authentication
   - Returns user to dashboard

3. Dashboard:
   - Shows user information from OneLogin
   - Displays webhook events
   - Protected by authentication

4. Logout:
   - Clears local session
   - Performs OneLogin SSO logout
   - Returns to landing page

## Limitations

- Only shows the most recent event (historical events not stored)
- Single user access (no user-specific event views)
- Basic event format validation
- No webhook signature validation yet

## Troubleshooting

### Common OneLogin Issues

1. "invalid_client" errors:
   - Double-check Client ID and Client Secret
   - Make sure they're correctly set in Vercel environment variables
   - Verify there are no extra spaces in the credentials

2. "redirect_uri_mismatch" errors:
   - Verify the callback URL in OneLogin matches exactly with your Vercel URL
   - Check VERCEL_URL_OVERRIDE is set correctly
   - Make sure you're using the production URL, not a preview URL

3. Access Issues:
   - Make sure your user has been assigned access to the application in OneLogin
   - Check that the application is enabled in OneLogin

4. Logout Issues:
   - Verify Post Logout Redirect URI is configured in OneLogin
   - Check that the URI matches your production URL exactly
   - Ensure cookies are being properly cleared

## Future Improvements

- Persistent storage for events (e.g., MongoDB, Redis)
- Multiple event history
- User-specific event views
- Webhook signature validation
- Custom event processing rules
- Event filtering and search
- User role-based access control

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---
Last updated: 2024