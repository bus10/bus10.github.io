// Select the audio element, loader, and container
const audio = document.querySelector('audio');
const loader = document.getElementById('loader');
const container = document.querySelector('.container');
let isDisplayed = false;

/**
 * Function to show the content and hide the loader.
 * Ensures this action is performed only once.
 */
function showContent() {
	if (!isDisplayed) {
		loader.style.display = 'none';
		container.style.display = 'block';
		container.setAttribute('aria-hidden', 'false');
		isDisplayed = true;
	}
}

/**
 * Function to handle audio load errors.
 */
function handleAudioError() {
	console.error('Error loading audio');
	showContent();
}

// Fallback event listener for loadeddata in case canplaythrough doesn't fire
audio.addEventListener('loadeddata', showContent);

// Original canplaythrough event listener
audio.addEventListener('canplaythrough', showContent);

// Error event listener for audio
audio.addEventListener('error', handleAudioError);

// Ensure the container is displayed if the document is fully loaded before the audio
document.addEventListener('DOMContentLoaded', showContent);
