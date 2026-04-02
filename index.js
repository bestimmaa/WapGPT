import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function wmlDeck(cards) {
  return `<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.1//EN"
    "http://www.wapforum.org/DTD/wml_1.1.xml">
<wml>
${cards}
</wml>`;
}

app.get("/logo.wbmp", (req, res) => {
  res.set("Content-Type", "image/vnd.wap.wbmp");
  res.sendFile("logo.wbmp", { root: "." });
});

app.get("/", (req, res) => {
  console.log("[GET /] Serving input card");
  res.set("Content-Type", "text/vnd.wap.wml");
  res.send(wmlDeck(`  <card id="main" title="WapGPT">
    <p><img src="/logo.wbmp" alt="WapGPT"/></p>
    <p><input name="prompt" title="Message" type="text" value="Ask anything..."/></p>
    <do type="accept" label="Send">
      <go href="/chat?prompt=$(prompt)" method="get"/>
    </do>
  </card>`));
});

app.get("/chat", async (req, res) => {
  const prompt = req.query.prompt || "";
  console.log(`[GET /chat] prompt="${prompt}"`);

  if (!prompt.trim()) {
    console.log("[GET /chat] Empty prompt, redirecting to /");
    res.redirect("/");
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Answer in 2-3 short sentences maximum. " +
            "Use plain text only — no markdown, bullets, or special characters. " +
            "Responses must fit a small mobile screen like a Nokia 6310i.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0].message.content.trim();
    console.log(`[OpenAI] raw reply (${raw.length} chars): "${raw}"`);
    const reply = raw.length > 300 ? raw.slice(0, 297) + "..." : raw;
    if (raw.length > 300) console.log("[OpenAI] Reply truncated to 300 chars");

    res.set("Content-Type", "text/vnd.wap.wml");
    res.send(wmlDeck(`  <card id="response" title="WapGPT">
    <p>${reply}</p>
    <p><a href="/">Back</a></p>
  </card>`));
  } catch (err) {
    console.error(`[GET /chat] Error: ${err.message}`);
    res.set("Content-Type", "text/vnd.wap.wml");
    res.send(wmlDeck(`  <card id="error" title="WapGPT">
    <p>Error: ${err.message}</p>
    <p><a href="/">Back</a></p>
  </card>`));
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
