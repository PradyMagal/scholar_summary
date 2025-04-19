/**
 * ScholarHelper - A utility class for interacting with Google Scholar via ScrapingDog API
 * 
 * This class provides methods for searching scholarly articles based on query terms.
 */

import axios from 'axios';

export interface ScholarConfig {
  apiKey?: string;
  resultsPerPage?: number;
  language?: string;
}

// Define interfaces based on the actual ScrapingDog response format
export interface ScholarSearchResult {
  title: string;
  title_link: string;
  id: string;
  displayed_link?: string;
  snippet?: string;
  inline_links?: {
    versions?: {
      total: string;
      link: string;
      cluster_id: string;
    };
    cited_by?: {
      total: string;
      link: string;
    };
    related_pages_link?: string;
  };
  resources?: Array<{
    title: string;
    type: string;
    link: string;
  }>;
}

export interface ScrapingDogResponse {
  search_details: {
    query: string;
    number_of_results: string;
  };
  scholar_results: ScholarSearchResult[];
  related_searches: Array<{
    query: string;
    link: string;
  }>;
  pagination: {
    current: number;
    page_no: Record<string, string>;
  };
  scrapingdog_pagination: {
    current: number;
    page_no: Record<string, string>;
  };
}

export interface ScholarSearchResponse {
  search_details?: {
    query: string;
    number_of_results: string;
  };
  scholar_results?: ScholarSearchResult[];
  error?: string;
}

export class ScholarHelper {
  private apiKey: string;
  private resultsPerPage: number;
  private language: string;
  private baseUrl: string;

  /**
   * Creates a new ScholarHelper instance
   * 
   * @param config Configuration for the Scholar API
   */
  constructor(config: ScholarConfig = {}) {
    this.apiKey = config.apiKey || process.env.SCRAPINGDOG_KEY || '';
    this.resultsPerPage = config.resultsPerPage || 20;
    this.language = config.language || 'en';
    this.baseUrl = 'https://api.scrapingdog.com/google_scholar/';
  }

  /**
   * Searches for scholarly articles based on a query
   * 
   * @param query The search query
   * @param page The page number (0-based)
   * @returns Promise with search results
   */
  async searchArticles(query: string, page: number = 0): Promise<ScholarSearchResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('ScrapingDog API key is not configured. Please set SCRAPINGDOG_KEY in .env.local');
      }

      const params = {
        api_key: this.apiKey,
        query: query,
        language: this.language,
        page: page,
        results: this.resultsPerPage
      };

      console.log("Searching for:", query);
      const response = await axios.get(this.baseUrl, { params });

      if (response.status !== 200) {
        throw new Error(`Request failed with status code: ${response.status}`);
      }

      // Log the response for debugging
      console.log("ScrapingDog API response:", JSON.stringify(response.data, null, 2));

      // Check if the response matches the expected format
      const data = response.data as ScrapingDogResponse;
      
      // If scholar_results is empty, try to search with a more general query
      if (data.scholar_results && data.scholar_results.length === 0) {
        console.log("No results found for the specific query. Trying a more general search...");
        
        // Extract main keywords from the query
        const keywords = query
          .replace(/['"]/g, '') // Remove quotes
          .split(/\s+/)
          .filter(word => word.length > 3) // Only keep words longer than 3 characters
          .slice(0, 3); // Take up to 3 keywords
        
        if (keywords.length > 0) {
          const generalQuery = keywords.join(' ');
          console.log("Trying more general query:", generalQuery);
          
          // Only try the general query if it's different from the original
          if (generalQuery !== query) {
            return this.searchArticles(generalQuery, page);
          }
        }
      }
      
      // Return the response as is
      return {
        search_details: data.search_details,
        scholar_results: data.scholar_results || []
      };
    } catch (error) {
      console.error('Error searching for articles:', error);
      return {
        search_details: {
          query: query,
          number_of_results: "0 results"
        },
        scholar_results: [],
        error: error instanceof Error ? error.message : 'Unknown error searching for articles'
      };
    }
  }

  /**
   * Searches for scholarly articles based on a list of interests
   * 
   * @param interests Array of user interests
   * @param page The page number (0-based)
   * @returns Promise with search results
   */
  async searchByInterests(interests: string[], page: number = 0): Promise<ScholarSearchResponse> {
    // Create a query string from the interests
    const query = interests.join(' ');
    return this.searchArticles(query, page);
  }

  /**
   * Searches for scholarly articles with a more specific query based on interests
   * 
   * @param interests Array of user interests
   * @param page The page number (0-based)
   * @returns Promise with search results
   */
  async searchWithAdvancedQuery(interests: string[], page: number = 0): Promise<ScholarSearchResponse> {
    // Create a more specific query using AND/OR operators
    let query = '';
    
    if (interests.length === 1) {
      query = interests[0];
    } else if (interests.length === 2) {
      query = `${interests[0]} AND ${interests[1]}`;
    } else {
      // For more than 2 interests, use a combination of AND/OR
      const primaryInterests = interests.slice(0, 2).join(' AND ');
      const secondaryInterests = interests.slice(2).join(' OR ');
      query = `(${primaryInterests}) AND (${secondaryInterests})`;
    }
    
    return this.searchArticles(query, page);
  }
}

/**
 * Example usage:
 * 
 * // Initialize the helper
 * const scholarHelper = new ScholarHelper();
 * 
 * // Search for articles
 * const results = await scholarHelper.searchArticles('quantum computing');
 * 
 * // Search by interests
 * const interestResults = await scholarHelper.searchByInterests(['biology', 'genetics', 'evolution']);
 */
