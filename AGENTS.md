# Agents.md

## Project Overview

This project serves a "WapGPT" website using **WML 1.1** (Wireless Markup Language), the markup language for WAP (Wireless Application Protocol) devices such as early mobile phones (e.g. Nokia 6310i).

It is an Express.js server that:
- Serves a WML input card with a logo and text input field
- Submits the prompt to the OpenAI Chat Completions API
- Returns the response as a WML card optimised for small monochrome screens

All pages must conform to the WML 1.1 DTD:
- Public ID: `-//WAPFORUM//DTD WML 1.1//EN`
- System ID: `http://www.wapforum.org/DTD/wml_1.1.xml`

## Project Structure

```
hello-wap/
├── index.js          # Express server (ESM, entry point)
├── logo.wbmp         # Monochrome WBMP logo (72x19px)
├── .env              # Environment variables (not committed)
├── .gitignore        # Excludes .env and node_modules
├── package.json      # npm config; type=module, start script
└── AGENTS.md         # This file
```

## Stack

- **Runtime**: Node.js (ESM — `"type": "module"` in package.json)
- **Framework**: Express.js
- **AI**: OpenAI Node SDK (`openai` package), model `gpt-3.5-turbo`
- **Config**: `dotenv` for loading `.env`

## Environment Variables

Create a `.env` file in the project root (never commit this):

```
OPENAI_API_KEY=your_api_key_here
```

The server reads this at startup via `import "dotenv/config"`.

## Running the Server

```
npm start
```

The server listens on **port 3000**. Logs are printed to stdout for all requests and OpenAI interactions.

## Routes

| Route | Description |
|---|---|
| `GET /` | Serves the WapGPT input card (WML deck) |
| `GET /chat?prompt=...` | Calls OpenAI and returns the response card |
| `GET /logo.wbmp` | Serves the WBMP logo with correct MIME type |

### Input card behaviour
- Displays `logo.wbmp` as a header image
- Pre-filled text input (`name="prompt"`, default value `"Ask anything..."`)
- Accept softkey labelled "Send" navigates to `/chat?prompt=$(prompt)`
- WML variable `$(prompt)` is interpolated by the WAP browser before the request

### Response card behaviour
- Displays the OpenAI reply as plain text
- Reply is server-side truncated to **300 characters** (appends `...` if cut)
- "Back" link returns to `/`
- Errors are caught and displayed in an error card

### OpenAI system prompt
The system prompt instructs the model to:
- Answer in 2-3 short sentences maximum
- Use plain text only (no markdown, bullets, or special characters)
- Keep responses suitable for a Nokia 6310i screen

## Logo (logo.wbmp)

The logo is a hand-generated monochrome **WBMP** (Wireless Bitmap) file:
- Text: `WapGPT`
- Size: **72×19px** — fits within the Nokia 6310i's 96×65px screen
- File size: 175 bytes
- MIME type served: `image/vnd.wap.wbmp`

WBMP format:
- 2-byte header: `0x00 0x00` (type=0, fixedheader=0)
- Variable-length width and height (multibyte encoded)
- Raw 1-bit rows, MSB-first, rows padded to byte boundaries
- Bit value `0` = black, `1` = white

To regenerate the logo, write a Node.js `.mjs` script that encodes a pixel grid into the WBMP binary format and writes it to `logo.wbmp`.

## WML 1.1 Document Structure

Every WML document (a "deck") must begin with:

```xml
<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.1//EN"
    "http://www.wapforum.org/DTD/wml_1.1.xml">
```

### Key Concepts

- **Deck**: The entire WML document (`<wml>`). A deck contains one or more cards.
- **Card**: A single screen/view (`<card>`). Users navigate between cards.
- **Content must be inside `<p>` elements** within cards.

### Document Skeleton

```xml
<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.1//EN"
    "http://www.wapforum.org/DTD/wml_1.1.xml">
<wml>
  <card id="main" title="Page Title">
    <p>Content goes here.</p>
  </card>
</wml>
```

### Supported Elements

| Element | Purpose |
|---|---|
| `<wml>` | Root element (deck); contains `head?`, `template?`, `card+` |
| `<card>` | A single screen; contains `onevent*`, `timer?`, `(do\|p)*` |
| `<p>` | Paragraph; required wrapper for text content |
| `<a href="...">` | Hyperlink (inline, text/image only) |
| `<anchor>` | Anchor with task children (`go`, `prev`, `refresh`) |
| `<go href="...">` | Navigation task |
| `<prev>` | Navigate back |
| `<br>` | Line break |
| `<em>`, `<strong>`, `<b>`, `<i>`, `<u>` | Inline text emphasis |
| `<big>`, `<small>` | Text size |
| `<img src="..." alt="...">` | Image (alt and src are required) |
| `<table columns="N">` | Table (columns attribute required) |
| `<tr>`, `<td>` | Table row and cell |
| `<input name="...">` | Text/password input |
| `<select>` / `<option>` | Selection list |
| `<do type="...">` | Softkey/button binding |
| `<timer value="...">` | Timed card transition |
| `<head>` | Deck-level metadata (`access`, `meta`) |
| `<template>` | Deck-level event/do bindings applied to all cards |

### Constraints and Rules

- Text content must always be wrapped in `<p>` inside a `<card>`.
- `<img>` requires both `src` and `alt` attributes.
- `<table>` requires the `columns` attribute (integer).
- `<a>` may only contain `#PCDATA`, `<br>`, and `<img>` — no task elements.
- `<anchor>` may contain text, `<br>`, `<img>`, and task elements (`go`, `prev`, `refresh`).
- `<do>` requires a `type` attribute (e.g., `"accept"`, `"prev"`, `"help"`).
- `<input>` requires a `name` attribute.
- Boolean attributes accept only `"true"` or `"false"`.
- Variable references use the `$(varname)` syntax in attribute values (`%vdata`).
- The MIME type for WML content is `text/vnd.wap.wml`.
- WML `<go>` does **not** automatically submit `<input>` field values. Use `$(varname)` in the `href` or `<postfield>` elements for POST.

### Images on WAP Devices

WAP devices do not support PNG/JPEG/GIF. Use **WBMP** (Wireless Bitmap):
- Format: monochrome 1-bit
- MIME type: `image/vnd.wap.wbmp`
- Nokia 6310i screen: **96×65px**, monochrome

## Serving WML

The HTTP response must use the correct MIME type:

```
Content-Type: text/vnd.wap.wml
```

Without this, WAP gateways and browsers will not parse the document as WML.

## Docker

The app is containerised. The image contains no secrets — the API key is passed at runtime via the environment.

### Build

```
docker build -t wapgpt .
```

### Run

Pass the key explicitly:
```
docker run -e OPENAI_API_KEY=sk-... -p 3000:3000 wapgpt
```

Or use the local `.env` file:
```
docker run --env-file .env -p 3000:3000 wapgpt
```

### Files

| File | Purpose |
|---|---|
| `Dockerfile` | Builds the image from `node:22-alpine`, installs prod deps only |
| `.dockerignore` | Excludes `node_modules/`, `.env`, `.git/`, docs from the build context |

> Never `COPY .env` in the Dockerfile — always inject secrets at runtime.

## Public Exposure via ngrok

[ngrok](https://ngrok.com) is used to expose the local server to the public internet, which allows real WAP devices and gateways to reach it.

**Prerequisites:** ngrok must be installed and authenticated (`ngrok config add-authtoken <token>`).

Start the tunnel (in a separate terminal, after `npm start`):

```
ngrok http 3000
```

ngrok will print a public HTTPS URL such as:

```
https://<subdomain>.ngrok-free.app
```

The ngrok local inspection UI is available at `http://localhost:4040`.

> **Note:** The public URL changes every time ngrok restarts unless you have a paid ngrok plan with a reserved domain. Update any WAP device or gateway configuration with the new URL after each restart.
