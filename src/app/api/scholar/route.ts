import { NextRequest, NextResponse } from 'next/server';
import { ScholarHelper } from '@/utils/scholarHelper';

/**
 * API route for Google Scholar searches
 * 
 * This route demonstrates how to use the ScholarHelper class to search for scholarly articles.
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam) : 0;

    // Check if query is provided
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Initialize the Scholar helper
    const scholarHelper = new ScholarHelper();

    // Search for articles
    const result = await scholarHelper.searchArticles(query, page);

    // Return the results
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in Scholar API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for searching by interests
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { interests, page = 0, advanced = false } = body;

    // Validate interests
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json(
        { error: 'Interests must be a non-empty array' },
        { status: 400 }
      );
    }

    // Initialize the Scholar helper
    const scholarHelper = new ScholarHelper();

    // Search for articles based on interests
    let result;
    if (advanced) {
      result = await scholarHelper.searchWithAdvancedQuery(interests, page);
    } else {
      result = await scholarHelper.searchByInterests(interests, page);
    }

    // Return the results
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in Scholar API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example usage:
 * 
 * // Simple query search
 * fetch('/api/scholar?query=quantum+computing&page=0')
 *   .then(res => res.json())
 *   .then(data => console.log(data));
 * 
 * // Search by interests
 * fetch('/api/scholar', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     interests: ['biology', 'genetics', 'evolution'],
 *     page: 0,
 *     advanced: true // Use advanced query formatting
 *   })
 * }).then(res => res.json()).then(data => console.log(data));
 */
