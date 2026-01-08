/**
 * AI Prompt Lab - Results Page Logic
 */

document.addEventListener('DOMContentLoaded', initResultsPage);

async function initResultsPage() {
    const progress = getUserProgress();

    // Check if all 6 labs are complete
    const requiredLabs = [1, 2, 3, 4, 5, 6];
    const allComplete = requiredLabs.every(id => progress.completedLabs.includes(id));

    if (!allComplete) {
        showToast('Complete all 6 labs to see your results!', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Calculate overall stats
    const stats = calculateOverallStats(progress);

    // Render the page
    renderOverallScore(stats);
    renderTrackResults(progress);
    renderSkillBreakdown(stats);

    // Generate AI diagnostic (async)
    await generateDiagnostic(progress, stats);

    // Prepare share canvas
    prepareShareCanvas(progress, stats);
}

function calculateOverallStats(progress) {
    const scores = Object.values(progress.scores);

    // Average final score
    const avgScore = Math.round(scores.reduce((sum, s) => sum + s.finalScore, 0) / scores.length);

    // Average AI dimensions
    const dimensions = ['specificity', 'completeness', 'structure', 'actionability', 'outputControl'];
    const avgDimensions = {};
    dimensions.forEach(dim => {
        const sum = scores.reduce((acc, s) => acc + (s.aiEvaluation?.[dim] || 0), 0);
        avgDimensions[dim] = Math.round((sum / scores.length) * 10) / 10;
    });

    // Technique usage counts
    const techniqueKeys = ['outputFormat', 'lengthConstraint', 'audienceDefined', 'toneSpecified', 'negativeConstraints', 'multipleRequirements', 'contextProvided'];
    const techniqueCounts = {};
    techniqueKeys.forEach(key => {
        techniqueCounts[key] = scores.filter(s => s.techniques?.[key]).length;
    });

    return { avgScore, avgDimensions, techniqueCounts, totalLabs: scores.length };
}

function renderOverallScore(stats) {
    const scoreEl = document.getElementById('overall-score');
    const ringFill = document.getElementById('score-ring-fill');
    const gradeEl = document.getElementById('overall-grade');

    // Animate score number
    animateNumber(scoreEl, 0, stats.avgScore, 1500);

    // Animate ring (283 is full circumference)
    const offset = 283 - (283 * stats.avgScore / 100);
    setTimeout(() => {
        ringFill.style.strokeDashoffset = offset;
    }, 100);

    // Grade
    const grade = getGradeLabel(stats.avgScore);
    gradeEl.innerHTML = `
        <span class="grade-label-large" style="color: ${grade.color}">${grade.label}</span>
        <span class="grade-stars-large">${renderStars(grade.stars)}</span>
    `;
}

function renderTrackResults(progress) {
    const container = document.getElementById('track-results');

    const tracks = [
        { name: 'Text & Content', icon: '📝', labs: [3, 4] },
        { name: 'Finance & Data', icon: '📊', labs: [5, 6] },
        { name: 'Marketing & Media', icon: '🎨', labs: [1, 2] }
    ];

    container.innerHTML = tracks.map(track => {
        const labResults = track.labs.map(id => {
            const lab = LABS[id];
            const score = progress.scores[id];
            if (!lab || !score) return '';
            const grade = getGradeLabel(score.finalScore);
            return `
                <div class="track-lab-result">
                    <span class="lab-name">${lab.title}</span>
                    <span class="lab-score" style="color: ${grade.color}">${score.finalScore}/100</span>
                    <span class="lab-stars">${renderStars(grade.stars)}</span>
                </div>
            `;
        }).join('');

        const validLabs = track.labs.filter(id => progress.scores[id]);
        const trackAvg = validLabs.length > 0
            ? Math.round(validLabs.reduce((sum, id) => sum + progress.scores[id].finalScore, 0) / validLabs.length)
            : 0;

        return `
            <div class="track-result-card">
                <div class="track-result-header">
                    <span class="track-result-icon">${track.icon}</span>
                    <span class="track-result-name">${track.name}</span>
                    <span class="track-result-avg">${trackAvg}/100</span>
                </div>
                <div class="track-labs-list">
                    ${labResults}
                </div>
            </div>
        `;
    }).join('');
}

function renderSkillBreakdown(stats) {
    // AI Dimensions
    const skillBars = document.getElementById('skill-bars');
    const dimensionLabels = {
        specificity: 'Specificity',
        completeness: 'Completeness',
        structure: 'Structure',
        actionability: 'Actionability',
        outputControl: 'Output Control'
    };

    skillBars.innerHTML = Object.entries(dimensionLabels).map(([key, label]) => {
        const score = stats.avgDimensions[key] || 0;
        return `
            <div class="skill-bar-row">
                <span class="skill-bar-label">${label}</span>
                <div class="skill-bar">
                    <div class="skill-bar-fill" style="width: ${score * 10}%"></div>
                </div>
                <span class="skill-bar-score">${score}/10</span>
            </div>
        `;
    }).join('');

    // Technique Usage
    const techniqueUsage = document.getElementById('technique-usage');
    const techniqueLabels = {
        outputFormat: 'Output Format',
        lengthConstraint: 'Length Constraint',
        audienceDefined: 'Audience Defined',
        toneSpecified: 'Tone Specified',
        negativeConstraints: 'Negative Constraints',
        multipleRequirements: 'Multiple Requirements',
        contextProvided: 'Context Provided'
    };

    techniqueUsage.innerHTML = Object.entries(techniqueLabels).map(([key, label]) => {
        const count = stats.techniqueCounts[key] || 0;
        const total = stats.totalLabs;
        const status = count >= 4 ? 'good' : count >= 2 ? 'okay' : 'needs-work';

        return `
            <div class="technique-usage-row ${status}">
                <span class="technique-usage-check">${count >= 4 ? '✓' : count >= 2 ? '◐' : '○'}</span>
                <span class="technique-usage-label">${label}</span>
                <span class="technique-usage-count">${count}/${total} labs</span>
            </div>
        `;
    }).join('');
}

async function generateDiagnostic(progress, stats) {
    const loadingEl = document.getElementById('diagnostic-loading');
    const contentEl = document.getElementById('diagnostic-content');

    // Check if API is configured
    if (!isApiConfigured('gemini')) {
        loadingEl.classList.add('hidden');
        contentEl.innerHTML = `
            <p>Your overall score of <strong>${stats.avgScore}/100</strong> shows solid prompting fundamentals.</p>
            <p>Focus on the techniques you used least often to improve your scores on future prompts.</p>
            <p>Keep practicing - effective prompting is a skill that improves with repetition!</p>
        `;
        return;
    }

    const diagnosticPrompt = `You are an AI prompting coach writing a personalized assessment for a student who completed a 6-lab AI prompting course.

PERFORMANCE BY LAB:
${Object.entries(progress.scores).map(([labId, data]) => {
    const lab = LABS[labId];
    if (!lab) return '';
    return `
Lab: ${lab.title} (${lab.difficulty})
Score: ${data.finalScore}/100
Prompt: "${data.userPrompt.substring(0, 200)}${data.userPrompt.length > 200 ? '...' : ''}"
Feedback: ${data.aiEvaluation?.briefFeedback || 'N/A'}
`;
}).join('\n')}

AGGREGATED SCORES (0-10 scale):
- Specificity: ${stats.avgDimensions.specificity}
- Completeness: ${stats.avgDimensions.completeness}
- Structure: ${stats.avgDimensions.structure}
- Actionability: ${stats.avgDimensions.actionability}
- Output Control: ${stats.avgDimensions.outputControl}

TECHNIQUE USAGE (out of 6 labs):
- Output formatting: ${stats.techniqueCounts.outputFormat}/6
- Length constraints: ${stats.techniqueCounts.lengthConstraint}/6
- Audience defined: ${stats.techniqueCounts.audienceDefined}/6
- Tone specified: ${stats.techniqueCounts.toneSpecified}/6
- Negative constraints: ${stats.techniqueCounts.negativeConstraints}/6

Write a personalized 3-paragraph diagnostic (150 words total):

PARAGRAPH 1 - STRENGTHS: What did they do well? Be specific, reference actual labs.
PARAGRAPH 2 - OPPORTUNITY: Their biggest area for improvement. Pick ONE focus area.
PARAGRAPH 3 - NEXT STEP: ONE concrete, actionable tip for their next prompt.

Tone: Encouraging coach. Specific, not generic. Celebratory but honest.`;

    try {
        const result = await generateTextWithGemini(diagnosticPrompt);

        loadingEl.classList.add('hidden');
        contentEl.innerHTML = `<p>${result.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

    } catch (error) {
        console.error('Diagnostic generation failed:', error);
        loadingEl.classList.add('hidden');
        contentEl.innerHTML = `
            <p>Your overall score of <strong>${stats.avgScore}/100</strong> shows solid prompting fundamentals.</p>
            <p>Focus on the techniques you used least often to improve your scores on future prompts.</p>
            <p>Keep practicing - effective prompting is a skill that improves with repetition!</p>
        `;
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(start + (end - start) * eased);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function retakeCourse() {
    if (confirm('This will clear all your progress. Are you sure?')) {
        localStorage.removeItem(PROGRESS_KEY);
        window.location.href = 'lab.html?id=1';
    }
}

// Share functionality
function openShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.style.overflow = '';
    }
}

function prepareShareCanvas(progress, stats) {
    const canvas = document.getElementById('share-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const grade = getGradeLabel(stats.avgScore);

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative gradient circles
    ctx.globalAlpha = 0.15;
    const circle1 = ctx.createRadialGradient(200, 150, 0, 200, 150, 300);
    circle1.addColorStop(0, '#2563eb');
    circle1.addColorStop(1, 'transparent');
    ctx.fillStyle = circle1;
    ctx.fillRect(0, 0, width, height);

    const circle2 = ctx.createRadialGradient(1000, 500, 0, 1000, 500, 250);
    circle2.addColorStop(0, '#10b981');
    circle2.addColorStop(1, 'transparent');
    ctx.fillStyle = circle2;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Logo/Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText('🧪 AI Prompt Lab', 50, 60);

    // "I Completed" text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px Inter, sans-serif';
    ctx.fillText('I completed the course!', 50, 110);

    // Large Score
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 140px Inter, sans-serif';
    const scoreText = stats.avgScore.toString();
    ctx.fillText(scoreText, 50, 280);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillText('/100', 50 + ctx.measureText(scoreText).width + 10, 280);

    // Grade Label
    ctx.fillStyle = grade.color;
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(grade.label, 50, 340);

    // Stars
    ctx.font = '32px sans-serif';
    ctx.fillText(renderStars(grade.stars), 50, 390);

    // Lab Scores (right side)
    const labX = 650;
    let labY = 100;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('SCORES BY LAB', labX, labY);
    labY += 40;

    const tracks = [
        { name: 'Text & Content', icon: '📝', labs: [3, 4] },
        { name: 'Finance & Data', icon: '📊', labs: [5, 6] },
        { name: 'Marketing & Media', icon: '🎨', labs: [1, 2] }
    ];

    tracks.forEach(track => {
        // Track header
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`${track.icon} ${track.name}`, labX, labY);
        labY += 30;

        // Labs
        track.labs.forEach(id => {
            const lab = LABS[id];
            const score = progress.scores[id];
            if (!lab || !score) return;
            const labGrade = getGradeLabel(score.finalScore);

            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(lab.title, labX + 20, labY);

            ctx.fillStyle = labGrade.color;
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`${score.finalScore}/100`, labX + 350, labY);

            labY += 28;
        });

        labY += 15;
    });

    // Skill bars (bottom right)
    const skillX = 650;
    let skillY = 420;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('SKILLS', skillX, skillY);
    skillY += 30;

    const dimensions = [
        { key: 'specificity', label: 'Specificity' },
        { key: 'completeness', label: 'Completeness' },
        { key: 'structure', label: 'Structure' },
        { key: 'actionability', label: 'Actionability' },
        { key: 'outputControl', label: 'Output Control' }
    ];

    dimensions.forEach(dim => {
        const score = stats.avgDimensions[dim.key] || 0;

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(dim.label, skillX, skillY);

        // Bar background
        ctx.fillStyle = '#334155';
        ctx.fillRect(skillX + 100, skillY - 10, 150, 12);

        // Bar fill
        const barGradient = ctx.createLinearGradient(skillX + 100, 0, skillX + 250, 0);
        barGradient.addColorStop(0, '#2563eb');
        barGradient.addColorStop(1, '#10b981');
        ctx.fillStyle = barGradient;
        ctx.fillRect(skillX + 100, skillY - 10, 150 * (score / 10), 12);

        // Score
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(score.toFixed(1), skillX + 260, skillY);

        skillY += 28;
    });

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Completed 6 AI Prompting Labs', 50, height - 40);

    ctx.fillStyle = '#10b981';
    ctx.fillText('Powered by AI Prompt Lab', 50, height - 15);
}

function downloadShareImage() {
    const canvas = document.getElementById('share-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'ai-prompt-lab-results.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Image downloaded!', 'success');
}

function copyShareText() {
    const progress = getUserProgress();
    const stats = calculateOverallStats(progress);
    const grade = getGradeLabel(stats.avgScore);

    // Build lab scores text
    const labScores = [];
    const tracks = [
        { name: 'Text & Content', icon: '📝', labs: [3, 4] },
        { name: 'Finance & Data', icon: '📊', labs: [5, 6] },
        { name: 'Marketing & Media', icon: '🎨', labs: [1, 2] }
    ];

    tracks.forEach(track => {
        track.labs.forEach(id => {
            const lab = LABS[id];
            const score = progress.scores[id];
            if (lab && score) {
                labScores.push(`${track.icon} ${lab.title}: ${score.finalScore}/100`);
            }
        });
    });

    const text = `🎓 I completed AI Prompt Lab!

📊 Overall Score: ${stats.avgScore}/100 (${grade.label})
${'⭐'.repeat(grade.stars)}${'☆'.repeat(5 - grade.stars)}

My Results:
${labScores.join('\n')}

Skills:
- Specificity: ${stats.avgDimensions.specificity}/10
- Completeness: ${stats.avgDimensions.completeness}/10
- Structure: ${stats.avgDimensions.structure}/10
- Actionability: ${stats.avgDimensions.actionability}/10
- Output Control: ${stats.avgDimensions.outputControl}/10

#AIPromptLab #PromptEngineering`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Results copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeShareModal();
    }
});

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeShareModal();
    }
});
