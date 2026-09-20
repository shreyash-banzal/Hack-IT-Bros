import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

let groqInstance: Groq | null = null;

export function getGroqClient(): { client: Groq | null; error?: string } {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return {
      client: null,
      error: 'GROQ_API_KEY is not configured in the environment. Please set GROQ_API_KEY in .env or Settings.',
    };
  }

  if (!groqInstance) {
    groqInstance = new Groq({ apiKey });
  }

  return { client: groqInstance };
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}
