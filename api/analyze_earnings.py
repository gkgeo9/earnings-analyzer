from http.server import BaseHTTPRequestHandler
import requests
import json
import os
import re

# For Vercel serverless functions
from json import JSONEncoder

# Check for Google API - only import if available
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
API_NINJAS_KEY = os.environ.get("API_NINJAS_KEY")

has_google_api = False
try:
    if GOOGLE_API_KEY:
        from google import genai
        genai_client = genai.Client(api_key=GOOGLE_API_KEY)
        has_google_api = True
except ImportError:
    print("Google Generative AI package not installed")

# Mock data for testing or when APIs are unavailable
MOCK_ANALYSIS = {
    "executive_analysis": {
        "overall_tone": "positive",
        "confidence_level": "high",
        "hedging_language": ["may", "could", "potentially"],
        "strong_claims": ["We delivered record revenue", "Our strategy is working"],
        "key_messages": ["Strong revenue growth", "Expanding market share", "Continued innovation"]
    },
    "qa_analysis": {
        "most_evasive_questions": [
            {
                "question": "Can you provide more details on the margin pressure?",
                "analyst": "John Smith",
                "directness": "somewhat indirect",
                "evasion_tactics": ["Focusing on growth instead", "Changing topic"]
            }
        ],
        "notable_insights": ["Planning expansion in Asia", "New product launch in Q3"]
    },
    "forward_looking_statements": ["Expect continued growth next quarter", "Planning to increase R&D investment"],
    "red_flags": ["Slight margin compression", "Increasing competition in core markets"],
    "overall_assessment": "Overall strong performance with some challenges on the horizon."
}

def analyze_earnings_call(ticker, year, quarter):
    """Get and analyze an earnings call transcript"""
    try:
        # Check if API keys are available
        if not API_NINJAS_KEY:
            print("API Ninjas key not found in environment variables")
            return {
                **MOCK_ANALYSIS,
                "warning": "API key not configured. Using mock data."
            }
            
        # 1. Get transcript from API Ninjas
        url = 'https://api.api-ninjas.com/v1/earningstranscript'
        headers = {'X-Api-Key': API_NINJAS_KEY}
        params = {'ticker': ticker, 'year': year, 'quarter': quarter}
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"API Ninjas error: {response.status_code} - {response.text}")
            return {
                "error": f"Error retrieving transcript: {response.status_code}",
                "mock_data": MOCK_ANALYSIS
            }
        
        # 2. Get transcript data
        transcript_data = response.json()
        
        # 3. Check if Google Gemini is available
        if not has_google_api:
            print("Google Gemini API not available")
            return {
                **MOCK_ANALYSIS,
                "warning": "Google API not configured. Using mock data."
            }
        
        # 4. Analyze with Gemini
        prompt = f"""
        You are an expert financial analyst examining an earnings call transcript for {ticker}.
        Analyze this transcript and provide insights in JSON format:
        {json.dumps(transcript_data)}

        Please provide your analysis in this JSON format:
        {{
            "executive_analysis": {{
                "overall_tone": "very negative/negative/neutral/positive/very positive",
                "confidence_level": "very low/low/moderate/high/very high",
                "hedging_language": ["examples"],
                "strong_claims": ["examples"],
                "key_messages": ["main points"]
            }},
            "qa_analysis": {{
                "most_evasive_questions": [
                    {{
                        "question": "text",
                        "analyst": "name",
                        "directness": "very indirect/somewhat indirect/neutral/somewhat direct/very direct",
                        "evasion_tactics": ["tactics"]
                    }}
                ],
                "notable_insights": ["insights"]
            }},
            "forward_looking_statements": ["projections"],
            "red_flags": ["concerns"],
            "overall_assessment": "brief assessment"
        }}
        """
        
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        # Extract JSON from response
        json_match = re.search(r'({[\s\S]*})', response.text)
        if json_match:
            return json.loads(json_match.group(1))
        else:
            return {
                "error": "Could not extract JSON from Gemini response",
                "mock_data": MOCK_ANALYSIS
            }
            
    except Exception as e:
        print(f"Error in analyze_earnings_call: {str(e)}")
        return {
            "error": f"Analysis error: {str(e)}",
            "mock_data": MOCK_ANALYSIS
        }

def handler(request):
    """Handler for Vercel serverless function"""
    try:
        # Check if it's a POST request
        if request.method != "POST":
            return {
                "statusCode": 405,
                "body": json.dumps({"error": "Method not allowed. Use POST"})
            }
        
        # Parse request body
        body = json.loads(request.body)
        ticker = body.get('ticker')
        year = body.get('year')
        quarter = body.get('quarter')
        
        if not ticker or not year or not quarter:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing required parameters: ticker, year, quarter"})
            }
        
        # Analyze earnings call
        result = analyze_earnings_call(ticker, year, quarter)
        
        # Return results
        return {
            "statusCode": 200,
            "body": json.dumps(result)
        }
        
    except Exception as e:
        print(f"Handler error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": f"Server error: {str(e)}",
                "mock_data": MOCK_ANALYSIS
            })
        }