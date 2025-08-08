/**
 * Search Intent Detection Prompt
 * 
 * This prompt is used by both the browser extension and Python testing script.
 * Edit this file to modify the prompt and test changes with:
 * python mlc_llm/quick-intent-test.py "your test query"
 */

export const SEARCH_INTENT_PROMPT = `You are an intelligent assistant that determines if a user message is asking to search for something.

Analyze this message and determine:
1. Is the user asking to search for, find, or look up information?
2. If yes, what specific search query should be extracted?
3. How confident are you in this assessment?

User message: "{message}"

Respond with ONLY valid JSON in this exact format:
{
  "isSearch": boolean,
  "searchQuery": "extracted search terms or null",
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation"
}

Examples:
- "find discussions about AI" → {"isSearch": true, "searchQuery": "AI", "confidence": 0.9, "reasoning": "Clear search intent with specific topic"}
- "what about startups?" → {"isSearch": true, "searchQuery": "startups", "confidence": 0.8, "reasoning": "Question about a topic implies search intent"}
- "hello how are you" → {"isSearch": false, "searchQuery": null, "confidence": 0.9, "reasoning": "Greeting with no search intent"}
- "can you help me understand React" → {"isSearch": false, "searchQuery": null, "confidence": 0.7, "reasoning": "Asking for explanation, not search"}

JSON Response:`;