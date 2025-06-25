// The code for your serverless function.
exports.handler = async function(event, context) {
  // Get the secret API key from Netlify's environment variables.
  const apiKey = process.env.GEMINI_API_KEY;
  
  // The API URL for Gemini.
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    // Get the prompt sent from your front-end.
    const requestBody = JSON.parse(event.body);
    const userPrompt = requestBody.prompt;
    const userText = requestBody.text;

    // Construct the payload to send to the Gemini API.
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: userPrompt + "\n\n" + userText }]
      }]
    };

    // Make the secure call to the Gemini API from the server.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // If the API call fails, return an error.
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API request failed with status ${response.status}` }),
      };
    }

    const data = await response.json();

    // Return the successful response from Gemini back to your front-end.
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    // Handle any other errors.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};