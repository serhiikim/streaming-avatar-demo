# Streaming Avatar Demo

A Proof of Concept (PoC) demonstrating an interactive AI avatar with real-time streaming capabilities and function calling.

## Features

- Real-time AI avatar streaming with lip-sync
- OpenAI Assistant integration with function calling
- Interactive UI for avatar setup and control
- Function calling demonstration with console logging
- Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- OpenAI API key
- OpenAI Assistant ID
- HeyGen API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required environment variables:

- `VITE_OPENAI_API_KEY`: Your OpenAI API key
- `VITE_OPENAI_ASSISTANT_ID`: Your OpenAI Assistant ID
- `VITE_HEYGEN_API_KEY`: Your HeyGen API key for avatar streaming

## Function Calling

The demo includes three example functions that the AI assistant can call:

1. `callHuman`: Request human intervention
   - Parameters: reason, urgency (low/medium/high)
   - Example: "I need help with a technical issue"

2. `scheduleMeeting`: Schedule a meeting
   - Parameters: preferredTime, meetingType, attendees
   - Example: "Schedule a team meeting for tomorrow"

3. `showSlide`: Display a presentation slide
   - Parameters: slideId, contextSummary
   - Example: "Show the introduction slide"

All function calls are currently logged to the console for demonstration purposes.

## Project Structure

```
src/
├── components/
│   ├── AvatarSetup.ts    # Avatar configuration component
│   └── Avatar.ts         # Avatar display component
├── config/
│   └── webhook.ts        # Function calling implementation
├── openai-assistant.ts   # OpenAI Assistant integration
└── main.ts              # Application entry point
```

## Development

- Built with Vite + React + TypeScript
- Uses OpenAI's Assistant API
- Uses HeyGen API for avatar streaming
- Implements streaming for real-time avatar responses

## Notes

This is a PoC and includes simplified implementations for demonstration purposes:
- Function calls are logged to console instead of making actual API calls
- Basic error handling and logging
- Minimal UI styling

## License

MIT 