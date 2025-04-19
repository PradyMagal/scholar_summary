"use client";

import { useState, useEffect } from "react";

// TypeWriter component for code typing effect
const TypeWriter = ({ text, speed = 100, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);
  
  return (
    <span className="font-mono">{displayText}<span className="animate-pulse">|</span></span>
  );
};

export default function Home() {
  const [interest, setInterest] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [article, setArticle] = useState<{ 
    title: string; 
    summary: string; 
    link?: string;
    originalTitle?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [typingComplete, setTypingComplete] = useState(false);
  const [typingSubtitle, setTypingSubtitle] = useState(false);

  const addInterest = () => {
    if (interest.trim() && !interests.includes(interest.trim())) {
      setInterests([...interests, interest.trim()]);
      setInterest("");
    }
  };

  const removeInterest = (index: number) => {
    const newInterests = [...interests];
    newInterests.splice(index, 1);
    setInterests(newInterests);
  };

  const generateArticle = async () => {
    if (interests.length === 0) return;
    
    setLoading(true);
    try {
      // Step 1: Call the Cohere API with the selected interests
      const cohereResponse = await fetch('/api/cohere', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interests }),
      });
      
      const cohereData = await cohereResponse.json();
      
      if (!cohereData.queries || cohereData.queries.length === 0) {
        setArticle({
          title: "No Queries Generated",
          summary: "We couldn't generate any queries based on your interests. Please try with different interests."
        });
        setLoading(false);
        return;
      }
      
      // Select a random query from the response
      const randomIndex = Math.floor(Math.random() * cohereData.queries.length);
      const selectedQuery = cohereData.queries[randomIndex];
      
      // Remove markdown formatting if present
      const cleanQuery = selectedQuery.replace(/\*\*/g, '');
      
      // Step 2: Use the query to search Google Scholar
      const scholarResponse = await fetch(`/api/scholar?query=${encodeURIComponent(cleanQuery)}`);
      const scholarData = await scholarResponse.json();
      
      if (!scholarData.scholar_results || scholarData.scholar_results.length === 0) {
        setArticle({
          title: `No Results Found for: ${cleanQuery}`,
          summary: `We couldn't find any scholarly articles for the query: "${cleanQuery}". Please try with different interests.`
        });
        setLoading(false);
        return;
      }
      
      // Step 3: Pick a random result from the Scholar API response
      console.log("Scholar results:", scholarData.scholar_results);
      
      if (!Array.isArray(scholarData.scholar_results)) {
        setArticle({
          title: `Invalid Results Format for: ${cleanQuery}`,
          summary: `The search results were not in the expected format. Please try again.`
        });
        setLoading(false);
        return;
      }
      
      const randomResultIndex = Math.floor(Math.random() * scholarData.scholar_results.length);
      const selectedResult = scholarData.scholar_results[randomResultIndex];
      
      if (!selectedResult || !selectedResult.title) {
        console.error("Invalid result selected:", selectedResult);
        setArticle({
          title: `Error Processing Results`,
          summary: `We encountered an error while processing the search results. Please try again.`
        });
        setLoading(false);
        return;
      }
      
      // Step 4: Feed the title and snippet into the LLMHelper's summarizeArticle method
      const articleText = `title: ${selectedResult.title}\n${selectedResult.snippet || ""}`;
      
      // Create a simple API endpoint for summarization
      const llmResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: articleText }),
      });
      
      if (!llmResponse.ok) {
        throw new Error('Failed to summarize article');
      }
      
      const summaryData = await llmResponse.json();
      
      // Step 5: Display the summary along with a button for the link
      setArticle({
        title: summaryData.title || selectedResult.title,
        summary: summaryData.summary || "No summary available.",
        link: selectedResult.title_link,
        originalTitle: selectedResult.title
      });
    } catch (error) {
      console.error("Error in article generation process:", error);
      setArticle({
        title: "Error Generating Article",
        summary: "An error occurred while generating the article. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize splash screen and typing effects
  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    
    return () => clearTimeout(splashTimer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0f3057] to-[#2c1a4d] text-white">
      {/* Splash Screen */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0a192f] via-[#0f3057] to-[#2c1a4d]">
          <div className="text-center">
            <div className="mb-6 text-6xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500">
                <TypeWriter 
                  text="Scholar Summary" 
                  speed={80} 
                  onComplete={() => setTypingComplete(true)} 
                />
              </span>
            </div>
            {typingComplete && (
              <div className="text-teal-200 opacity-0 animate-fadeIn">
                <TypeWriter 
                  text="Discover the knowledge you seek..." 
                  speed={50} 
                  onComplete={() => setTypingSubtitle(true)} 
                />
              </div>
            )}
            <div className="mt-8">
              <div className="w-16 h-16 mx-auto border-t-4 border-teal-500 border-solid rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500">
            {!showSplash && (
              <TypeWriter 
                text="Scholar Summary - By Prad Magal" 
                speed={80} 
                onComplete={() => setTypingComplete(true)} 
              />
            )}
            {showSplash && "Scholar Summary"}
          </h1>
          <p className="text-teal-200">
            {!showSplash && typingComplete ? (
              <TypeWriter 
                text="Discover and summarize scholarly articles based on your interests" 
                speed={30} 
                onComplete={() => setTypingSubtitle(true)} 
              />
            ) : (
              showSplash ? "Discover and summarize scholarly articles based on your interests" : ""
            )}
          </p>
        </header>

        <main className={`max-w-3xl mx-auto transition-opacity duration-1000 ${!showSplash && typingSubtitle ? 'opacity-100' : 'opacity-0'}`}>
          {/* Interest Selector */}
          <div className="mb-12 bg-[#162a47] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Select Your Interests</h2>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addInterest()}
                placeholder="Add an interest (e.g., biology, AI, physics)"
                className="flex-1 px-4 py-2 rounded-md bg-[#0d1b2a] border border-teal-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
              <button
                onClick={addInterest}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-md transition-colors"
              >
                Add
              </button>
            </div>

            {/* Interest Tags */}
            <div className="flex flex-wrap gap-2">
              {interests.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900 text-white"
                >
                  <span>{item}</span>
                  <button
                    onClick={() => removeInterest(index)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-700 hover:bg-purple-600 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {interests.length === 0 && (
                <p className="text-gray-400 italic">No interests selected yet</p>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="mb-12 text-center">
            <button
              onClick={generateArticle}
              disabled={interests.length === 0 || loading}
              className={`px-6 py-3 rounded-md text-lg font-medium transition-all transform hover:scale-105 ${
                interests.length === 0
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 shadow-lg"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Article Summary"
              )}
            </button>
          </div>

          {/* Article Summary */}
          {article && (
            <div className="bg-[#162a47] p-6 rounded-lg shadow-lg animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 text-teal-300">{article.title}</h2>
              <div className="bg-[#0d1b2a] p-4 rounded-md mb-4">
                <h3 className="text-lg font-semibold mb-2 text-purple-300">Summary</h3>
                <p className="text-gray-200 leading-relaxed">{article.summary}</p>
                
                {article.originalTitle && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-md font-semibold mb-2 text-teal-400">Original Article</h4>
                    <p className="text-gray-300 text-sm">{article.originalTitle}</p>
                  </div>
                )}
              </div>
              
              {article.link && (
                <div className="text-center">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors"
                  >
                    Read Full Article
                  </a>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
