import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no está configurada en el servidor' });
    }
    const ai = new GoogleGenAI({ apiKey });
    const { prompt } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });
    
    res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Error in Gemini API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
