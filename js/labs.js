/**
 * AI Prompt Lab - Lab Definitions
 * Each lab contains all the content needed for the challenge
 */

const LABS = {
    // ==================== MARKETING & MEDIA TRACK ====================
    1: {
        id: 1,
        title: "Product Photo Enhancement",
        type: "image",
        difficulty: "medium",
        timeLimit: 90,
        track: "marketing",
        scenario: "Your HVAC company needs professional van photos for the website and business cards. Hiring a professional photography crew costs hundreds of dollars and takes time to schedule. But with AI image generation, you can transform a simple iPhone photo into a professional product shot in seconds.",
        mission: "Write a prompt that will transform the 'before' image into something that looks like the 'after' image - a clean, professional product shot with a white background.",
        whyItMatters: "Instead of hiring a professional crew to photograph your vehicles, you can use AI to transform basic phone photos into polished, website-ready images. This saves time and money while still getting professional results.",
        beforeImage: "images/before-van.webp",
        afterImage: "images/after-van.webp",
        hasImages: true,
        requiresImageInput: true,
        sampleInput: null,
        expertPrompt: "Transform this HVAC service van photo into a professional product shot. Place the van on a clean white background with soft studio lighting. Remove all background elements including the parking lot, other vehicles, and buildings. Make it look like a commercial vehicle photography session for a company website or business card.",
        keywords: ["white background", "professional", "studio", "lighting", "remove background", "clean", "product shot", "commercial"],
        hint: "Think about what makes the 'after' image look professional: the clean white background, the removal of all distractions, and the studio-style lighting.",
        takeaways: [
            "Specify the exact background you want (white, gradient, etc.)",
            "Explicitly ask to remove unwanted elements (parking lot, other cars, buildings)",
            "Reference the end use case (website, business card) for context"
        ]
    },

    2: {
        id: 2,
        title: "Social Media Infographic",
        type: "image",
        difficulty: "hard",
        timeLimit: 120,
        track: "marketing",
        scenario: "Now that you have a professional van photo, you need to turn it into an eye-catching social media promotional graphic. Summer is coming and you want to advertise your AC repair special. You need to create a vibrant, attention-grabbing infographic that features your van and promotes your summer discount.",
        mission: "Write a prompt that transforms your professional van image into a summer promotional infographic like the target example - complete with beach theme, promotional text, and eye-catching design.",
        whyItMatters: "Social media marketing requires scroll-stopping visuals. Instead of hiring a graphic designer for every promotion, you can use AI to transform your existing product photos into seasonal promotional graphics. This lets you quickly create timely, professional marketing materials.",
        beforeImage: "images/after-van.webp",
        afterImage: "images/Infographic.webp",
        hasImages: true,
        requiresImageInput: true,
        sampleInput: null,
        expertPrompt: "Transform this HVAC service van into a vibrant summer promotional infographic. Create a beach-themed background with palm trees, sun, ocean, and beach elements like beach balls and flip flops. Add a friendly cartoon technician character next to the van waving at the viewer. Include bold promotional text at the top: 'SUMMER AC REPAIR SPECIAL!' with a banner showing '15% DISCOUNT ON ANY AC REPAIR ALL SUMMER LONG!' Add contact information at the bottom with a tagline. Style should be colorful, fun, and eye-catching for social media. Keep the van as the central focus but integrate it into the summer beach scene.",
        keywords: ["summer", "promotional", "beach", "discount", "infographic", "social media", "colorful", "banner", "text", "theme", "vibrant", "eye-catching"],
        hint: "Think about what makes the target image effective: the seasonal theme, bright colors, clear promotional message, and how the van is integrated into a fun scene rather than just shown alone.",
        takeaways: [
            "Describe the theme and mood you want (summer, beach, fun)",
            "Specify text content and promotional messaging clearly",
            "Include elements that create visual interest (characters, decorative elements)",
            "Reference the central subject and how it should be integrated into the design"
        ]
    },

    // ==================== TEXT & CONTENT TRACK ====================
    3: {
        id: 3,
        title: "Document Summarization",
        type: "text",
        difficulty: "easy",
        timeLimit: 90,
        track: "text",
        scenario: "Your company just received a new HVAC service agreement contract from a vendor. Before signing, you need to quickly understand the key terms, pricing, and any potential concerns. Reading the full 2-page document would take 10+ minutes, but AI can summarize it in seconds.",
        mission: "Write a prompt that will summarize this service agreement, highlighting the most important terms a business owner needs to know before signing.",
        hasImages: false,
        requiresImageInput: false,
        hasDocument: true,
        documentPath: "docs/hvac-service-agreement.docx",
        documentType: "contract",
        sampleInput: null,
        expertPrompt: `Summarize this HVAC service agreement for a business owner who needs to decide whether to sign. Include:

1. **Cost Overview**: Annual fee and what's included for that price
2. **Key Benefits**: The most valuable services and discounts provided
3. **Important Limitations**: What's NOT covered that might surprise me
4. **Red Flags**: Any terms that seem unfavorable or unusual (auto-renewal, liability limits, fees)
5. **Cancellation Terms**: How and when can I get out of this contract?

Keep the summary under 250 words. Use bullet points for easy scanning. Highlight any dollar amounts, percentages, or deadlines.`,
        keywords: ["summarize", "summary", "key terms", "cost", "price", "included", "limitations", "exclusions", "covered", "not covered", "renewal", "auto-renew", "cancel", "warranty", "bullet", "highlight", "red flag", "concerns"],
        hint: "Good summarization prompts specify: (1) what sections to focus on, (2) what format to use, and (3) what the reader cares most about (as a business owner, you care about cost, risk, and flexibility).",
        takeaways: [
            "Always specify the OUTPUT FORMAT you want (bullets, sections, word limit)",
            "Tell AI what ROLE the reader has - it changes what's considered 'important'",
            "Ask for potential concerns or red flags - AI can spot unfavorable terms",
            "You can summarize ANY document: contracts, reports, emails, manuals, articles"
        ]
    },

    4: {
        id: 4,
        title: "Contextual Email Response",
        type: "text",
        difficulty: "medium",
        timeLimit: 120,
        track: "text",
        scenario: "A frustrated client has sent an escalating series of emails about a project delay. The delay wasn't entirely your fault (a vendor double-booked equipment), but it has significantly impacted their business. They're angry, calculating their losses, and the relationship is at risk. You need to craft a response that de-escalates, takes appropriate responsibility, and provides a path forward.",
        mission: "Write a prompt that generates a professional response to this difficult client situation. Your prompt should provide the AI with context and guide it to produce an appropriate, relationship-saving response.",
        hasImages: false,
        requiresImageInput: false,
        hasDocument: true,
        documentPath: "docs/email-thread.txt",
        documentType: "email",
        sampleInput: null,
        expertPrompt: `I need to respond to an upset client about a project delay. Here is the email thread:

[EMAIL THREAD - see above]

Write a professional response to Mike's latest email that:

1. **Opens with empathy**: Acknowledge the real business impact ($4,000+ in costs, 47 idle employees) without being defensive
2. **Takes ownership**: Accept responsibility for the communication failure - don't blame the crane company to the client
3. **Provides concrete solutions**:
   - Offer 2-3 specific dates with GUARANTEED availability (I've confirmed equipment)
   - Include a backup plan if the primary date doesn't work
4. **Offers meaningful compensation**: Suggest a specific gesture (X% discount, extended warranty, priority scheduling for future work)
5. **Preserves the relationship**: End with a commitment to making this right and earning back trust

Tone: Professional, accountable, solution-focused. Confident but not dismissive of their concerns.
Length: 150-200 words maximum
Avoid: Clichés like "I understand your frustration" - show understanding through actions, not words. Don't over-apologize or grovel.`,
        keywords: ["context", "email", "thread", "acknowledge", "empathy", "impact", "solution", "concrete", "specific", "compensation", "discount", "relationship", "tone", "professional", "ownership", "responsibility", "guarantee", "avoid"],
        hint: "The best prompts for difficult communications: (1) provide the FULL context (the whole email thread), (2) specify the tone precisely, (3) tell AI what to AVOID, not just what to include, (4) give specific constraints like word count.",
        takeaways: [
            "Always include the FULL CONTEXT - AI responses improve dramatically with background",
            "Specify TONE precisely: 'professional but warm' vs 'formal' vs 'apologetic'",
            "Tell AI what to AVOID - clichés, defensiveness, over-apologizing",
            "For sensitive communications, specify LENGTH to control the level of detail"
        ]
    },

    // ==================== FINANCE & DATA TRACK ====================
    5: {
        id: 5,
        title: "Generate a Business Quote",
        type: "text",
        difficulty: "easy",
        timeLimit: 90,
        track: "finance",
        scenario: "A potential client has requested a quote for a major HVAC replacement project at their medical facility. You have all the details scribbled in notes - equipment costs, labor estimates, special requirements. Now you need to transform these rough details into a professional, well-organized quote document that instills confidence.",
        mission: "Write a prompt that transforms project details into a professional business quote with clear line items, calculations, and terms.",
        hasImages: false,
        requiresImageInput: false,
        hasDocument: false,
        documentPath: null,
        documentType: null,
        sampleInput: `PROJECT QUOTE REQUEST DETAILS
=============================

CUSTOMER: Riverside Medical Center
CONTACT: Dr. Patricia Vance, COO
ADDRESS: 8900 Healthcare Parkway, Building C, Irving, TX 75063
PROJECT: Replace HVAC in Outpatient Surgery Wing (12,000 sq ft)

EQUIPMENT:
- 3x Carrier WeatherExpert 50XC rooftop units, 15-ton @ $18,500 each
- Healthcare-grade HEPA filtration upgrade @ $2,200 per unit
- 1x Carrier i-Vu building automation interface @ $4,500
- 6x Programmable zone thermostats @ $350 each

MATERIALS:
- Ductwork modifications: $8,500
- UV-C sanitization units (3x) @ $1,800 each

LABOR:
- Equipment removal: 16 hrs @ $95/hr
- Installation: 48 hrs @ $95/hr
- Ductwork: 24 hrs @ $85/hr
- Controls & commissioning: 8 hrs @ $110/hr
- Project management: 12 hrs @ $75/hr

OTHER COSTS:
- Crane rental (2 weekends): $3,200
- Permits: $1,850
- Disposal: $950

NOTES:
- Weekend-only work required (no patient disruption)
- Apply 15% weekend premium to labor
- 10-year parts warranty, 2-year labor included
- Payment: 40% deposit, 40% on delivery, 20% on completion`,
        expertPrompt: `Create a professional business quote document from these project details:

[PROJECT DETAILS - see above]

Format the quote with these sections:

**HEADER:**
- Generate a quote number (format: Q-2024-XXXX)
- Today's date and validity period (30 days)
- Customer name and contact information
- Project description (one line)

**EQUIPMENT & MATERIALS:** (table format)
| Item | Description | Qty | Unit Price | Total |
List all equipment and materials with subtotal

**LABOR:** (table format)
| Service Type | Hours | Rate | Total |
Calculate the 15% weekend premium and show it as a line item
Include subtotal

**ADDITIONAL COSTS:**
List permits, crane rental, disposal

**PROJECT SUMMARY:**
- Equipment & Materials Subtotal
- Labor Subtotal (with weekend premium)
- Additional Costs Subtotal
- GRAND TOTAL

**TERMS:**
- Payment schedule (40/40/20 structure from notes)
- Warranty coverage
- Timeline estimate
- Quote validity

**CLOSING:**
2-3 sentences emphasizing value: healthcare expertise, minimal disruption approach, quality equipment

Calculate all totals correctly. Format currency with $ and commas.`,
        keywords: ["quote", "professional", "format", "table", "itemized", "calculate", "total", "subtotal", "line item", "terms", "payment", "warranty", "header", "sections", "currency"],
        hint: "Professional quotes need: clear itemization in tables, accurate calculations (let AI do the math!), payment terms, and a brief value statement. Tell AI the exact structure you want.",
        takeaways: [
            "AI can do MATH - ask it to calculate totals, apply percentages, sum line items",
            "Specify exact STRUCTURE with section headers for organized output",
            "Use TABLE FORMAT for line items - just describe the columns you want",
            "Include a value proposition - AI can help you sell, not just calculate"
        ]
    },

    6: {
        id: 6,
        title: "Data Analysis & Visualization",
        type: "data",
        difficulty: "medium",
        timeLimit: 150,
        track: "finance",
        scenario: "Your company has a full year of regional sales data. The CEO wants insights for tomorrow's board meeting: Which regions are performing best? Are there seasonal patterns? Where should we focus next year? You need to analyze this spreadsheet and provide actionable insights.",
        mission: "Write a prompt that analyzes this sales data and provides executive-level insights with specific recommendations.",
        hasImages: false,
        requiresImageInput: false,
        hasDocument: true,
        documentPath: "docs/regional-sales-data.xlsx",
        documentType: "spreadsheet",
        sampleInput: null,
        expertPrompt: `Analyze this regional sales data and provide insights for an executive board presentation.

[DATA WILL BE PROVIDED FROM SPREADSHEET]

Structure your analysis as follows:

**1. PERFORMANCE RANKING**
- Rank all regions by total annual revenue (highest to lowest)
- Show each region's percentage of total company revenue
- Identify the gap between top and bottom performers

**2. SEASONAL ANALYSIS**
- Identify peak months and slow months
- Calculate the seasonality ratio (peak month revenue ÷ lowest month revenue)
- Note any regions that buck the seasonal trend

**3. KEY INSIGHTS** (3-5 bullets)
What's the most important story in this data?
- Biggest opportunity
- Biggest concern
- Most surprising finding

**4. VISUALIZATION RECOMMENDATIONS**
For the board presentation, recommend:
- Best chart type for showing regional comparison (and why)
- Best chart type for showing seasonal trends (and why)

**5. STRATEGIC RECOMMENDATIONS** (2-3 specific actions)
Based on this data, what should leadership prioritize?
- Short-term (next quarter)
- Long-term (next year)

Format all currency as USD with commas. Calculate percentages to one decimal place. Be specific with numbers - executives want data, not vague statements.`,
        keywords: ["analyze", "analysis", "insight", "trend", "pattern", "seasonal", "growth", "percentage", "compare", "comparison", "rank", "visualize", "chart", "recommend", "recommendation", "strategic", "actionable", "executive"],
        hint: "Great data analysis prompts: (1) ask for specific calculations, (2) request insights AND the data behind them, (3) ask for visualization recommendations, (4) request actionable next steps. Executives want numbers AND meaning.",
        takeaways: [
            "AI can ANALYZE data - ask for trends, patterns, rankings, and anomalies",
            "Always ask for INSIGHTS, not just calculations - 'what does this mean?'",
            "Request VISUALIZATION recommendations - AI knows which charts work best",
            "Ask for ACTIONABLE recommendations - turn data into decisions"
        ]
    }
};

// Track definitions for the landing page
// Order by difficulty: text (easy) -> finance (medium) -> marketing (hard)
const TRACKS = {
    text: {
        id: "text",
        name: "Text & Content",
        description: "Master prompts for summarizing documents and crafting professional communications",
        icon: "📝",
        difficulty: "easy",
        color: "text",
        labs: [3, 4]
    },
    finance: {
        id: "finance",
        name: "Finance & Data",
        description: "Use AI to generate business documents and analyze spreadsheet data",
        icon: "📊",
        difficulty: "medium",
        color: "automation",
        labs: [5, 6]
    },
    marketing: {
        id: "marketing",
        name: "Marketing & Media",
        description: "Learn to craft prompts that transform and create professional visuals using AI",
        icon: "🎨",
        difficulty: "hard",
        color: "image",
        labs: [1, 2]
    }
};

// Helper functions for working with labs
function getLabById(id) {
    return LABS[id] || null;
}

function getLabsByTrack(trackId) {
    const track = TRACKS[trackId];
    if (!track) return [];
    return track.labs.map(id => LABS[id]);
}

function getNextLab(currentLabId) {
    const currentLab = LABS[currentLabId];
    if (!currentLab) return null;

    // Get the track for this lab
    const track = TRACKS[currentLab.track];
    if (!track) return null;

    // Find current position in track
    const trackIndex = track.labs.indexOf(currentLabId);

    // If there's a next lab in this track, return it
    if (trackIndex !== -1 && trackIndex < track.labs.length - 1) {
        return LABS[track.labs[trackIndex + 1]];
    }

    // Otherwise, move to the next track
    const trackOrder = ['text', 'finance', 'marketing'];
    const currentTrackIndex = trackOrder.indexOf(currentLab.track);

    if (currentTrackIndex !== -1 && currentTrackIndex < trackOrder.length - 1) {
        const nextTrack = TRACKS[trackOrder[currentTrackIndex + 1]];
        if (nextTrack && nextTrack.labs.length > 0) {
            return LABS[nextTrack.labs[0]];
        }
    }

    return null;
}

function getPreviousLab(currentLabId) {
    const currentLab = LABS[currentLabId];
    if (!currentLab) return null;

    // Get the track for this lab
    const track = TRACKS[currentLab.track];
    if (!track) return null;

    // Find current position in track
    const trackIndex = track.labs.indexOf(currentLabId);

    // If there's a previous lab in this track, return it
    if (trackIndex > 0) {
        return LABS[track.labs[trackIndex - 1]];
    }

    // Otherwise, go to the last lab of the previous track
    const trackOrder = ['text', 'finance', 'marketing'];
    const currentTrackIndex = trackOrder.indexOf(currentLab.track);

    if (currentTrackIndex > 0) {
        const prevTrack = TRACKS[trackOrder[currentTrackIndex - 1]];
        if (prevTrack && prevTrack.labs.length > 0) {
            return LABS[prevTrack.labs[prevTrack.labs.length - 1]];
        }
    }

    return null;
}

function getAllLabs() {
    return Object.values(LABS);
}

function getLabCount() {
    return Object.keys(LABS).length;
}

function getTrackLabCount(trackId) {
    const track = TRACKS[trackId];
    return track ? track.labs.length : 0;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LABS, TRACKS, getLabById, getLabsByTrack, getNextLab, getPreviousLab, getAllLabs, getLabCount, getTrackLabCount };
}
