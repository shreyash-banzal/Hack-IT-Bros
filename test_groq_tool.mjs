async function testGroq2() {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer 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`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: "What is 2+2?" }],
            tools: [{
                type: "function",
                function: { name: "test_tool", description: "test", parameters: { type: "object", properties: {} } }
            }],
            tool_choice: "auto",
            temperature: 0.1
        })
    });
    const data = await response.json();
    console.log(JSON.stringify(data));
}
testGroq2();
