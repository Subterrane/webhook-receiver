# Webhook Receiver

A secure TypeScript-based webhook receiver built for Vercel's serverless platform. This service provides a simple endpoint that logs and processes incoming webhook payloads with proper error handling and security headers.

## Features

- Built with TypeScript for type safety
- Secure headers and request validation
- Detailed logging with timestamps
- Error handling and proper HTTP status codes
- Vercel serverless deployment ready

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)
- Vercel CLI (optional for local development)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd webhook-receiver
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

4. Deploy to Vercel:
   ```bash
   npm run deploy
   ```

## Usage

Send POST requests to your deployed webhook URL with JSON payloads. The service will:
- Validate the request method (only POST allowed)
- Log the incoming webhook data
- Process the payload
- Return appropriate status codes and responses

Example curl request:
```bash
curl -X POST \
  https://your-vercel-url/api \
  -H 'Content-Type: application/json' \
  -d '{"event": "test", "data": "Hello World"}'
```

## Security

The service implements several security measures:
- Content-Type validation
- HTTP method validation
- Security headers (X-Content-Type-Options, X-Frame-Options, CSP)
- Error message sanitization

## Development

The project uses TypeScript for better type safety and developer experience. The main webhook handler is in `api/index.ts`.

## Scripts

- `npm run dev` - Run the development server locally
- `npm run build` - Build the TypeScript project
- `npm run deploy` - Deploy to Vercel

## License

MIT

---
Last updated: 2024