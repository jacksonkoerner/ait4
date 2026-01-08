/**
 * AI Prompt Lab - Main Application Logic
 * Handles lab interface, timer, scoring, and user progress
 */

// ==================== Constants ====================
const PROGRESS_KEY = 'aipromptlab_progress';
const SETUP_COMPLETE_KEY = 'aipromptlab_setup_complete';

// ==================== State ====================
let currentLab = null;
let currentPhase = 'briefing'; // briefing, active, results
let timerInterval = null;
let timeRemaining = 0;
let hintUsed = false;
let startTime = null;
let userGeneratedImage = null;
let currentDocument = null;
let currentDocumentData = null;
let isDocumentExpanded = false;

// ==================== Document Viewer ====================

/**
 * Load and display a document based on its type
 */
async function loadDocumentViewer(documentPath, documentType) {
    const viewerSection = document.getElementById('document-viewer-section');
    const contentEl = document.getElementById('document-viewer-content');
    const loadingEl = document.getElementById('document-loading');
    const iconEl = document.getElementById('document-icon');
    const titleEl = document.getElementById('document-title');
    const sheetTabs = document.getElementById('sheet-tabs');

    if (!viewerSection || !contentEl) return;

    // Show viewer section and loading state
    viewerSection.classList.remove('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (sheetTabs) sheetTabs.classList.add('hidden');

    // Set icon and title based on document type
    if (documentType === 'docx' || documentType === 'contract') {
        if (iconEl) iconEl.textContent = '📄';
        if (titleEl) titleEl.textContent = 'Contract Document to Review';
    } else if (documentType === 'xlsx' || documentType === 'spreadsheet') {
        if (iconEl) iconEl.textContent = '📊';
        if (titleEl) titleEl.textContent = 'Spreadsheet Data to Analyze';
    } else if (documentType === 'email') {
        if (iconEl) iconEl.textContent = '📧';
        if (titleEl) titleEl.textContent = 'Email Thread to Review';
    }

    try {
        const response = await fetch(documentPath);
        if (!response.ok) throw new Error('Document not found');

        if (documentPath.endsWith('.docx')) {
            const arrayBuffer = await response.arrayBuffer();
            await renderWordDocument(arrayBuffer, contentEl);
        } else if (documentPath.endsWith('.xlsx')) {
            const arrayBuffer = await response.arrayBuffer();
            await renderExcelDocument(arrayBuffer, contentEl, sheetTabs);
        } else if (documentPath.endsWith('.txt')) {
            await loadTextDocument(documentPath, contentEl);
        }

        if (loadingEl) loadingEl.classList.add('hidden');

    } catch (error) {
        console.error('Error loading document:', error);
        if (loadingEl) {
            loadingEl.innerHTML = `<span style="color: var(--danger);">Error loading document: ${error.message}</span>`;
        }
    }
}

/**
 * Render a Word document using mammoth.js
 */
async function renderWordDocument(arrayBuffer, containerEl) {
    try {
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });

        // Store raw text for prompt context
        const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        currentDocumentData = textResult.value;
        currentDocument = textResult.value;

        // Display HTML
        containerEl.innerHTML = result.value;

        // Log any conversion warnings
        if (result.messages.length > 0) {
            console.log('Mammoth conversion messages:', result.messages);
        }

    } catch (error) {
        throw new Error('Failed to parse Word document: ' + error.message);
    }
}

/**
 * Render an Excel document using SheetJS
 */
async function renderExcelDocument(arrayBuffer, containerEl, tabsEl) {
    try {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Store workbook data for prompt context
        currentDocumentData = workbookToText(workbook);
        currentDocument = currentDocumentData;

        // Create tabs for each sheet
        if (workbook.SheetNames.length > 1 && tabsEl) {
            tabsEl.classList.remove('hidden');
            tabsEl.innerHTML = workbook.SheetNames.map((name, index) =>
                `<button class="sheet-tab ${index === 0 ? 'active' : ''}"
                         onclick="switchSheet('${name}', this)">${name}</button>`
            ).join('');
        }

        // Store workbook reference for tab switching
        containerEl.dataset.workbook = 'stored';
        window._currentWorkbook = workbook;

        // Render first sheet
        renderSheet(workbook, workbook.SheetNames[0], containerEl);

    } catch (error) {
        throw new Error('Failed to parse Excel file: ' + error.message);
    }
}

/**
 * Render a specific sheet from the workbook
 */
function renderSheet(workbook, sheetName, containerEl) {
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (data.length === 0) {
        containerEl.innerHTML = '<p style="color: #666; text-align: center;">This sheet is empty</p>';
        return;
    }

    // Build HTML table
    let html = '<div class="spreadsheet-container"><table class="spreadsheet-table">';

    data.forEach((row, rowIndex) => {
        html += '<tr';
        // Check if this is a total row (contains "TOTAL" in first cell)
        if (row[0] && String(row[0]).toUpperCase().includes('TOTAL')) {
            html += ' class="total-row"';
        }
        html += '>';

        row.forEach((cell, colIndex) => {
            const tag = rowIndex === 0 ? 'th' : 'td';
            let cellClass = '';
            let cellValue = cell;

            // Format numbers and detect types
            if (typeof cell === 'number' && rowIndex > 0) {
                if (Math.abs(cell) >= 1000) {
                    // Likely currency
                    cellValue = '$' + cell.toLocaleString();
                    cellClass = 'currency';
                } else if (cell < 1 && cell > -1 && cell !== 0) {
                    // Likely percentage
                    cellValue = (cell * 100).toFixed(1) + '%';
                    cellClass = 'percent';
                } else {
                    cellClass = 'number';
                }
            }

            html += `<${tag}${cellClass ? ` class="${cellClass}"` : ''}>${cellValue}</${tag}>`;
        });

        html += '</tr>';
    });

    html += '</table></div>';
    containerEl.innerHTML = html;
}

/**
 * Switch to a different sheet tab
 */
function switchSheet(sheetName, tabElement) {
    const containerEl = document.getElementById('document-viewer-content');
    const workbook = window._currentWorkbook;

    if (!workbook) return;

    // Update active tab
    document.querySelectorAll('.sheet-tab').forEach(tab => tab.classList.remove('active'));
    tabElement.classList.add('active');

    // Render the selected sheet
    renderSheet(workbook, sheetName, containerEl);
}

/**
 * Convert workbook to plain text for AI context
 */
function workbookToText(workbook) {
    let text = '';

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        text += `=== Sheet: ${sheetName} ===\n`;
        text += XLSX.utils.sheet_to_csv(worksheet);
        text += '\n\n';
    });

    return text;
}

/**
 * Load and display a plain text file
 */
async function loadTextDocument(path, containerEl) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('File not found');

        const text = await response.text();
        currentDocumentData = text;
        currentDocument = text;

        // Display with preserved formatting
        containerEl.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.6;">${escapeHtml(text)}</pre>`;

    } catch (error) {
        throw new Error('Failed to load text file: ' + error.message);
    }
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toggle document viewer expand/collapse
 */
function toggleDocumentExpand() {
    const container = document.querySelector('.document-viewer-container');
    const btn = document.getElementById('expand-doc-btn');
    let overlay = document.querySelector('.document-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'document-overlay';
        overlay.onclick = toggleDocumentExpand;
        document.body.appendChild(overlay);
    }

    isDocumentExpanded = !isDocumentExpanded;

    if (isDocumentExpanded) {
        container.classList.add('expanded');
        overlay.classList.add('visible');
        btn.textContent = '✕ Close';
        document.body.style.overflow = 'hidden';
    } else {
        container.classList.remove('expanded');
        overlay.classList.remove('visible');
        btn.textContent = '⛶ Expand';
        document.body.style.overflow = '';
    }
}

/**
 * Get the current document content for AI prompt context
 */
function getDocumentContext() {
    return currentDocumentData || '';
}

// ==================== Progress Management ====================

/**
 * Get user progress from localStorage
 */
function getUserProgress() {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing progress:', e);
        }
    }
    return {
        completedLabs: [],
        scores: {},
        totalScore: 0
    };
}

/**
 * Save user progress to localStorage
 */
function saveUserProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/**
 * Update progress after completing a lab
 */
function updateProgress(labId, score, userPrompt) {
    const progress = getUserProgress();

    if (!progress.completedLabs.includes(labId)) {
        progress.completedLabs.push(labId);
    }

    progress.scores[labId] = {
        score: score,
        userPrompt: userPrompt,
        completedAt: new Date().toISOString()
    };

    // Recalculate total score
    progress.totalScore = Object.values(progress.scores)
        .reduce((sum, s) => sum + s.score, 0);

    saveUserProgress(progress);
    return progress;
}

/**
 * Get progress for a specific track
 */
function getTrackProgress(trackId) {
    const progress = getUserProgress();
    const track = TRACKS[trackId];
    if (!track) return { completed: 0, total: 0 };

    const completed = track.labs.filter(labId =>
        progress.completedLabs.includes(labId)
    ).length;

    return {
        completed,
        total: track.labs.length,
        percentage: Math.round((completed / track.labs.length) * 100)
    };
}

/**
 * Reset all progress
 */
function resetProgress() {
    localStorage.removeItem(PROGRESS_KEY);
}

// ==================== Scoring ====================

/**
 * Calculate score for a submission
 * Scoring breakdown:
 * - Base: 50 points (for completing)
 * - Quality: Up to 30 points (keyword matches)
 * - Time Bonus: Up to 20 points (efficiency reward)
 * - Hint Penalty: -10 points
 * Max possible: 100 points
 */
function calculateScore(userPrompt, lab) {
    let score = 50; // Base score for submitting
    const userLower = userPrompt.toLowerCase();

    // Keyword matches (5 pts each, max 30)
    const matches = lab.keywords.filter(kw => userLower.includes(kw.toLowerCase()));
    const keywordScore = Math.min(matches.length * 5, 30);
    score += keywordScore;

    // Time bonus - reward efficiency (up to 20 points)
    // Based on percentage of time remaining
    const timeUsed = getTimeElapsed();
    const totalTime = lab.timeLimit;
    const timeRemainingPercent = Math.max(0, (totalTime - timeUsed) / totalTime);
    const timeBonus = Math.round(timeRemainingPercent * 20);
    score += timeBonus;

    // Hint penalty
    if (hintUsed) {
        score = Math.max(score - 10, 50);
    }

    return {
        total: Math.min(score, 100),
        base: 50,
        keywords: keywordScore,
        keywordMatches: matches,
        timeBonus: timeBonus,
        timeUsed: timeUsed,
        hintPenalty: hintUsed ? -10 : 0
    };
}

// ==================== Timer ====================

/**
 * Start the countdown timer
 */
function startTimer() {
    if (!currentLab) return;

    timeRemaining = currentLab.timeLimit;
    startTime = Date.now();
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmit();
        }
    }, 1000);
}

/**
 * Stop the timer
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update styling based on time remaining
    timerEl.classList.remove('warning', 'danger');
    if (timeRemaining <= 15) {
        timerEl.classList.add('danger');
    } else if (timeRemaining <= 30) {
        timerEl.classList.add('warning');
    }
}

/**
 * Get time elapsed since start
 */
function getTimeElapsed() {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
}

// ==================== Phase Management ====================

/**
 * Set the current phase and update UI
 */
function setPhase(phase) {
    currentPhase = phase;

    // For phase dots, treat 'loading' as between active and results
    const displayPhase = phase === 'loading' ? 'results' : phase;

    // Update phase dots
    document.querySelectorAll('.phase-dot').forEach((dot, index) => {
        const phases = ['briefing', 'active', 'results'];
        const phaseIndex = phases.indexOf(displayPhase);

        dot.classList.remove('active', 'completed');
        if (index < phaseIndex) {
            dot.classList.add('completed');
        } else if (index === phaseIndex) {
            dot.classList.add('active');
            // Add loading animation to the results dot during loading phase
            if (phase === 'loading' && index === 2) {
                dot.classList.add('loading');
            }
        }
    });

    // Update phase lines
    document.querySelectorAll('.phase-line').forEach((line, index) => {
        const phases = ['briefing', 'active', 'results'];
        const phaseIndex = phases.indexOf(displayPhase);

        line.classList.toggle('completed', index < phaseIndex);
    });

    // Show/hide phase-specific content
    updatePhaseContent();
}

/**
 * Update visible content based on current phase
 */
function updatePhaseContent() {
    const briefingContent = document.getElementById('briefing-content');
    const activeContent = document.getElementById('active-content');
    const loadingContent = document.getElementById('loading-content');
    const resultsContent = document.getElementById('results-content');
    const beginBtn = document.getElementById('begin-btn');
    const submitBtn = document.getElementById('submit-btn');
    const hintBtn = document.getElementById('hint-btn');
    const promptArea = document.getElementById('user-prompt');

    if (!briefingContent) return;

    switch (currentPhase) {
        case 'briefing':
            briefingContent.classList.remove('hidden');
            activeContent?.classList.add('hidden');
            loadingContent?.classList.add('hidden');
            resultsContent?.classList.add('hidden');
            beginBtn?.classList.remove('hidden');
            submitBtn?.classList.add('hidden');
            hintBtn?.classList.add('hidden');
            if (promptArea) promptArea.disabled = true;
            break;

        case 'active':
            briefingContent.classList.remove('hidden');
            activeContent?.classList.remove('hidden');
            loadingContent?.classList.add('hidden');
            resultsContent?.classList.add('hidden');
            beginBtn?.classList.add('hidden');
            submitBtn?.classList.remove('hidden');
            hintBtn?.classList.remove('hidden');
            if (promptArea) {
                promptArea.disabled = false;
                promptArea.focus();
            }
            break;

        case 'loading':
            briefingContent.classList.add('hidden');
            activeContent?.classList.add('hidden');
            loadingContent?.classList.remove('hidden');
            resultsContent?.classList.add('hidden');
            beginBtn?.classList.add('hidden');
            submitBtn?.classList.add('hidden');
            hintBtn?.classList.add('hidden');
            if (promptArea) promptArea.disabled = true;
            // Reset the loading progress animation
            resetLoadingAnimation();
            break;

        case 'results':
            briefingContent.classList.add('hidden');
            activeContent?.classList.add('hidden');
            loadingContent?.classList.add('hidden');
            resultsContent?.classList.remove('hidden');
            beginBtn?.classList.add('hidden');
            submitBtn?.classList.add('hidden');
            hintBtn?.classList.add('hidden');
            if (promptArea) promptArea.disabled = true;
            break;
    }
}

/**
 * Reset the loading animation
 */
function resetLoadingAnimation() {
    const progressFill = document.querySelector('.loading-progress-fill');
    if (progressFill) {
        // Reset animation by removing and re-adding the element
        progressFill.style.animation = 'none';
        progressFill.offsetHeight; // Trigger reflow
        progressFill.style.animation = null;
    }
}

// ==================== Lab Actions ====================

/**
 * Begin the challenge (start timer, enable input)
 */
function beginChallenge() {
    if (!currentLab) return;

    hintUsed = false;
    setPhase('active');
    startTimer();

    // Hide hint box
    const hintBox = document.getElementById('hint-box');
    if (hintBox) hintBox.classList.remove('visible');
}

/**
 * Show hint (costs points)
 */
function showHint() {
    if (!currentLab) return;

    hintUsed = true;
    const hintBox = document.getElementById('hint-box');
    const hintText = document.getElementById('hint-text');

    if (hintBox && hintText) {
        hintText.textContent = currentLab.hint;
        hintBox.classList.add('visible');
    }

    // Disable hint button
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        hintBtn.disabled = true;
        hintBtn.textContent = 'Hint Used (-10 pts)';
    }
}

/**
 * Submit the user's prompt
 */
function submitPrompt() {
    const promptArea = document.getElementById('user-prompt');
    if (!promptArea || !currentLab) return;

    const userPrompt = promptArea.value.trim();

    if (!userPrompt) {
        showToast('Please enter a prompt before submitting.', 'warning');
        return;
    }

    processSubmission(userPrompt);
}

/**
 * Auto-submit when timer runs out
 */
function autoSubmit() {
    const promptArea = document.getElementById('user-prompt');
    if (!promptArea || !currentLab) return;

    const userPrompt = promptArea.value.trim() || '[No prompt submitted]';
    processSubmission(userPrompt);
}

/**
 * Process the submission and show results
 */
async function processSubmission(userPrompt) {
    stopTimer();

    // Calculate score
    const scoreData = calculateScore(userPrompt, currentLab);

    // Update progress
    updateProgress(currentLab.id, scoreData.total, userPrompt);

    // Show loading phase for all lab types when API is configured
    if (isApiConfigured('gemini')) {
        // Show loading phase
        setPhase('loading');

        // Set loading screen title and subtitle based on lab type
        const loadingTitle = document.getElementById('loading-title');
        const loadingSubtitle = document.getElementById('loading-subtitle');
        const loadingPromptText = document.getElementById('loading-prompt-text');

        if (loadingPromptText) loadingPromptText.textContent = userPrompt;

        if (currentLab.type === 'image' && currentLab.requiresImageInput) {
            if (loadingTitle) loadingTitle.textContent = 'Generating Your Image';
            if (loadingSubtitle) loadingSubtitle.textContent = 'AI is transforming your image based on your prompt...';

            // Generate the image
            await generateUserImage(userPrompt);
        } else {
            // Text/data labs
            if (loadingTitle) loadingTitle.textContent = 'Generating AI Outputs';
            if (loadingSubtitle) loadingSubtitle.textContent = 'Comparing your prompt against the expert prompt...';

            // Generate text outputs for comparison
            await generateTextOutputs(userPrompt);
        }

        // Now show results
        displayResults(userPrompt, scoreData);
        setPhase('results');
    } else {
        // No API configured - show results without generation
        displayResults(userPrompt, scoreData);
        setPhase('results');
    }
}

/**
 * Generate text outputs for both user and expert prompts
 */
async function generateTextOutputs(userPrompt) {
    const userOutputEl = document.getElementById('user-ai-output');
    const expertOutputEl = document.getElementById('expert-ai-output');
    const userLoadingEl = document.getElementById('user-output-loading');
    const expertLoadingEl = document.getElementById('expert-output-loading');

    // Reset loading states
    if (userLoadingEl) userLoadingEl.classList.remove('hidden');
    if (expertLoadingEl) expertLoadingEl.classList.remove('hidden');

    // Get context: use loaded document OR sampleInput from lab definition
    const context = currentDocument || currentLab.sampleInput || '';

    try {
        updateLoadingStatus('Generating output from your prompt...');

        // Generate with user's prompt + context (document or sample input)
        const userResult = await generateTextWithContext(userPrompt, context);

        // Update user output
        if (userOutputEl) {
            userOutputEl.innerHTML = formatTextOutput(userResult);
        }

        updateLoadingStatus('Generating output from expert prompt...');

        // Generate with expert's prompt + context
        const expertResult = await generateTextWithContext(currentLab.expertPrompt, context);

        // Update expert output
        if (expertOutputEl) {
            expertOutputEl.innerHTML = formatTextOutput(expertResult);
        }

        updateLoadingStatus('Complete!');

    } catch (error) {
        console.error('Error generating text outputs:', error);
        if (userOutputEl && userLoadingEl) {
            userOutputEl.innerHTML = `<div class="ai-output-error">Error: ${error.message}</div>`;
        }
        if (expertOutputEl && expertLoadingEl) {
            expertOutputEl.innerHTML = `<div class="ai-output-error">Error: ${error.message}</div>`;
        }
        updateLoadingStatus('Error occurred');
    }
}

/**
 * Display the results
 */
function displayResults(userPrompt, scoreData) {
    // Score
    const scoreValueEl = document.getElementById('score-value');
    if (scoreValueEl) scoreValueEl.textContent = scoreData.total;

    // Score breakdown
    const baseScoreEl = document.getElementById('base-score');
    const keywordScoreEl = document.getElementById('keyword-score');
    const timeBonusEl = document.getElementById('time-bonus');
    const hintPenaltyEl = document.getElementById('hint-penalty');

    if (baseScoreEl) baseScoreEl.textContent = '+' + scoreData.base;
    if (keywordScoreEl) keywordScoreEl.textContent = '+' + scoreData.keywords;
    if (timeBonusEl) timeBonusEl.textContent = '+' + scoreData.timeBonus;
    if (hintPenaltyEl) {
        hintPenaltyEl.textContent = scoreData.hintPenalty;
        hintPenaltyEl.parentElement.style.display = scoreData.hintPenalty ? 'block' : 'none';
    }

    // Show appropriate results section based on lab type
    const imageResultsSection = document.getElementById('image-results-section');
    const textResultsSection = document.getElementById('text-results-section');

    if (currentLab.type === 'image' && currentLab.requiresImageInput) {
        // Image transformation lab results
        imageResultsSection?.classList.remove('hidden');
        textResultsSection?.classList.add('hidden');

        // Set user prompt display
        const userPromptDisplay = document.getElementById('user-prompt-display');
        if (userPromptDisplay) userPromptDisplay.textContent = userPrompt;

        // Set expert prompt display
        const expertPromptDisplay = document.getElementById('expert-prompt-display');
        if (expertPromptDisplay) expertPromptDisplay.textContent = currentLab.expertPrompt;

        // Set the original (before) image for the first slider
        const beforeImage = currentLab.beforeImage;
        document.getElementById('user-slider-before')?.setAttribute('src', beforeImage);

        // Set the target (after) image for the second slider
        const afterImage = currentLab.afterImage;
        document.getElementById('compare-slider-after')?.setAttribute('src', afterImage);

        // Hide the compare slider placeholder since afterImage is a static file
        const comparePlaceholder = document.getElementById('compare-slider-placeholder');
        if (comparePlaceholder && afterImage) {
            comparePlaceholder.classList.add('hidden');
        }

        // Initialize sliders
        initializeImageSlider('user-slider');
        initializeImageSlider('compare-slider');

    } else {
        // Text lab results
        imageResultsSection?.classList.add('hidden');
        textResultsSection?.classList.remove('hidden');

        // User prompt
        const userPromptEl = document.getElementById('user-prompt-result');
        if (userPromptEl) userPromptEl.textContent = userPrompt;

        // Expert prompt
        const expertPromptEl = document.getElementById('expert-prompt');
        if (expertPromptEl) expertPromptEl.textContent = currentLab.expertPrompt;

        // Show/hide AI output comparison based on API configuration
        const aiOutputComparison = document.getElementById('ai-output-comparison');
        if (aiOutputComparison) {
            if (isApiConfigured('gemini')) {
                aiOutputComparison.classList.remove('hidden');
            } else {
                aiOutputComparison.classList.add('hidden');
            }
        }
    }

    // Takeaways
    const takeawaysList = document.getElementById('takeaways-list');
    if (takeawaysList && currentLab.takeaways) {
        takeawaysList.innerHTML = currentLab.takeaways
            .map(t => `<li>${t}</li>`)
            .join('');
    }
}

/**
 * Update the loading status message
 */
function updateLoadingStatus(message) {
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) loadingStatus.textContent = message;
}

/**
 * Generate image for user's prompt (image transformation labs)
 */
async function generateUserImage(userPrompt) {
    if (!currentLab || !currentLab.requiresImageInput) return;

    const beforeImageSrc = currentLab.beforeImage;

    // Show loading state in results section (for when results are shown)
    const userPlaceholder = document.getElementById('user-slider-placeholder');
    const comparePlaceholder = document.getElementById('compare-slider-placeholder');

    if (userPlaceholder) {
        userPlaceholder.innerHTML = '<span class="spinner"></span> Generating your image...';
        userPlaceholder.classList.remove('hidden');
    }

    try {
        // Update loading status
        updateLoadingStatus('Sending image to Gemini...');

        // Generate image using user's prompt + before image
        updateLoadingStatus('Transforming your image with AI...');
        const result = await tryPromptWithApi(userPrompt, 'image', beforeImageSrc);

        updateLoadingStatus('Processing result...');
        userGeneratedImage = result.result;

        // Update the first slider with user's generated image
        const userAfterImg = document.getElementById('user-slider-after');
        if (userAfterImg) {
            userAfterImg.src = userGeneratedImage;
            userAfterImg.onload = () => {
                userPlaceholder?.classList.add('hidden');
                initializeImageSlider('user-slider');
            };
        }

        // Update the second slider - user's result vs target
        const compareBeforeImg = document.getElementById('compare-slider-before');
        if (compareBeforeImg) {
            compareBeforeImg.src = userGeneratedImage;
            compareBeforeImg.onload = () => {
                comparePlaceholder?.classList.add('hidden');
                initializeImageSlider('compare-slider');
            };
        }

        updateLoadingStatus('Complete!');
        showToast('Image generated successfully!', 'success');

    } catch (error) {
        if (userPlaceholder) {
            userPlaceholder.innerHTML = `<span class="error">Error: ${error.message}</span>`;
        }
        updateLoadingStatus('Error occurred');
        showToast('Error generating image: ' + error.message, 'error');
    }
}

/**
 * Navigate to next lab
 */
function goToNextLab() {
    const nextLab = getNextLab(currentLab.id);
    if (nextLab) {
        window.location.href = `lab.html?id=${nextLab.id}`;
    } else {
        showToast('Congratulations! You\'ve completed all labs!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

/**
 * Format text output for display (convert markdown-like formatting)
 */
function formatTextOutput(text) {
    if (!text) return '';
    // Basic markdown-like formatting
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/\|(.+)\|/g, '<code>$1</code>');
}

// ==================== Image Slider ====================

/**
 * Initialize a before/after image slider
 */
function initializeImageSlider(sliderId) {
    const slider = document.getElementById(sliderId);
    const sliderInput = document.getElementById(`${sliderId}-input`);
    const afterImage = document.getElementById(`${sliderId}-after`);
    const handle = document.getElementById(`${sliderId}-handle`);

    if (!slider || !sliderInput) return;

    function updateSlider(value) {
        const percentage = value;
        if (afterImage) {
            afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
        }
        if (handle) {
            handle.style.left = `${percentage}%`;
        }
    }

    sliderInput.addEventListener('input', (e) => {
        updateSlider(e.target.value);
    });

    // Initialize at 50%
    updateSlider(50);
}

// ==================== UI Helpers ====================

/**
 * Update character count display
 */
function updateCharCount() {
    const promptArea = document.getElementById('user-prompt');
    const charCountEl = document.getElementById('char-count');

    if (promptArea && charCountEl) {
        charCountEl.textContent = `${promptArea.value.length} characters`;
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/**
 * Create toast container if it doesn't exist
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ==================== Document Loading ====================

/**
 * Load document content for document-based labs
 */
async function loadLabDocument(path, type) {
    const documentDisplay = document.getElementById('document-content');
    const documentBox = document.getElementById('document-box');

    if (!documentDisplay || !documentBox) return;

    try {
        if (type === 'spreadsheet') {
            const data = await loadCSVData(path);
            if (data) {
                currentDocument = data.raw;
                // Display as formatted table
                documentDisplay.innerHTML = formatCSVAsTable(data.parsed, data.headers);
                documentBox.classList.remove('hidden');
            }
        } else {
            const content = await loadDocument(path);
            if (content) {
                currentDocument = content;
                documentDisplay.textContent = content;
                documentBox.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading document:', error);
    }
}

/**
 * Format CSV data as an HTML table
 */
function formatCSVAsTable(data, headers) {
    let html = '<table class="data-table"><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    data.forEach(row => {
        html += '<tr>';
        headers.forEach(h => html += `<td>${row[h] || ''}</td>`);
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// ==================== Lab Loading ====================

/**
 * Load lab content from URL parameter
 */
function loadLab() {
    const urlParams = new URLSearchParams(window.location.search);
    const labId = parseInt(urlParams.get('id'));

    if (!labId) {
        window.location.href = 'index.html';
        return;
    }

    currentLab = getLabById(labId);

    if (!currentLab) {
        showToast('Lab not found', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    renderLabContent();
    setPhase('briefing');

    // Load associated document if this lab has one
    if (currentLab.hasDocument && currentLab.documentPath) {
        loadDocumentViewer(currentLab.documentPath, currentLab.documentType);
    } else {
        // Hide document viewer for non-document labs
        const viewerSection = document.getElementById('document-viewer-section');
        if (viewerSection) viewerSection.classList.add('hidden');
    }
}

/**
 * Render lab content to the page
 */
function renderLabContent() {
    if (!currentLab) return;

    // Title
    const titleEl = document.getElementById('lab-title');
    if (titleEl) titleEl.textContent = currentLab.title;

    // Badges
    const typeBadge = document.getElementById('type-badge');
    const timeBadge = document.getElementById('time-badge');

    if (typeBadge) {
        typeBadge.textContent = currentLab.type.charAt(0).toUpperCase() + currentLab.type.slice(1);
    }
    if (timeBadge) {
        timeBadge.textContent = `${currentLab.timeLimit}s`;
    }

    // Difficulty
    const diffBadge = document.getElementById('difficulty-badge');
    if (diffBadge) {
        diffBadge.textContent = currentLab.difficulty;
        diffBadge.className = `difficulty-badge ${currentLab.difficulty}`;
    }

    // Scenario
    const scenarioText = document.getElementById('scenario-text');
    if (scenarioText) scenarioText.textContent = currentLab.scenario;

    // Mission
    const missionText = document.getElementById('mission-text');
    if (missionText) missionText.textContent = currentLab.mission;

    // Handle image transformation labs (show before AND after)
    const imageTransformContainer = document.getElementById('image-transform-container');
    const whyItMattersBox = document.getElementById('why-it-matters-box');

    if (currentLab.type === 'image' && currentLab.requiresImageInput && currentLab.beforeImage && currentLab.afterImage) {
        // Show the before/after comparison in briefing
        imageTransformContainer?.classList.remove('hidden');

        // Load before image
        const beforeImg = document.getElementById('briefing-before-image');
        const beforePlaceholder = document.getElementById('briefing-before-placeholder');
        if (beforeImg) {
            beforeImg.src = currentLab.beforeImage;
            beforeImg.onload = () => {
                beforeImg.classList.remove('hidden');
                beforePlaceholder?.classList.add('hidden');
            };
            beforeImg.onerror = () => {
                beforeImg.classList.add('hidden');
                beforePlaceholder?.classList.remove('hidden');
            };
        }

        // Load after image
        const afterImg = document.getElementById('briefing-after-image');
        const afterPlaceholder = document.getElementById('briefing-after-placeholder');
        if (afterImg) {
            afterImg.src = currentLab.afterImage;
            afterImg.onload = () => {
                afterImg.classList.remove('hidden');
                afterPlaceholder?.classList.add('hidden');
            };
            afterImg.onerror = () => {
                afterImg.classList.add('hidden');
                afterPlaceholder?.classList.remove('hidden');
            };
        }

        // Show "Why It Matters"
        if (currentLab.whyItMatters && whyItMattersBox) {
            whyItMattersBox.classList.remove('hidden');
            const whyText = document.getElementById('why-it-matters-text');
            if (whyText) whyText.textContent = currentLab.whyItMatters;
        }
    } else {
        imageTransformContainer?.classList.add('hidden');
        whyItMattersBox?.classList.add('hidden');
    }

    // Sample input (for text labs)
    const sampleInputBox = document.getElementById('sample-input-box');
    const sampleInputText = document.getElementById('sample-input-text');

    if (currentLab.sampleInput && sampleInputBox && sampleInputText) {
        sampleInputText.textContent = currentLab.sampleInput;
        sampleInputBox.classList.remove('hidden');
    } else if (sampleInputBox) {
        sampleInputBox.classList.add('hidden');
    }

    // Timer display
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        const minutes = Math.floor(currentLab.timeLimit / 60);
        const seconds = currentLab.timeLimit % 60;
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Progress indicator
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        const labIds = Object.keys(LABS).map(Number).sort((a, b) => a - b);
        const currentIndex = labIds.indexOf(currentLab.id) + 1;
        progressText.textContent = `Lab ${currentIndex} of ${labIds.length}`;
    }

    // Update page title
    document.title = `${currentLab.title} | AI Prompt Lab`;
}

// ==================== Setup Check ====================

/**
 * Check if setup is complete
 */
function isSetupComplete() {
    const setupComplete = localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
    const hasApiKey = !!localStorage.getItem(STORAGE_KEYS.GEMINI_KEY);
    return setupComplete && hasApiKey;
}

/**
 * Navigate to lab with setup check
 * If setup is not complete, redirect to setup page first
 */
function navigateToLab(labId) {
    if (isSetupComplete()) {
        window.location.href = `lab.html?id=${labId}`;
    } else {
        window.location.href = 'setup.html';
    }
}

/**
 * Navigate to course/index with setup check
 */
function navigateToCourse() {
    if (isSetupComplete()) {
        window.location.href = 'index.html';
    } else {
        window.location.href = 'setup.html';
    }
}

// ==================== Landing Page ====================

/**
 * Initialize the landing page
 */
function initLandingPage() {
    const tracksGrid = document.getElementById('tracks-grid');
    if (!tracksGrid) return;

    // Render track cards
    Object.values(TRACKS).forEach(track => {
        const progress = getTrackProgress(track.id);
        const firstLabId = track.labs[0];

        const card = document.createElement('div');
        card.className = 'track-card';
        card.innerHTML = `
            <div class="track-header">
                <div class="track-icon ${track.color}">${track.icon}</div>
                <span class="difficulty-badge ${track.difficulty}">${track.difficulty}</span>
            </div>
            <h3 class="track-title">${track.name}</h3>
            <p class="track-description">${track.description}</p>
            <div class="track-meta">
                <span>📚 ${track.labs.length} Labs</span>
                <span>⏱️ ${getTrackTotalTime(track.id)} min</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <div class="progress-text">${progress.completed}/${progress.total} completed</div>
            </div>
            <button class="track-btn" onclick="navigateToLab(${firstLabId})">
                ${progress.completed > 0 ? 'Continue' : 'Start'} Track →
            </button>
        `;

        tracksGrid.appendChild(card);
    });

    // Update total stats
    const totalScore = document.getElementById('total-score');
    const totalCompleted = document.getElementById('total-completed');

    if (totalScore) {
        const progress = getUserProgress();
        totalScore.textContent = progress.totalScore;
    }

    if (totalCompleted) {
        const progress = getUserProgress();
        totalCompleted.textContent = `${progress.completedLabs.length}/${getLabCount()}`;
    }
}

/**
 * Get total time for a track in minutes
 */
function getTrackTotalTime(trackId) {
    const track = TRACKS[trackId];
    if (!track) return 0;

    const totalSeconds = track.labs.reduce((sum, labId) => {
        const lab = LABS[labId];
        return sum + (lab ? lab.timeLimit : 0);
    }, 0);

    return Math.ceil(totalSeconds / 60);
}

// ==================== Settings Page ====================

/**
 * Initialize the settings page
 */
function initSettingsPage() {
    // Load existing keys
    initializeApiConfig();

    // Update form values and statuses for Gemini
    const input = document.getElementById('gemini-key');
    const status = document.getElementById('gemini-status');
    const dot = status?.querySelector('.status-dot');
    const text = status?.querySelector('.status-text');

    if (input) {
        input.value = API_CONFIG.gemini.key;
    }

    if (dot && text) {
        const configured = isApiConfigured('gemini');
        dot.className = `status-dot ${configured ? 'configured' : 'not-configured'}`;
        text.textContent = configured ? 'Configured' : 'Not configured';
    }
}

/**
 * Save API key from settings form
 */
function handleSaveApiKey(service) {
    const input = document.getElementById(`${service}-key`);
    if (!input) return;

    const key = input.value.trim();
    saveApiKey(service, key);

    // Update status
    const status = document.getElementById(`${service}-status`);
    const dot = status?.querySelector('.status-dot');
    const text = status?.querySelector('.status-text');

    if (dot && text) {
        const configured = !!key;
        dot.className = `status-dot ${configured ? 'configured' : 'not-configured'}`;
        text.textContent = configured ? 'Configured' : 'Not configured';
    }

    showToast(key ? 'API key saved!' : 'API key removed', 'success');
}

/**
 * Test API connection from settings
 */
async function handleTestApi(service) {
    const testBtn = document.getElementById(`${service}-test`);
    if (!testBtn) return;

    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner"></span>';

    try {
        const result = await testApiConnection(service);
        showToast(`${API_CONFIG[service].name}: ${result.message}`, 'success');
    } catch (error) {
        showToast(`${API_CONFIG[service].name}: ${error.message}`, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Test';
    }
}

// ==================== Event Listeners ====================

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we're on
    const path = window.location.pathname;

    if (path.includes('lab.html')) {
        loadLab();

        // Set up event listeners for lab page
        const beginBtn = document.getElementById('begin-btn');
        const submitBtn = document.getElementById('submit-btn');
        const hintBtn = document.getElementById('hint-btn');
        const promptArea = document.getElementById('user-prompt');
        const nextBtn = document.getElementById('next-btn');

        if (beginBtn) beginBtn.addEventListener('click', beginChallenge);
        if (submitBtn) submitBtn.addEventListener('click', submitPrompt);
        if (hintBtn) hintBtn.addEventListener('click', showHint);
        if (promptArea) promptArea.addEventListener('input', updateCharCount);
        if (nextBtn) nextBtn.addEventListener('click', goToNextLab);

    } else if (path.includes('settings.html')) {
        initSettingsPage();

    } else {
        // Course dashboard (index.html)
        initLandingPage();
    }
});

// Make functions available globally for onclick handlers
window.beginChallenge = beginChallenge;
window.submitPrompt = submitPrompt;
window.showHint = showHint;
window.goToNextLab = goToNextLab;
window.handleSaveApiKey = handleSaveApiKey;
window.handleTestApi = handleTestApi;
window.toggleDocumentExpand = toggleDocumentExpand;
window.switchSheet = switchSheet;
window.getDocumentContext = getDocumentContext;
window.navigateToLab = navigateToLab;
window.navigateToCourse = navigateToCourse;
window.isSetupComplete = isSetupComplete;
