async function getModels() {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
            "Authorization": `Bearer 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`,
        }
    });
    const data = await response.json();
    const lModels = data.data.filter(m => m.id.includes('llama-3') || m.id.includes('llama3'));
    lModels.forEach(m => console.log("FOUND_MODEL:" + m.id));
}
getModels();
