import { NextRequest, NextResponse } from 'next/server';
import { CohereHelper } from '@/utils/cohereHelper';

/**
 * API route for Cohere search query generation
 * 
 * This route demonstrates how to use the CohereHelper class to generate
 * Google Scholar search queries based on user interests.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { interests } = body;

    // Validate interests
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json(
        { error: 'Interests must be a non-empty array' },
        { status: 400 }
      );
    }

    // Initialize the Cohere helper
    const cohereHelper = new CohereHelper();

    // Generate search queries
    const result = await cohereHelper.generateSearchQueries(interests);

    // Return the results
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in Cohere API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example usage:
 * 
 * // Generate search queries
 * fetch('/api/cohere', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     interests: ['biology', 'genetics', 'evolution']
 *   })
 * }).then(res => res.json()).then(data => console.log(data.queries));
 */
