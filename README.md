# AI Prompt Lab

**Stop Overthinking. Start Prompting.**

An interactive training website that teaches AI prompting through hands-on, timed challenges. Built for [KTE Analytics](https://kteanalytics.com/workshops-training/).

![AI Prompt Lab](https://img.shields.io/badge/AI-Prompt%20Lab-blue) ![Static Site](https://img.shields.io/badge/Vanilla-HTML%2FCSS%2FJS-green) ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-orange)

## What Is This?

AI Prompt Lab is a gamified learning platform where users:

1. **Read a business challenge** - Real-world scenarios where AI can help
2. **Write their own prompt** - Race against a countdown timer
3. **Compare to expert examples** - See what makes prompts effective
4. **Get scored** - Earn points for keyword matches, length, and speed
5. **Try with real APIs** - Test prompts with Fal.ai, OpenAI, or Gemini

## Features

- **3 Learning Tracks**: Image Generation, Text & Content, Automation
- **6 Hands-on Labs**: Progressive difficulty from Easy to Hard
- **Timed Challenges**: 90-150 seconds per lab
- **Scoring System**: Points for keywords, length, and completion
- **Progress Tracking**: Saved locally in your browser
- **API Integration**: Test prompts with real AI services
- **No Build Tools**: Pure HTML, CSS, and JavaScript

## Deploy to GitHub Pages

1. **Fork or clone this repository**

2. **Go to your repository Settings**

3. **Navigate to Pages**
   - Settings → Pages

4. **Configure deployment**
   - Source: Deploy from a branch
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)`

5. **Save and wait**
   - GitHub will build and deploy automatically
   - Your site will be live at: `https://yourusername.github.io/repository-name/`

That's it! No build step, no npm install, no configuration needed.

## Local Development

Just open `index.html` in your browser. No server required for basic functionality.

For API features, you may need a local server due to CORS:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have npx)
npx serve

# Then open http://localhost:8000
```

## Adding API Keys

1. Click the ⚙️ Settings icon
2. Enter your API keys:
   - **Fal.ai**: For image generation labs
   - **OpenAI**: For text generation labs
   - **Gemini**: Alternative for text generation

Keys are stored in your browser's localStorage and never sent to any server.

### Get API Keys

- [Fal.ai API Keys](https://fal.ai/dashboard/keys)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Google AI Studio (Gemini)](https://aistudio.google.com/app/apikey)

## Customizing Labs

Edit `js/labs.js` to modify or add labs:

```javascript
const LABS = {
    1: {
        id: 1,
        title: "Your Lab Title",
        type: "image", // or "text" or "automation"
        difficulty: "easy", // or "medium" or "hard"
        timeLimit: 90, // seconds
        track: "image",
        scenario: "Describe the business situation...",
        mission: "What the user needs to accomplish...",
        hasImages: true,
        sampleInput: null, // or text for text labs
        expertPrompt: "The ideal prompt...",
        keywords: ["keyword1", "keyword2"], // for scoring
        hint: "Optional hint for users",
        takeaways: [
            "Learning point 1",
            "Learning point 2"
        ]
    },
    // Add more labs...
};
```

## Adding Custom Images

Replace placeholder images with your own:

1. Add images to the `/images` folder
2. Update image paths in `js/labs.js`:

```javascript
beforeImage: "images/your-before.jpg",
afterImage: "images/your-after.jpg",
```

## File Structure

```
/
├── index.html          # Landing page with track selection
├── lab.html            # Lab interface (briefing → active → results)
├── settings.html       # API key configuration
├── css/
│   └── styles.css      # All styles (dark theme, glassmorphism)
├── js/
│   ├── app.js          # Main application logic
│   ├── api.js          # API configuration and calls
│   └── labs.js         # Lab content definitions
├── images/             # Custom before/after images
└── README.md           # This file
```

## Scoring System

- **Base Score**: 50 points for submitting
- **Keyword Matches**: 5 points each (max 30)
- **Length Bonus**: +10 at 100 chars, +10 at 200 chars
- **Hint Penalty**: -10 points if used

Maximum possible score: 100 points per lab

## Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## License

MIT License - Feel free to use and modify for your own training programs.

## Credits

Built for [KTE Analytics](https://kteanalytics.com/workshops-training/) workshops and training programs.

---

**Questions?** Visit [kteanalytics.com](https://kteanalytics.com/workshops-training/) for more information about AI training workshops.
