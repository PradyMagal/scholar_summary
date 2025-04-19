import { NextRequest, NextResponse } from 'next/server';
import { LLMHelper } from '@/utils/llmHelper';

/**
 * API route for article summarization
 * 
 * This route uses the LLMHelper class to summarize article text.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text } = body;

    // Validate text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text must be a non-empty string' },
        { status: 400 }
      );
    }

    // Initialize the LLM helper
    const llmHelper = new LLMHelper({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Summarize the article
    const result = await llmHelper.summarizeArticle(text);

    // Return the results
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in summarize API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example usage:
 * 
 * // Summarize an article
 * fetch('/api/summarize', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     text: 'title: Example Article\nThis is the content of the article to summarize...'
 *   })
 * }).then(res => res.json()).then(data => console.log(data));
 */
