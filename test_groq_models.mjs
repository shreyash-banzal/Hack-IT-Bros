async function getModels() {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
            "Authorization": `Bearer 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`,
        }
    });
    const data = await response.json();
    console.log(JSON.stringify(data.data.map(m => m.id), null, 2));
}
getModels();
