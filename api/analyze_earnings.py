from http.server import BaseHTTPRequestHandler
import json

# Basic mock data
MOCK_ANALYSIS = {
    "executive_analysis": {
        "overall_tone": "positive",
        "confidence_level": "high",
        "key_messages": ["Strong revenue growth", "Expanding market share"]
    },
    "qa_analysis": {
        "notable_insights": ["Planning expansion in Asia"]
    },
    "red_flags": ["Slight margin compression"],
    "overall_assessment": "Overall strong performance."
}

def handler(request):
    """Simplified handler for Vercel serverless function"""
    try:
        # Return mock data regardless of input
        return {
            "statusCode": 200,
            "body": json.dumps(MOCK_ANALYSIS)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": f"Server error: {str(e)}"
            })
        }