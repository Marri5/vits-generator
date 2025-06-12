/**
 * VITS-GENERATOR FRONTEND JAVASCRIPT
 * Håndterer all interaktivitet i applikasjonen
 */

// Globale variabler
let currentJoke = null;
let isLoading = false;

// DOM-elementer
const elements = {
    startSection: document.getElementById('start-section'),
    startBtn: document.getElementById('start-btn'),
    jokeContainer: document.getElementById('joke-container'),
    loading: document.getElementById('loading'),
    setup: document.getElementById('setup'),
    punchline: document.getElementById('punchline'),
    revealBtn: document.getElementById('reveal-btn'),
    ratingSection: document.getElementById('rating-section'),
    starRating: document.querySelector('.star-rating'),
    feedbackSection: document.getElementById('feedback-section'),
    feedbackText: document.getElementById('feedback-text'),
    averageRating: document.getElementById('average-rating'),
    totalRatings: document.getElementById('total-ratings'),
    nextJokeBtn: document.getElementById('next-joke-btn'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn')
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Start-knapp
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startJokeGenerator);
    }

    // Vis punchline-knapp
    if (elements.revealBtn) {
        elements.revealBtn.addEventListener('click', revealPunchline);
    }

    // Vurderingsstjerner
    if (elements.starRating) {
        const stars = elements.starRating.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => handleRating(star.dataset.rating));
            star.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRating(star.dataset.rating);
                }
            });
            
            // Hover-effekt
            star.addEventListener('mouseenter', () => highlightStars(star.dataset.rating));
            star.addEventListener('mouseleave', () => highlightStars(0));
        });
    }

    // Neste vits-knapp
    if (elements.nextJokeBtn) {
        elements.nextJokeBtn.addEventListener('click', fetchNewJoke);
    }

    // Prøv igjen-knapp
    if (elements.retryBtn) {
        elements.retryBtn.addEventListener('click', fetchNewJoke);
    }

    // Tastaturnavigasjon for stjerner
    if (elements.starRating) {
        elements.starRating.addEventListener('keydown', handleStarKeyboardNavigation);
    }
});

/**
 * Start vits-generator
 */
function startJokeGenerator() {
    if (elements.startSection) {
        elements.startSection.style.display = 'none';
    }
    if (elements.jokeContainer) {
        elements.jokeContainer.style.display = 'block';
    }
    fetchNewJoke();
}

/**
 * Hent ny vits fra API
 */
async function fetchNewJoke() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    hideError();
    resetJokeDisplay();

    try {
        const response = await fetch(`${API_URL}/api/joke/random`, {
            credentials: 'include' // Inkluder cookies
        });
        
        if (!response.ok) {
            throw new Error('Kunne ikke hente vits');
        }

        const joke = await response.json();
        currentJoke = joke;
        displayJoke(joke);
        
    } catch (error) {
        console.error('Feil ved henting av vits:', error);
        showError('Kunne ikke hente vits. Sjekk internettforbindelsen din.');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

/**
 * Vis vits på skjermen
 */
function displayJoke(joke) {
    if (!joke || !joke.setup) {
        showError('Vitsen mangler innhold. Prøv en annen vits.');
        return;
    }

    // Vis setup
    if (elements.setup) {
        elements.setup.textContent = joke.setup;
    }

    // Skjul punchline og vis reveal-knapp
    if (elements.punchline) {
        elements.punchline.textContent = joke.punchline || 'Ingen punchline tilgjengelig';
        elements.punchline.style.display = 'none';
    }

    if (elements.revealBtn) {
        elements.revealBtn.style.display = 'inline-flex';
        elements.revealBtn.focus(); // Flytt fokus til knappen
    }

    // Hvis brukeren allerede har vurdert denne vitsen
    if (joke.userRating) {
        // Lagre brukerens tidligere vurdering
        currentJoke.previousUserRating = joke.userRating;
    }

    // Skjul vurdering og tilbakemelding
    if (elements.ratingSection) elements.ratingSection.style.display = 'none';
    if (elements.feedbackSection) elements.feedbackSection.style.display = 'none';
}

/**
 * Vis punchline
 */
function revealPunchline() {
    if (elements.punchline) {
        elements.punchline.style.display = 'block';
        // Annonser for skjermlesere
        elements.punchline.setAttribute('aria-live', 'polite');
    }

    if (elements.revealBtn) {
        elements.revealBtn.style.display = 'none';
    }

    if (elements.ratingSection) {
        elements.ratingSection.style.display = 'block';
        
        // Hvis brukeren har vurdert denne vitsen før
        if (currentJoke.previousUserRating) {
            // Vis tidligere vurdering
            highlightStars(currentJoke.previousUserRating);
            
            // Oppdater tekst
            const hint = document.querySelector('.rating-hint');
            if (hint) {
                hint.innerHTML = `Du ga denne vitsen ${currentJoke.previousUserRating} stjerner tidligere. <br>Klikk for å endre vurdering.`;
            }
        } else {
            // Reset stjerner for ny vurdering
            resetStars();
        }
        
        // Flytt fokus til første stjerne
        const firstStar = elements.starRating.querySelector('.star');
        if (firstStar) firstStar.focus();
    }
}

/**
 * Håndter vurdering
 */
async function handleRating(rating) {
    if (!currentJoke || !currentJoke.id) {
        showError('Ingen vits å vurdere');
        return;
    }

    // Deaktiver stjerner mens vi sender vurdering
    disableStars(true);
    
    try {
        const response = await fetch(`${API_URL}/api/joke/${currentJoke.id}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Inkluder cookies
            body: JSON.stringify({ rating: parseInt(rating) })
        });

        if (!response.ok) {
            throw new Error('Kunne ikke lagre vurdering');
        }

        const result = await response.json();
        showFeedback(result, rating);
        
    } catch (error) {
        console.error('Feil ved lagring av vurdering:', error);
        showError('Kunne ikke lagre vurderingen. Prøv igjen.');
        disableStars(false);
    }
}

/**
 * Vis tilbakemelding etter vurdering
 */
function showFeedback(result, userRating) {
    // Skjul vurderingsseksjonen
    if (elements.ratingSection) {
        elements.ratingSection.style.display = 'none';
    }

    // Vis tilbakemelding
    if (elements.feedbackSection) {
        elements.feedbackSection.style.display = 'block';
    }

    // Oppdater tekst basert på om det er en ny eller oppdatert vurdering
    if (elements.feedbackText) {
        if (result.previousRating) {
            elements.feedbackText.innerHTML = `Din vurdering er oppdatert!<br>
                Tidligere: ${result.previousRating} stjerner → Nå: ${result.newRating} stjerner`;
        } else {
            elements.feedbackText.textContent = `Takk for din vurdering! Du ga ${userRating} stjerner.`;
        }
    }

    if (elements.averageRating) {
        elements.averageRating.textContent = result.averageRating.toFixed(1);
    }

    if (elements.totalRatings) {
        elements.totalRatings.textContent = result.totalRatings;
    }

    // Fokuser på neste vits-knappen
    if (elements.nextJokeBtn) {
        elements.nextJokeBtn.focus();
    }
}

/**
 * Håndter tastaturnavigasjon for stjerner
 */
function handleStarKeyboardNavigation(e) {
    const stars = Array.from(elements.starRating.querySelectorAll('.star'));
    const currentIndex = stars.findIndex(star => star === document.activeElement);

    switch(e.key) {
        case 'ArrowRight':
            e.preventDefault();
            if (currentIndex < stars.length - 1) {
                stars[currentIndex + 1].focus();
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (currentIndex > 0) {
                stars[currentIndex - 1].focus();
            }
            break;
        case 'Home':
            e.preventDefault();
            stars[0].focus();
            break;
        case 'End':
            e.preventDefault();
            stars[stars.length - 1].focus();
            break;
    }
}

/**
 * Hjelpefunksjoner
 */
function showLoading(show) {
    if (elements.loading) {
        elements.loading.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    if (elements.errorContainer) {
        elements.errorContainer.style.display = 'block';
    }
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
    }
    if (elements.jokeContainer) {
        elements.jokeContainer.style.display = 'none';
    }
}

function hideError() {
    if (elements.errorContainer) {
        elements.errorContainer.style.display = 'none';
    }
}

function resetJokeDisplay() {
    if (elements.setup) elements.setup.textContent = '';
    if (elements.punchline) {
        elements.punchline.textContent = '';
        elements.punchline.style.display = 'none';
    }
    if (elements.revealBtn) elements.revealBtn.style.display = 'none';
    if (elements.ratingSection) elements.ratingSection.style.display = 'none';
    if (elements.feedbackSection) elements.feedbackSection.style.display = 'none';
}

function highlightStars(rating) {
    const stars = elements.starRating.querySelectorAll('.star');
    stars.forEach((star, index) => {
        const icon = star.querySelector('i');
        if (index < rating) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            star.classList.add('active');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            star.classList.remove('active');
        }
    });
}

function resetStars() {
    const stars = elements.starRating.querySelectorAll('.star');
    stars.forEach(star => {
        const icon = star.querySelector('i');
        icon.classList.remove('fas');
        icon.classList.add('far');
        star.classList.remove('active');
    });
    disableStars(false);
}

function disableStars(disabled) {
    const stars = elements.starRating.querySelectorAll('.star');
    stars.forEach(star => {
        star.disabled = disabled;
    });
}

/**
 * Service Worker registrering for offline-støtte (valgfritt)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registrering feilet - ikke kritisk
        });
    });
} 