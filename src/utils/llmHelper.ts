/**
 * LLMHelper - A utility class for interacting with OpenAI's GPT models
 * 
 * This class provides methods for generating search terms and summarizing articles
 * using OpenAI's GPT-4.1 nano model.
 */

import OpenAI from "openai";

// Define interfaces for various OpenAI response formats
interface LegacyOpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenAIOutputContent {
  type?: string;
  text?: string;
}

interface OpenAIOutputItem {
  content?: OpenAIOutputContent[];
}

interface OpenAIResponseWithOutput {
  output?: OpenAIOutputItem[];
  output_text?: string;
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
}

export interface SearchTermsResponse {
  terms: string[];
  error?: string;
}

export interface SummaryResponse {
  title: string;
  summary: string;
  error?: string;
}

export class LLMHelper {
  private openai: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  /**
   * Creates a new LLMHelper instance
   * 
   * @param config Configuration for the LLM API
   */
  constructor(config: LLMConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
    this.model = config.model || 'gpt-4.1-nano';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 500;
  }

  /**
   * Generates search terms based on user interests
   * 
   * @param interests Array of user interests
   * @returns Promise with generated search terms
   */
  async generateSearchTerms(interests: string[]): Promise<SearchTermsResponse> {
    try {
      const prompt = `
        Generate 5 specific search terms for scholarly articles based on these interests: ${interests.join(', ')}.
        The search terms should be specific enough to find relevant academic papers.
        Return only the search terms as a JSON array of strings.
      `;

      const response = await this.callLLM(prompt);
      
      // Parse the response to extract search terms
      try {
        // The LLM might return a JSON string or plain text with terms
        // Try to parse as JSON first
        const parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse)) {
          return { terms: parsedResponse };
        }
        
        // If it's not an array, try to extract terms from text
        const terms = response
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('```'));
          
        return { terms };
      } catch {
        // If JSON parsing fails, split by newlines or commas
        const terms = response
          .split(/[\n,]/)
          .map(term => term.trim())
          .filter(term => term.length > 0 && !term.startsWith('```'));
          
        return { terms };
      }
    } catch (error) {
      console.error('Error generating search terms:', error);
      return { 
        terms: [],
        error: error instanceof Error ? error.message : 'Unknown error generating search terms'
      };
    }
  }

  /**
   * Summarizes a scholarly article
   * 
   * @param articleText The text content of the article to summarize
   * @returns Promise with the article summary
   */
  async summarizeArticle(articleText: string): Promise<SummaryResponse> {
    try {
      // Truncate article text if it's too long
      const truncatedText = articleText.length > 8000 
        ? articleText.substring(0, 8000) + '...' 
        : articleText;

      // Extract title if available
      let title = "Scholarly Article";
      let content = truncatedText;
      
      if (truncatedText.toLowerCase().includes("title:")) {
        const titleMatch = truncatedText.match(/title:\s*([^\n]+)/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
          // Remove the title from the content to avoid repetition
          content = truncatedText.replace(/title:\s*([^\n]+)/i, "").trim();
        }
      }

      // Use the specific format for scholarly article summarization
      const response = await this.openai.responses.create({
        model: this.model,
        input: [
          {
            "role": "system",
            "content": [
              {
                "type": "input_text",
                "text": "scholarly article summarizing based on snippet or abstract\nMake it straightforward and easy to understand, use information you know too to summarize. Do not start with this scholarly article- make it like daily fact or article... keep it formal but simple"
              }
            ]
          },
          {
            "role": "user",
            "content": [
              {
                "type": "input_text",
                "text": `title: ${title} … ${content} …\nExpand\nAssistant`
              }
            ]
          }
        ],
        text: {
          "format": {
            "type": "text"
          }
        },
        reasoning: {},
        tools: [],
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        store: true
      });

      // Log the full response for debugging
      console.log("OpenAI API response:", JSON.stringify(response, null, 2));
      
      // Handle the response
      let summary = "";
      
      // Check for output_text property (new API format)
      const responseWithOutput = response as unknown as OpenAIResponseWithOutput;
      if ('output_text' in response && typeof responseWithOutput.output_text === 'string') {
        console.log("Found output_text property");
        summary = responseWithOutput.output_text || '';
      }
      // Check for output array with message content (another format)
      else if ('output' in response && Array.isArray(responseWithOutput.output) && responseWithOutput.output && responseWithOutput.output.length > 0) {
        console.log("Found output array");
        const output = responseWithOutput.output[0];
        if (output && output.content && Array.isArray(output.content)) {
          for (const item of output.content) {
            if (item.type === 'output_text' && item.text) {
              summary = item.text;
              break;
            }
          }
        }
      }
      // Check if response has a text property
      else if (response.text !== undefined) {
        console.log("Found text property");
        if (typeof response.text === 'string') {
          summary = response.text;
        } else {
          // If it's an object, try to extract the content
          summary = "No summary content available from text property.";
        }
      } 
      // Check for choices array (legacy format)
      else if ('choices' in response) {
        console.log("Found choices array");
        const legacyResponse = response as unknown as LegacyOpenAIResponse;
        if (legacyResponse.choices && legacyResponse.choices.length > 0) {
          const firstChoice = legacyResponse.choices[0];
          if (firstChoice.message && firstChoice.message.content) {
            summary = firstChoice.message.content;
          }
        }
      } 
      // Last resort
      else {
        console.log("No recognized response format found");
        const responseStr = JSON.stringify(response);
        console.log("Fallback response string:", responseStr);
        summary = "Unable to extract summary from response.";
      }
      
      // If summary is still empty or just contains JSON, provide a default
      if (!summary || summary.trim() === "" || (summary.startsWith("{") && summary.endsWith("}"))) {
        summary = "The article discusses " + title + ". Unfortunately, not enough context was available to generate a detailed summary.";
      }

      return { title, summary };
    } catch (error) {
      console.error('Error summarizing article:', error);
      return {
        title: 'Error Summarizing Article',
        summary: 'There was an error generating the summary.',
        error: error instanceof Error ? error.message : 'Unknown error summarizing article'
      };
    }
  }

  /**
   * Makes a call to the OpenAI API
   * 
   * @param prompt The prompt to send to the LLM
   * @param systemPrompt Optional system prompt to override the default
   * @returns Promise with the LLM response text
   */
  private async callLLM(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.openai.responses.create({
        model: this.model,
        input: [
          {
            "role": "system",
            "content": [
              {
                "type": "input_text",
                "text": systemPrompt || "You are a helpful assistant specializing in academic research."
              }
            ]
          },
          {
            "role": "user",
            "content": [
              {
                "type": "input_text",
                "text": prompt
              }
            ]
          }
        ],
        text: {
          "format": {
            "type": "text"
          }
        },
        reasoning: {},
        tools: [],
        temperature: this.temperature,
        max_output_tokens: this.maxTokens,
        top_p: 1,
        store: true
      });

      // Handle the response text safely
      if (response.text && typeof response.text === 'string') {
        return response.text;
      } else if (response.text && typeof response.text === 'object') {
        // If text is an object with content
        return JSON.stringify(response.text);
      } else {
        // Fallback
        return String(response);
      }
    } catch (error) {
      console.error('Error calling LLM API:', error);
      throw error;
    }
  }
}

/**
 * Example usage:
 * 
 * // Initialize the helper
 * const llmHelper = new LLMHelper({
 *   apiKey: process.env.OPENAI_API_KEY || '',
 * });
 * 
 * // Generate search terms
 * const searchTerms = await llmHelper.generateSearchTerms(['biology', 'genetics', 'evolution']);
 * 
 * // Summarize an article
 * const summary = await llmHelper.summarizeArticle(articleText);
 */
