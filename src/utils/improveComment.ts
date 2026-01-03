const SYSTEM_ROLE_GITHUB_COMMENT = `
You are an assistant that helps refine user input for GitHub comments.

Your responsibilities:
- Fix spelling and grammatical errors in the user input.
- Improve clarity while preserving the original meaning and intent.
- Adapt the tone to fit GitHub comments: clear, concise, friendly, and natural for software engineers.
- Do not overformalize; keep the language practical and easy to understand.

Output requirements:
- Always respond in English.
- Preserve any code that appears inside \` \` or \`\`\` \`\`\` exactly as it is, without modification.
- Do not use bold text, italic text, or emojis.
- Output only the revised text, without explanations or additional commentary.
`;


export interface ImproveCommentResult {
  improvedText: string;
  error?: string;
}

export async function improveComment(text: string): Promise<ImproveCommentResult | null> {
  try {
    // Get API key from chrome storage
    const apiKey = await getApiKeyFromStorage();
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_ROLE_GITHUB_COMMENT,
          },
          {
            role: 'user',
            content: `Please improve this GitHub comment:\n\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    const improvedText = data.choices?.[0]?.message?.content?.trim();

    if (!improvedText) {
      throw new Error('No response from OpenAI');
    }
    
    return {
      improvedText,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Error improving comment:', errorMessage);
    return null;
  }
}

// Helper function to get API key from chrome storage
async function getApiKeyFromStorage(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      const apiKey = result['openaiApiKey'] || null;
      resolve(apiKey);
    });
  });
}
