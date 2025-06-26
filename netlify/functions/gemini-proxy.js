/**
 * Netlify Serverless Function to act as a secure proxy for the Google Gemini API.
 *
 * This updated version correctly handles HTTP methods, including the browser's
 * preflight OPTIONS request, to resolve 405 (Method Not Allowed) errors.
 *
 * How it works:
 * 1. Responds successfully to preflight OPTIONS requests from the browser.
 * 2. Rejects any method that is not POST.
 * 3. On a valid POST request, it securely calls the Gemini API and returns the result.
 */
exports.handler = async function(event, context) {
  // Define CORS headers to be returned with every response.
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS' // Specify allowed methods
  };

  // Handle the browser's preflight OPTIONS request.
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers,
      body: ''
    };
  }

  // Reject any request that is not a POST request.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Get the secret API key from Netlify's environment variables.
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const requestBody = JSON.parse(event.body);
    const userPrompt = requestBody.prompt;
    const userText = requestBody.text;

    if (!userPrompt || !userText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing 'prompt' or 'text' in the request body." }),
      };
    }

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: userPrompt + "\n\n" + userText }]
      }]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Gemini API request failed`, details: errorData }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
