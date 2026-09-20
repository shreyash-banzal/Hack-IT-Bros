async function getModels() {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
            "Authorization": `Bearer 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`,
        }
    });
    const data = await response.json();
    console.log(data.data.map(m => m.id).join(', '));
}
getModels();
