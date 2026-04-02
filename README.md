# WapGPT

A ChatGPT-style AI assistant served over WAP/WML — designed for vintage mobile devices like the Nokia 6310i.

## What is it?

WapGPT is an Express.js server that serves a WML 1.1 website accessible via WAP browsers. Type a question on your WAP device, hit Send, and get a concise AI-powered answer back — all rendered in monochrome on a tiny screen.

## Requirements

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)
- [ngrok](https://ngrok.com) (optional, for exposing to real devices)

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Configure environment**

   Create a `.env` file in the project root:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Start the server**
   ```
   npm start
   ```

   The server runs at `http://localhost:3000`.

## Exposing to a real WAP device

Use ngrok to get a public URL:

```
ngrok http 3000
```

Point your WAP device or gateway at the printed `https://` URL. The ngrok inspection UI is at `http://localhost:4040`.

> The public URL changes on every ngrok restart unless you have a reserved domain.

## Routes

| Route | Description |
|---|---|
| `GET /` | WML input card with logo and prompt field |
| `GET /chat?prompt=...` | Sends prompt to OpenAI, returns WML response card |
| `GET /logo.wbmp` | Monochrome WBMP logo (72×19px) |

## Device compatibility

Designed for the **Nokia 6310i** (96×65px monochrome screen). Should work on any WAP 1.x browser that supports WML 1.1.
