# Scholar Summary

A Next.js application that finds and summarizes scholarly articles based on your interests. The app uses a fine tuned Cohere model for generating relevant search queries, Google Scholar for finding academic papers, and OpenAI's GPT 4.1 Nano for creating easy-to-understand summaries.

## Features

- Select multiple interests to discover relevant scholarly content
- Sleek UI with typing animations and a modern dark theme(thank you Tailwind)
- Automatic query generation based on your interests
- Random article selection to discover unexpected knowledge
- Concise summaries of complex academic papers
- Direct links to original articles for user to read

## API Endpoints

The application exposes several API endpoints that power the main functionality:

### `/api/cohere`

Generates search queries based on your interests using Cohere's language model.

**Request:**
```http
POST /api/cohere
Content-Type: application/json

{
  "interests": ["AI", "electric vehicles", "sustainability"]
}
```

**Response:**
```json
{
  "queries": [
    "AI-driven advancements in electric vehicle technology",
    "Sustainable practices in electric vehicle manufacturing",
    "Machine learning applications for EV battery optimization",
    "Environmental impact of AI-powered electric transportation",
    "Smart grid integration with electric vehicles using artificial intelligence"
  ]
}
```

### `/api/scholar`

Searches Google Scholar for academic papers based on a query.

**Request:**
```http
GET /api/scholar?query=AI-driven%20advancements%20in%20electric%20vehicle%20technology
```

**Response:**
```json
{
  "search_details": {
    "query": "AI-driven advancements in electric vehicle technology",
    "number_of_results": "About 270,000 results"
  },
  "scholar_results": [
    {
      "title": "Deep-learning-based real-time road traffic prediction using long-term evolution access data",
      "title_link": "https://www.mdpi.com/1424-8220/19/23/5327",
      "id": "TOwukkiM8ncJ",
      "displayed_link": "B Ji, EJ Hong - Sensors, 2019 - mdpi.com",
      "snippet": "This paper proposed a deep-learning-based real-time road traffic prediction method using LTE access data between drivers and base stations...",
      ...
    },
    ...
  ]
}
```

### `/api/summarize`

Summarizes an article using OpenAI's language model.

**Request:**
```http
POST /api/summarize
Content-Type: application/json

{
  "text": "title: Advances in AI for Electric Vehicles\nRecent research has shown significant improvements in battery efficiency and range prediction using deep learning algorithms."
}
```

**Response:**
```json
{
  "title": "Advances in AI for Electric Vehicles",
  "summary": "Artificial intelligence is revolutionizing electric vehicle technology, particularly in battery management. Recent research demonstrates how deep learning algorithms can significantly improve predictions of battery efficiency and driving range. These AI systems analyze patterns in usage data to optimize performance and extend battery life, addressing one of the key concerns for EV adoption."
}
```

## Environment Setup

This application requires several API keys to function properly:

1. Create a `.env.local` file at the root of your project
2. Add the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
COHERE_KEY=your_cohere_api_key
SCRAPINGDOG_KEY=your_scrapingdog_api_key
COHERE_MODEL_FINE_TUNED=command-a-03-2025
```

## Testing with Postman

You can test the API endpoints using Postman:

1. Start the development server with `npm run dev`
2. Create a new request in Postman with the appropriate URL, method, and body
3. Send the request and examine the response

For example, to test the Cohere endpoint:
- URL: `http://localhost:3000/api/cohere`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{"interests": ["AI", "electric vehicles", "sustainability"]}`

## Running the Application

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src/app/api` - API routes for Cohere, Scholar, and summarization
- `/src/utils` - Helper classes for interacting with external APIs
- `/src/app/page.tsx` - Main application page with UI components

## Security Notes

- Never commit your `.env.local` file to version control
- The `.gitignore` file should already include `.env.local`
- For production, set environment variables in your hosting platform (Vercel, Netlify, etc.)
