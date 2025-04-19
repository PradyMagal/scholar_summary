/**
 * CohereHelper - A utility class for generating search queries using Cohere AI
 * 
 * This class provides methods for generating Google Scholar search queries based on user interests.
 */

import { CohereClient } from "cohere-ai";

export interface CohereConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface QueryGenerationResponse {
  queries: string[];
  error?: string;
}

export class CohereHelper {
  private client: CohereClient;
  private model: string;
  private temperature: number;

  /**
   * Creates a new CohereHelper instance
   * 
   * @param config Configuration for the Cohere API
   */
  constructor(config: CohereConfig = {}) {
    const apiKey = config.apiKey || process.env.COHERE_KEY || '';
    this.model = config.model || process.env.COHERE_MODEL_FINE_TUNED || 'command-a-03-2025';
    this.temperature = config.temperature || 0.3;
    
    if (!apiKey) {
      throw new Error('Cohere API key is not configured. Please set COHERE_KEY in .env.local');
    }
    
    this.client = new CohereClient({
      token: apiKey
    });
  }

  /**
   * Generates Google Scholar search queries based on user interests
   * 
   * @param interests Array of user interests
   * @returns Promise with generated search queries
   */
  async generateSearchQueries(interests: string[]): Promise<QueryGenerationResponse> {
    try {
      // Format interests as a comma-separated string
      const interestsString = interests.join(', ');
      
      // Make the API call
      const response = await this.client.chat({
        model: this.model,
        message: "Generate 5 Google Scholar search queries based on these interests: " + interestsString,
        preamble: "You are a helpful assistant that takes in user interests and returns 5 google scholar search queries based on the interests. You do not need to use all of the interests the user provides.",
        temperature: this.temperature
      });
      
      // Parse the response to extract the queries
      const queries = this.parseQueriesFromResponse(response.text);
      
      return { queries };
    } catch (error) {
      console.error('Error generating search queries:', error);
      return { 
        queries: [],
        error: error instanceof Error ? error.message : 'Unknown error generating search queries'
      };
    }
  }
  
  /**
   * Parses the Cohere API response to extract search queries
   * 
   * @param response The raw response from Cohere API
   * @returns Array of search queries
   */
  private parseQueriesFromResponse(response: string): string[] {
    // Try to extract numbered list items (e.g., "1. query")
    const numberedList = response.match(/\d+\.\s*([^\n]+)/g);
    if (numberedList && numberedList.length > 0) {
      return numberedList.map(item => {
        // Remove the number and leading whitespace
        return item.replace(/^\d+\.\s*/, '').trim();
      });
    }
    
    // If no numbered list is found, try to extract queries by line breaks
    const lineBreakQueries = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('Here') && !line.startsWith('Based'));
    
    if (lineBreakQueries.length > 0) {
      return lineBreakQueries;
    }
    
    // If all else fails, just return the whole response as a single query
    return [response.trim()];
  }
  
  /**
   * Generates a single optimized search query based on multiple interests
   * 
   * @param interests Array of user interests
   * @returns Promise with a single optimized query
   */
  async generateOptimizedQuery(interests: string[]): Promise<string> {
    try {
      const response = await this.generateSearchQueries(interests);
      
      if (response.queries.length > 0) {
        // Return the first query as the optimized one
        return response.queries[0];
      }
      
      // Fallback to a simple query if no queries were generated
      return interests.join(' ');
    } catch (error) {
      console.error('Error generating optimized query:', error);
      // Fallback to a simple query
      return interests.join(' ');
    }
  }
}

/**
 * Example usage:
 * 
 * // Initialize the helper
 * const cohereHelper = new CohereHelper();
 * 
 * // Generate search queries
 * const response = await cohereHelper.generateSearchQueries(['biology', 'genetics', 'evolution']);
 * console.log(response.queries);
 * 
 * // Generate an optimized query
 * const optimizedQuery = await cohereHelper.generateOptimizedQuery(['biology', 'genetics', 'evolution']);
 * console.log(optimizedQuery);
 */
