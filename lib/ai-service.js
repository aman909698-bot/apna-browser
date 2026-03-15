class AIService {
  constructor() {
    this.apiKey = 'fb4e9fd4593d48b8ba18c2111544b40f.aETInM7tzgkRUg09';
    this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    this.model = 'glm-4-flash';
    this.systemPrompt = 'You are a helpful study assistant built into Apna Browser, designed for Indian students. ' +
      'Keep responses concise and educational. Reference NCERT chapters, JEE/NEET syllabus topics when relevant. ' +
      'Use simple language. If explaining a concept, use relatable examples.';
  }

  async summarize(pageText) {
    const prompt = `Summarize the following webpage content in 4-6 bullet points for a student studying for exams:\n\n${pageText.substring(0, 6000)}`;
    return this._call(prompt);
  }

  async explain(text) {
    const prompt = `Explain this concept in simple terms that a high school student can understand. Use examples:\n\n${text.substring(0, 4000)}`;
    return this._call(prompt);
  }

  async ask(pageText, question) {
    const prompt = `Based on this webpage content, answer the student's question.\n\nPage content:\n${pageText.substring(0, 5000)}\n\nQuestion: ${question}`;
    return this._call(prompt);
  }

  async _call(prompt) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        return { error: `API error (${response.status}): ${errBody.substring(0, 200)}` };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) return { error: 'No response from AI.' };
      return { text };
    } catch (err) {
      return { error: `Failed to reach AI service: ${err.message}` };
    }
  }
}

module.exports = new AIService();
