class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    this.systemPrompt = 'You are a helpful study assistant built into Apna Browser, designed for Indian students. ' +
      'Keep responses concise and educational. Reference NCERT chapters, JEE/NEET syllabus topics when relevant. ' +
      'Use simple language. If explaining a concept, use relatable examples.';
  }

  isConfigured() {
    return this.apiKey.length > 0;
  }

  async summarize(pageText) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured. Set GEMINI_API_KEY environment variable to enable AI features.' };
    }
    const prompt = `Summarize the following webpage content in 4-6 bullet points for a student studying for exams:\n\n${pageText.substring(0, 6000)}`;
    return this._call(prompt);
  }

  async explain(text) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured. Set GEMINI_API_KEY environment variable to enable AI features.' };
    }
    const prompt = `Explain this concept in simple terms that a high school student can understand. Use examples:\n\n${text.substring(0, 4000)}`;
    return this._call(prompt);
  }

  async ask(pageText, question) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured. Set GEMINI_API_KEY environment variable to enable AI features.' };
    }
    const prompt = `Based on this webpage content, answer the student's question.\n\nPage content:\n${pageText.substring(0, 5000)}\n\nQuestion: ${question}`;
    return this._call(prompt);
  }

  async _call(prompt) {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: this.systemPrompt + '\n\n' + prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        return { error: `API error (${response.status}): ${errBody.substring(0, 200)}` };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return { error: 'No response from AI.' };
      return { text };
    } catch (err) {
      return { error: `Failed to reach AI service: ${err.message}` };
    }
  }
}

module.exports = new AIService();
