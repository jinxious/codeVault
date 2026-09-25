import os
import json
import base64
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# OpenRouter API
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Free multimodal model
AI_MODEL = os.getenv("AI_MODEL", "qwen/qwen3.8-27b:free")


def get_client():
    if not OPENROUTER_API_KEY:
        return None

    try:
        return OpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )
    except Exception as e:
        print(f"Failed to initialize AI Client: {e}")
        return None


# 1. PHOTO TO CODE
def extract_code_from_image(
    image_bytes: bytes,
    mime_type: str = "image/png"
) -> dict:

    client = get_client()

    if not client:
        return {
            "extracted_code": (
                "# [Note: Set OPENROUTER_API_KEY in backend/.env "
                "to use live AI extraction]\n\n"
                "# Demo Extracted Code:\n"
                "def bubble_sort(arr):\n"
                "    n = len(arr)\n"
                "    for i in range(n):\n"
                "        for j in range(0, n - i - 1):\n"
                "            if arr[j] > arr[j + 1]:\n"
                "                arr[j], arr[j + 1] = "
                "arr[j + 1], arr[j]\n"
                "    return arr"
            ),
            "language": "python",
            "notes": "Demo response (no API key configured)"
        }

    # Convert image bytes to base64
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """
    Extract all programming code visible in this image accurately.

    Return ONLY a valid JSON object in this exact format:

    {
      "extracted_code": "the extracted source code as a string",
      "language": "the detected programming language"
    }

    Do not explain the code.
    Do not add markdown.
    Preserve indentation and formatting as accurately as possible.
    """

    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": (
                                    f"data:{mime_type};base64,"
                                    f"{image_base64}"
                                )
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"}
        )

        text = response.choices[0].message.content.strip()

        return json.loads(text)

    except Exception as e:
        return {
            "extracted_code": f"// Error reading image: {str(e)}",
            "language": "text",
            "error": str(e)
        }


# 2. SMART FIX
def smart_fix_code(code: str, language: str) -> dict:

    client = get_client()

    if not client:
        return {
            "issues": [
                "Demo issue: Possible missing edge case "
                "check for empty input or syntax warning."
            ],
            "fixed_code": (
                code +
                "\n\n# [AI Smart Fix Suggestion]: "
                "Added comments and validated types."
            ),
            "explanation": (
                "Demo Smart Fix: AI checks for syntax bugs, "
                "edge conditions, and missing brackets."
            )
        }

    prompt = f"""
    Analyze this {language} code for:

    - Syntax errors
    - Logical errors
    - Bugs
    - Missing edge cases
    - Clearly identifiable bad practices

    Then provide the corrected code.

    Code:

    ```{language}
    {code}
    ```

    Return ONLY a valid JSON object in this exact format:

    {{
      "issues": [
        "list of identified issues as strings"
      ],
      "fixed_code": "the complete improved code as a string",
      "explanation": "short simple explanation of the fixes"
    }}

    Do not add markdown outside the JSON.
    Do not rewrite working code unnecessarily.
    """

    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"}
        )

        text = response.choices[0].message.content.strip()

        return json.loads(text)

    except Exception as e:
        return {
            "issues": [
                f"Error during AI analysis: {str(e)}"
            ],
            "fixed_code": code,
            "explanation": (
                "Could not complete smart fix at this time."
            )
        }


# 3. AI CODE EXPLANATION (IN HINGLISH)
def explain_code_hinglish(code: str, language: str) -> dict:

    client = get_client()

    if not client:
        return {
            "explanation": (
                "Ye code snippet vault ka basic demo explanation hai.\n\n"
                "1. Ye function data ko process karta hai step by step.\n"
                "2. Loop har item pe iterate karta hai aur conditions "
                "match karta hai.\n"
                "3. Simple, readable aur understandable code structure "
                "follow kiya gaya hai."
            ),
            "time_complexity": "O(n)",
            "space_complexity": "O(1)"
        }

    prompt = f"""
    You are a friendly programming teacher explaining code
    to a college student.

    Explain this {language} code in easy natural HINGLISH.

    Code:

    ```{language}
    {code}
    ```

    Explain:

    1. Code ka main goal kya hai.
    2. Code step-by-step kaise kaam karta hai.
    3. Important variables, loops and conditions.
    4. Time Complexity.
    5. Space Complexity.

    The explanation should sound like a helpful teacher,
    not a formal textbook.

    Return ONLY a valid JSON object:

    {{
      "explanation": "detailed Hinglish explanation",
      "time_complexity": "e.g. O(n)",
      "space_complexity": "e.g. O(1)"
    }}

    Do not add markdown outside the JSON.
    """

    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"}
        )

        text = response.choices[0].message.content.strip()

        return json.loads(text)

    except Exception as e:
        return {
            "explanation": (
                f"Explanation generate karne mein "
                f"error aaya: {str(e)}"
            ),
            "time_complexity": "N/A",
            "space_complexity": "N/A"
        }