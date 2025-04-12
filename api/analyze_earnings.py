from http.server import BaseHTTPRequestHandler
import requests
import json
import os
from google import genai
import re

# Initialize APIs
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
API_NINJAS_KEY = os.environ.get("API_NINJAS_KEY")
genai_client = genai.Client(api_key=GOOGLE_API_KEY)

def analyze_earnings_call(ticker, year, quarter):
    # 1. Get transcript from API Ninjas
    url = 'https://api.api-ninjas.com/v1/earningstranscript'
    headers = {'X-Api-Key': API_NINJAS_KEY}
    params = {'ticker': ticker, 'year': year, 'quarter': quarter}
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return {"error": f"API Error: {response.status_code}"}
    
    # 2. Get transcript data
    transcript_data = response.json()
    
    # 3. Analyze with Gemini
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
    
    try:
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        # Extract JSON from response
        json_match = re.search(r'({[\s\S]*})', response.text)
        if json_match:
            return json.loads(json_match.group(1))
        else:
            return {"error": "Could not extract JSON"}
    except Exception as e:
        return {"error": f"Gemini API Error: {str(e)}"}

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            ticker = data.get('ticker')
            year = data.get('year')
            quarter = data.get('quarter')
            
            if not ticker or not year or not quarter:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing parameters"}).encode())
                return
                
            result = analyze_earnings_call(ticker, year, quarter)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

def handler(request, context):
    return Handler.do_POST(Handler(), request)