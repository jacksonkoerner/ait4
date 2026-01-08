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
        imageToBase64
    };
}
