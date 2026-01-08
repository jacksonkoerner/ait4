/**
 * AI Prompt Lab - API Configuration and Helpers
 * Uses Google Gemini for both text and image generation
 */

// API Configuration - Gemini only
const API_CONFIG = {
    gemini: {
        name: 'Google Gemini',
        key: '',
        description: 'Gemini for text and image generation',
        keyUrl: 'https://aistudio.google.com/app/apikey',
        // Using gemini-2.0-flash for fast image generation
        imageModel: 'gemini-3-pro-image-preview',
        textModel: 'gemini-2.0-flash'
    }
};

// LocalStorage keys
const STORAGE_KEYS = {
    GEMINI_KEY: 'aipromptlab_gemini_key',
    USER_PROGRESS: 'aipromptlab_progress'
};

/**
 * Initialize API configuration from localStorage
 */
function initializeApiConfig() {
    API_CONFIG.gemini.key = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
}

/**
 * Save API key to localStorage
 */
function saveApiKey(service, key) {
    if (service === 'gemini') {
        localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key);
        API_CONFIG.gemini.key = key;
        return true;
    }
    return false;
}

/**
 * Get API key for a service
 */
function getApiKey(service) {
    return API_CONFIG[service]?.key || '';
}

/**
 * Check if an API is configured
 */
function isApiConfigured(service) {
    return !!API_CONFIG[service]?.key;
}

/**
 * Get all API statuses
 */
function getApiStatuses() {
    return {
        gemini: isApiConfigured('gemini')
    };
}

/**
 * Test Gemini API connection
 */
async function testGeminiApi() {
    const key = API_CONFIG.gemini.key;
    if (!key) {
        throw new Error('API key not configured');
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
            { method: 'GET' }
        );

        if (response.status === 400 || response.status === 401) {
            throw new Error('Invalid API key');
        }

        if (response.ok) {
            return { success: true, message: 'API key is valid' };
        }

        throw new Error('Unable to verify API key');
    } catch (error) {
        if (error.message === 'Invalid API key') {
            throw error;
        }
        throw new Error('Connection failed: ' + error.message);
    }
}

/**
 * Test API connection for a specific service
 */
async function testApiConnection(service) {
    if (service === 'gemini') {
        return testGeminiApi();
    }
    throw new Error('Unknown service');
}

/**
 * Convert image URL or file to base64
 */
async function imageToBase64(imageSource) {
    // If it's already a data URL, extract the base64 part
    if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
        return imageSource.split(',')[1];
    }

    // If it's a URL, fetch and convert
    if (typeof imageSource === 'string') {
        const response = await fetch(imageSource);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // If it's a File/Blob
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageSource);
    });
}

/**
 * Get MIME type from image source
 */
function getMimeType(imageSource) {
    if (typeof imageSource === 'string') {
        if (imageSource.includes('.webp') || imageSource.includes('image/webp')) return 'image/webp';
        if (imageSource.includes('.png') || imageSource.includes('image/png')) return 'image/png';
        if (imageSource.includes('.gif') || imageSource.includes('image/gif')) return 'image/gif';
        return 'image/jpeg';
    }
    return imageSource.type || 'image/jpeg';
}

/**
 * Generate image with Gemini using an input image + prompt
 * Uses gemini-2.0-flash-exp-image-generation for image editing/transformation
 */
async function generateImageWithGemini(prompt, inputImageSource = null) {
    const key = API_CONFIG.gemini.key;
    if (!key) {
        throw new Error('Gemini API key not configured. Please add it in Settings.');
    }

    const model = API_CONFIG.gemini.imageModel;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    // Build the request parts
    const parts = [];

    // If there's an input image, add it first
    if (inputImageSource) {
        const base64Data = await imageToBase64(inputImageSource);
        const mimeType = getMimeType(inputImageSource);
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }

    // Add the text prompt
    parts.push({ text: prompt });

    const requestBody = {
        contents: [{
            parts: parts
        }],
        generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Image generation failed');
    }

    const data = await response.json();

    // Extract the generated image from the response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
        throw new Error('No image generated');
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
        throw new Error('Invalid response format');
    }

    // Find the image part in the response
    for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${part.inlineData.data}`;
        }
    }

    throw new Error('No image in response');
}

/**
 * Generate text using Gemini
 */
async function generateTextWithGemini(prompt) {
    const key = API_CONFIG.gemini.key;
    if (!key) {
        throw new Error('Gemini API key not configured. Please add it in Settings.');
    }

    const model = API_CONFIG.gemini.textModel;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Text generation failed');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

/**
 * Try prompt with the appropriate API based on lab type
 * For image labs with requiresImageInput, sends the before image + prompt
 */
async function tryPromptWithApi(prompt, labType, inputImageSource = null) {
    if (!isApiConfigured('gemini')) {
        throw new Error('Gemini API key required. Please configure it in Settings.');
    }

    if (labType === 'image') {
        const imageUrl = await generateImageWithGemini(prompt, inputImageSource);
        return {
            type: 'image',
            result: imageUrl,
            service: 'Gemini'
        };
    } else {
        const text = await generateTextWithGemini(prompt);
        return {
            type: 'text',
            result: text,
            service: 'Gemini'
        };
    }
}

/**
 * Load document content from path
 */
async function loadDocument(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Document not found');
        return await response.text();
    } catch (error) {
        console.error('Error loading document:', error);
        return null;
    }
}

/**
 * Load and parse CSV data
 */
async function loadCSVData(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('CSV not found');
        const text = await response.text();

        // Parse CSV to array of objects
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i]?.trim() || '';
            });
            return obj;
        });

        return { raw: text, parsed: data, headers };
    } catch (error) {
        console.error('Error loading CSV:', error);
        return null;
    }
}

/**
 * Generate text with document context
 */
async function generateTextWithContext(prompt, documentContent) {
    const key = API_CONFIG.gemini.key;
    if (!key) {
        throw new Error('Gemini API key not configured. Please add it in Settings.');
    }

    const model = API_CONFIG.gemini.textModel;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    // Combine document context with user prompt
    const fullPrompt = documentContent
        ? `Here is the document/data to analyze:\n\n${documentContent}\n\n---\n\nUser's instruction:\n${prompt}`
        : prompt;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            generationConfig: {
                maxOutputTokens: 2000,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Text generation failed');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

/**
 * Evaluate a user's prompt using Gemini AI
 * Returns scores on 5 dimensions plus feedback
 * Max score: 50 points
 */
async function evaluatePromptWithAI(userPrompt, lab) {
    const key = API_CONFIG.gemini.key;
    if (!key) {
        throw new Error('Gemini API key not configured');
    }

    const model = API_CONFIG.gemini.textModel;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const evaluationPrompt = `You are evaluating a student's AI prompt for a training exercise. Be fair but rigorous.

TASK GIVEN TO STUDENT:
${lab.mission}

CONTEXT/SCENARIO:
${lab.scenario}

STUDENT'S PROMPT:
"""
${userPrompt}
"""

EXPERT REFERENCE PROMPT (for comparison, student doesn't need to match exactly):
"""
${lab.expertPrompt}
"""

Rate the student's prompt on these 5 criteria (0-10 each):

1. SPECIFICITY: How specific and detailed is the request?
   - 0-3: Vague, generic, could apply to anything
   - 4-6: Some specific details but missing key elements
   - 7-10: Highly specific, detailed, tailored to the task

2. COMPLETENESS: Does it address all aspects of the task?
   - 0-3: Major gaps, misses the point
   - 4-6: Covers basics but misses important elements
   - 7-10: Comprehensive, addresses all requirements

3. STRUCTURE: Is the prompt well-organized and clear?
   - 0-3: Rambling, confusing, hard to follow
   - 4-6: Understandable but could be clearer
   - 7-10: Logical flow, well-organized, easy to follow

4. ACTIONABILITY: Would an AI know exactly what to produce?
   - 0-3: Ambiguous, unclear expected output
   - 4-6: Mostly clear but some ambiguity
   - 7-10: Crystal clear, AI knows exactly what to do

5. OUTPUT_CONTROL: Does it specify format, length, style, or constraints?
   - 0-3: No constraints specified
   - 4-6: Some constraints but incomplete
   - 7-10: Well-defined format, length, and style requirements

Also provide:
- Two specific strengths of this prompt
- Two specific suggestions for improvement
- One sentence overall assessment

Respond ONLY with valid JSON (no markdown, no code blocks, just raw JSON):
{
  "specificity": <number 0-10>,
  "completeness": <number 0-10>,
  "structure": <number 0-10>,
  "actionability": <number 0-10>,
  "outputControl": <number 0-10>,
  "strengths": ["<specific strength>", "<specific strength>"],
  "improvements": ["<specific actionable suggestion>", "<specific actionable suggestion>"],
  "briefFeedback": "<One sentence assessment>"
}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: evaluationPrompt }] }],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.3  // Lower temperature for consistent scoring
                }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || 'AI evaluation failed');
        }

        const data = await response.json();
        let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            throw new Error('No response from AI');
        }

        // Clean up response - remove markdown code blocks if present
        resultText = resultText.trim();
        if (resultText.startsWith('```json')) {
            resultText = resultText.slice(7);
        }
        if (resultText.startsWith('```')) {
            resultText = resultText.slice(3);
        }
        if (resultText.endsWith('```')) {
            resultText = resultText.slice(0, -3);
        }
        resultText = resultText.trim();

        const evaluation = JSON.parse(resultText);

        // Calculate total AI score (sum of 5 dimensions, max 50)
        const aiScore = (
            (evaluation.specificity || 0) +
            (evaluation.completeness || 0) +
            (evaluation.structure || 0) +
            (evaluation.actionability || 0) +
            (evaluation.outputControl || 0)
        );

        return {
            scores: {
                specificity: evaluation.specificity || 0,
                completeness: evaluation.completeness || 0,
                structure: evaluation.structure || 0,
                actionability: evaluation.actionability || 0,
                outputControl: evaluation.outputControl || 0
            },
            totalScore: aiScore,
            strengths: evaluation.strengths || ['Good effort', 'Completed the task'],
            improvements: evaluation.improvements || ['Add more detail', 'Specify output format'],
            briefFeedback: evaluation.briefFeedback || 'Keep practicing!'
        };

    } catch (error) {
        console.error('AI evaluation error:', error);
        // Return fallback scores if AI fails
        return {
            scores: {
                specificity: 5,
                completeness: 5,
                structure: 5,
                actionability: 5,
                outputControl: 5
            },
            totalScore: 25,
            strengths: ['Prompt submitted successfully', 'Attempted the challenge'],
            improvements: ['AI evaluation unavailable', 'Try adding more specific details'],
            briefFeedback: 'Score estimated - AI evaluation was unavailable.',
            error: true
        };
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeApiConfig);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        STORAGE_KEYS,
        initializeApiConfig,
        saveApiKey,
        getApiKey,
        isApiConfigured,
        getApiStatuses,
        testApiConnection,
        generateImageWithGemini,
        generateTextWithGemini,
        generateTextWithContext,
        loadDocument,
        loadCSVData,
        tryPromptWithApi,
        imageToBase64,
        evaluatePromptWithAI
    };
}
