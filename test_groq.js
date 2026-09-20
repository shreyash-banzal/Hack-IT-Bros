const fetch = require('node-fetch'); // wait I can just use native fetch

async function testGroq() {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer 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`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "hello" }],
            temperature: 0.1
        })
    });
    const data = await response.json();
    console.log(data);
}
testGroq();
