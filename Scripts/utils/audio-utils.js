/**
 * AUDIO UTILITIES MODULE
 * ======================
 * 
 * This module provides comprehensive audio functionality for the Pokemon application,
 * including Pokemon cry playback, text-to-speech for Pokédex entries, and audio
 * error handling with fallback sources.
 * 
 * Key Features:
 * - Pokemon cry audio with multiple fallback sources
 * - Text-to-speech for Pokemon names and Pokédex entries
 * - Comprehensive error handling and user feedback
 * - Audio loading state management and user notifications
 * - Cross-platform compatibility for different audio formats
 * 
 * @author Kolby Landon
 * @version 2.1 (Renamed from audio-helpers to audio-utils for consistency)
 * @since 2025
 * @updated 2025-08-01T06:15:00Z
 */

'use strict';

'use strict';

// Import required dependencies
import { 
  showToast 
} from './dom-utils.js';
import { capitalizeFirstLetter } from './data-utils.js?v=20250801i';

// ====================================
// AUDIO SYSTEM CONSTANTS
// ====================================

/** @type {SpeechSynthesis} Web Speech API synthesis interface */
export const Synth = window.speechSynthesis;

/** @type {number} Default volume level for Pokemon cries (0.0 to 1.0) */
const DEFAULT_CRY_VOLUME = 0.7;

/** @type {Array<string>} Alternative audio sources for fallback support */
const ALTERNATIVE_CRY_SOURCES = [
  'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/',
  'https://pokemoncries.com/cries/',
  'https://play.pokemonshowdown.com/audio/cries/'
];

/** @type {Array<string>} Supported audio formats in order of preference */
const SUPPORTED_AUDIO_FORMATS = ['.ogg', '.mp3', '.wav'];

/** @type {boolean} Track if audio context has been unlocked for mobile */
let audioContextUnlocked = false;

// ====================================
// MOBILE AUDIO CONTEXT MANAGEMENT
// ====================================

/**
 * Unlocks audio context for mobile browsers
 * Mobile browsers require user interaction before audio can play
 * This function should be called on first user interaction
 */
export function unlockAudioContext() {
  if (audioContextUnlocked) return;
  
  try {
    // Create a silent audio element and attempt to play it
    const silentAudio = new Audio();
    silentAudio.volume = 0;
    silentAudio.preload = 'auto';
    
    // Use a data URI for a very short silent audio clip
    silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfCCuFyvLGfC4GM2C57+WUQQ0LTaXU8dlzIwc2jdXz1XgqBTLAy+7dexELLXLG8+ONPQ0PVqXU8dtxIQU6gsOj1VB1jA==';
    
    const playPromise = silentAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        audioContextUnlocked = true;
        console.log('📱 [Mobile Audio] Audio context unlocked successfully');
      }).catch(() => {
        console.log('📱 [Mobile Audio] Could not unlock audio context');
      });
    }
    
    // Enhanced Android-specific speech synthesis initialization
    if (window.speechSynthesis) {
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      try {
        if (isAndroid) {
          // Enhanced Android-specific initialization
          console.log('📱 [Android Speech] Enhanced Android speech synthesis initialization');
          
          // Multiple initialization attempts with different strategies
          const initStrategies = [
            // Strategy 1: Empty utterance
            () => {
              const utterance = new SpeechSynthesisUtterance('');
              utterance.volume = 0;
              utterance.rate = 1;
              utterance.pitch = 1;
              Synth.speak(utterance);
              setTimeout(() => Synth.cancel(), 50);
            },
            
            // Strategy 2: Single space
            () => {
              const utterance = new SpeechSynthesisUtterance(' ');
              utterance.volume = 0;
              utterance.rate = 1;
              utterance.pitch = 1;
              Synth.speak(utterance);
              setTimeout(() => Synth.cancel(), 50);
            },
            
            // Strategy 3: Single word
            () => {
              const utterance = new SpeechSynthesisUtterance('test');
              utterance.volume = 0;
              utterance.rate = 1;
              utterance.pitch = 1;
              Synth.speak(utterance);
              setTimeout(() => Synth.cancel(), 100);
            }
          ];
          
          // Execute each strategy with delays
          initStrategies.forEach((strategy, index) => {
            setTimeout(strategy, index * 200);
          });
          
          // Force voices to load multiple times for Android
          const loadVoices = () => {
            const voices = Synth.getVoices();
            if (voices.length === 0) {
              console.log('📱 [Android Speech] No voices loaded, forcing reload attempt');
              
              // Try different methods to trigger voice loading
              setTimeout(() => {
                const triggerUtterance = new SpeechSynthesisUtterance('voice test');
                triggerUtterance.volume = 0;
                triggerUtterance.rate = 0.1;
                Synth.speak(triggerUtterance);
                Synth.cancel();
                
                // Check again after trigger
                setTimeout(() => {
                  const newVoices = Synth.getVoices();
                  console.log(`📱 [Android Speech] Voice reload result: ${newVoices.length} voices`);
                }, 500);
              }, 300);
            } else {
              console.log(`📱 [Android Speech] Found ${voices.length} voices on initialization`);
            }
          };
          
          // Load voices immediately and with delays
          loadVoices();
          setTimeout(loadVoices, 500);
          setTimeout(loadVoices, 1000);
          setTimeout(loadVoices, 2000);
          
        } else {
          // Non-Android initialization (simplified)
          const testUtterance = new SpeechSynthesisUtterance('');
          testUtterance.volume = 0;
          Synth.speak(testUtterance);
          Synth.cancel();
          console.log('📱 [Mobile Speech] Speech synthesis initialized');
        }
      } catch (speechError) {
        console.log('📱 [Mobile Speech] Could not initialize speech synthesis:', speechError);
      }
    }
  } catch (error) {
    console.log('📱 [Mobile Audio] Error attempting to unlock audio context:', error);
  }
}

// ====================================
// POKEMON CRY PLAYBACK
// ====================================

/**
 * Plays the audio cry for the currently displayed Pokemon
 * Uses global pokemon object if available, otherwise extracts data from DOM
 * Attempts multiple fallback audio sources if primary source fails
 * @example
 * playCurrentPokemonCry(); // Plays cry for currently displayed Pokemon
 */
export function playCurrentPokemonCry() {
  try {
    let pokemonData = null;
    
    // First try to get global pokemon object if available
    if (typeof window !== 'undefined' && window.pokemon) {
      pokemonData = window.pokemon;
      console.log('Using global pokemon object:', pokemonData);
    } else {
      // Fallback: Extract Pokemon data from DOM elements
      const nameElement = document.getElementById('name-header');
      const numberElement = document.getElementById('number-header');
      
      let pokemonName = '';
      let pokemonId = '';
      
      if (nameElement && nameElement.textContent) {
        pokemonName = nameElement.textContent.trim().toLowerCase();
        // Clean up name - remove any extra characters
        pokemonName = pokemonName.replace(/[^\w\s-]/g, '').trim();
        console.log('Extracted Pokemon name:', pokemonName);
      }
      
      if (numberElement && numberElement.textContent) {
        const numberMatch = numberElement.textContent.match(/\d+/);
        if (numberMatch) {
          pokemonId = parseInt(numberMatch[0]);
          console.log('Extracted Pokemon ID:', pokemonId);
        }
      }
      
      console.log('Extracted Pokemon data from DOM:', { name: pokemonName, id: pokemonId });
      
      if (!pokemonName || !pokemonId) {
        console.error('Could not extract Pokemon data from DOM - Name:', nameElement?.textContent, 'Number:', numberElement?.textContent);
        showToast('Cannot play cry: Pokemon data not found');
        return;
      }
      
      // Create Pokemon object for audio playback without hardcoded cry URL
      pokemonData = { 
        name: pokemonName, 
        id: pokemonId,
        cry: null // Let the function use fallback sources
      };
    }
    
    playPokemonCryWithData(pokemonData);
  } catch (error) {
    console.error('Error in playCurrentPokemonCry:', error);
    showToast('Error playing Pokemon cry');
  }
}

/**
 * Plays Pokemon cry audio with comprehensive error handling and fallback sources
 * Manages button states during playback and provides user feedback via toast notifications
 * @param {Object} pokemon - Pokemon data object containing cry URL and basic info
 * @example
 * const pokemon = { 
 *   name: 'pikachu', 
 *   id: 25, 
 *   cry: 'https://example.com/pikachu.ogg' 
 * };
 * playPokemonCryWithData(pokemon);
 */
export function playPokemonCryWithData(pokemon) {
  if (!pokemon || (!pokemon.name && !pokemon.id)) {
    console.error('Invalid Pokemon data for cry playback');
    showToast('Cannot play cry: Invalid Pokemon data');
    return;
  }

  // Unlock audio context for mobile browsers on first interaction
  unlockAudioContext();

  const cryButton = document.getElementById('cry-button');
  const cryButtonTop = document.getElementById('cry-button-top');
  
  if (!cryButton || !cryButtonTop) {
    console.error('Cry button elements not found');
    return;
  }

  // Store original button state for restoration
  const originalHTML = cryButtonTop.innerHTML;
  
  // Set loading state
  cryButtonTop.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  cryButton.disabled = true;
  cryButton.classList.add('loading');
  
  // Function to reset button state
  function resetButtonState() {
    cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
    cryButton.disabled = false;
    cryButton.classList.remove('loading');
  }

  try {
    // If no cry URL is provided or it's null, go directly to alternative sources
    if (!pokemon.cry) {
      console.log('No primary cry URL available, using alternative sources');
      resetButtonState();
      tryAlternativeCry(pokemon);
      return;
    }

    // Create audio element for primary cry source
    const audio = new Audio();
    
    // Set up event handlers for audio loading and playback
    audio.addEventListener('error', (e) => {
      console.error('Error loading Pokémon cry:', e);
      resetButtonState();
      tryAlternativeCry(pokemon); // Attempt fallback sources
    });
    
    audio.addEventListener('loadstart', () => {
      console.log('Loading Pokémon cry...');
    });
    
    audio.addEventListener('canplay', () => {
      console.log('Pokémon cry ready to play');
      resetButtonState();
    });
    
    audio.addEventListener('ended', () => {
      resetButtonState(); // Reset when audio finishes
    });
    
    // Configure audio properties for optimal playback
    audio.volume = DEFAULT_CRY_VOLUME;     // Set to 70% volume
    audio.preload = 'auto';                // Preload for faster playback
    audio.crossOrigin = 'anonymous';       // Enable CORS for external sources
    
    // Set the audio source
    audio.src = pokemon.cry;
    
    // Attempt to play with promise handling (required for modern browsers)
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`Playing ${pokemon.name}'s cry`);
          showToast(`Playing ${capitalizeFirstLetter(pokemon.name)}'s cry! 🔊`);
          cryButtonTop.innerHTML = `<i class="fa-solid fa-play"></i>`;
          cryButton.classList.remove('loading');
        })
        .catch((error) => {
          console.error('Error playing Pokémon cry:', error);
          resetButtonState();
          
          // Handle specific error types with appropriate user feedback
          if (error.name === 'NotAllowedError') {
            // Check if this is likely a mobile browser
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
              showToast('Tap the cry button again to enable audio on mobile');
              // Try to unlock audio context again
              unlockAudioContext();
            } else {
              showToast('Please interact with the page first, then try again');
            }
          } else if (error.name === 'NotSupportedError') {
            showToast('Audio format not supported by your browser');
          } else {
            showToast('Failed to play Pokémon cry');
            // Try alternative sources on play failure
            tryAlternativeCry(pokemon);
          }
        });
    }
  } catch (error) {
    console.error('Error creating audio for Pokémon cry:', error);
    // Reset button state on any error
    cryButtonTop.innerHTML = originalHTML;
    cryButton.disabled = pokemon.cry ? false : true;
    cryButton.classList.remove('loading');
    showToast('Error loading Pokémon cry');
    
    // Attempt alternative sources if available
    if (pokemon.name || pokemon.id) {
      tryAlternativeCry(pokemon);
    }
  }
}

/**
 * Attempts to play Pokemon cry using alternative audio sources
 * Fallback function when primary cry source fails, tries multiple formats and sources
 * @param {Object} pokemon - Pokemon data object with id and name
 * @example
 * const pokemon = { name: 'pikachu', id: 25 };
 * tryAlternativeCry(pokemon);
 */
export function tryAlternativeCry(pokemon) {
  console.log(`🔄 [Alternative Cry] Starting fallback audio for:`, pokemon);
  
  if (!pokemon || !pokemon.id) {
    console.error('❌ [Alternative Cry] Invalid Pokemon data for alternative cry:', pokemon);
    return;
  }
  
  const cryButton = document.getElementById('cry-button');
  const cryButtonTop = document.getElementById('cry-button-top');
  
  if (!cryButton || !cryButtonTop) {
    console.error('❌ [Alternative Cry] Cry button elements not found in DOM');
    return;
  }
  
  // Generate all possible alternative URLs
  const alternativeUrls = [];
  ALTERNATIVE_CRY_SOURCES.forEach(baseUrl => {
    SUPPORTED_AUDIO_FORMATS.forEach(format => {
      if (baseUrl.includes('pokemonshowdown')) {
        // Pokemon Showdown uses name-based URLs
        const url = `${baseUrl}${pokemon.name.toLowerCase()}${format}`;
        alternativeUrls.push(url);
        console.log(`🎵 [Alternative Cry] Generated showdown URL: ${url}`);
      } else {
        // Other sources use ID-based URLs
        const url = `${baseUrl}${pokemon.id}${format}`;
        alternativeUrls.push(url);
        console.log(`🎵 [Alternative Cry] Generated ID-based URL: ${url}`);
      }
    });
  });
  
  console.log(`🎵 [Alternative Cry] Generated ${alternativeUrls.length} alternative URLs`);
  showToast('Trying alternative audio sources...');
  
  let currentIndex = 0;
  
  // Recursive function to try each alternative source
  function tryNext() {
    if (currentIndex >= alternativeUrls.length) {
      // All sources failed - disable cry feature
      console.error(`❌ [Alternative Cry] All ${alternativeUrls.length} sources failed`);
      showToast('No working cry audio found for this Pokémon');
      cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
      cryButton.disabled = true;
      cryButton.classList.add('cry-unavailable');
      return;
    }
    
    const currentUrl = alternativeUrls[currentIndex];
    console.log(`🎵 [Alternative Cry] Trying source ${currentIndex + 1}/${alternativeUrls.length}: ${currentUrl}`);
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = DEFAULT_CRY_VOLUME;
    
    // Set up timeout for slow-loading sources
    const timeout = setTimeout(() => {
      console.warn(`⏰ [Alternative Cry] Timeout for source ${currentIndex + 1}: ${currentUrl}`);
      currentIndex++;
      tryNext();
    }, 5000); // 5 second timeout
    
    audio.addEventListener('error', (error) => {
      console.warn(`❌ [Alternative Cry] Error with source ${currentIndex + 1}: ${currentUrl}`, error);
      clearTimeout(timeout);
      currentIndex++;
      tryNext(); // Try next source on error
    });
    
    audio.addEventListener('canplay', () => {
      console.log(`✅ [Alternative Cry] Source ${currentIndex + 1} ready: ${currentUrl}`);
      clearTimeout(timeout);
      audio.play()
        .then(() => {
          console.log(`🔊 [Alternative Cry] Successfully playing ${pokemon.name}'s cry from source ${currentIndex + 1}`);
          showToast(`Playing ${capitalizeFirstLetter(pokemon.name)}'s cry! 🔊`);
          cryButtonTop.innerHTML = `<i class="fa-solid fa-play"></i>`;
          cryButton.disabled = false;
          cryButton.classList.remove('cry-unavailable');
          
          audio.addEventListener('ended', () => {
            console.log(`🔇 [Alternative Cry] Audio playback ended for ${pokemon.name}`);
            cryButtonTop.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
          });
        })
        .catch((playError) => {
          console.warn(`❌ [Alternative Cry] Play error for source ${currentIndex + 1}: ${currentUrl}`, playError);
          currentIndex++;
          tryNext(); // Try next source on play error
        });
    });
    
    audio.src = currentUrl;
  }
  
  tryNext();
}

// ====================================
// TEXT-TO-SPEECH FUNCTIONALITY
// ====================================

/**
 * Initiates text-to-speech reading of Pokemon entry information
 * Reads Pokemon name, genus, and Pokédex entry using Web Speech API
 * @param {string} name - Pokemon name to announce
 * @param {string} genus - Pokemon genus classification (e.g., "Seed Pokémon")
 * @param {string} entry - Pokédex entry text to read
 * @example
 * startReadingEntry('Bulbasaur', 'Seed Pokémon', 'A strange seed was planted...');
 */
export function startReadingEntry(name, genus, entry) {
  if (!name || !genus || !entry) {
    console.warn('Missing required text for speech synthesis');
    showToast('Cannot read entry: missing information');
    return;
  }

  // Check if speech synthesis is supported
  if (!isSpeechSupported()) {
    console.error('Speech synthesis not supported in this browser');
    showToast('Text-to-speech not supported in this browser');
    return;
  }

  // Unlock audio context for mobile devices
  unlockAudioContext();

  // Cancel any ongoing speech before starting new reading
  Synth.cancel();
  
  // Provide immediate feedback for Android users
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    showToast('🤖 Preparing Android text-to-speech...');
    
    // Android-specific: Check if TTS services are available
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        console.log('📱 [Android Speech] No voices immediately available, this may indicate TTS services are disabled');
        showToast('⚠️ If speech doesn\'t work, enable Google Text-to-Speech in Settings → Accessibility → Text-to-speech output');
        setTimeout(() => {
          const delayedVoices = window.speechSynthesis.getVoices();
          if (delayedVoices.length === 0) {
            showToast('💡 Android TTS Setup: Settings → Apps → Google Text-to-Speech → Enable');
          }
        }, 1000);
      }
    }
  }
  
  try {
    
    // Android-specific: More aggressive initialization
    if (isAndroid) {
      console.log('📱 [Android Speech] Starting Android-specific speech initialization');
      
      // Force multiple initialization attempts for Android
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const initUtterance = new SpeechSynthesisUtterance('');
          initUtterance.volume = 0;
          initUtterance.rate = 1;
          initUtterance.pitch = 1;
          Synth.speak(initUtterance);
          setTimeout(() => Synth.cancel(), 10);
        }, i * 100);
      }
    }
    
    // Android-specific: Wait for voices to load if they're not available immediately
    const waitForVoices = () => {
      return new Promise((resolve) => {
        let voices = Synth.getVoices();
        
        if (voices.length > 0) {
          resolve(voices);
        } else {
          // Android often needs time to load voices
          const voicesChangedHandler = () => {
            voices = Synth.getVoices();
            if (voices.length > 0) {
              Synth.removeEventListener('voiceschanged', voicesChangedHandler);
              resolve(voices);
            }
          };
          
          Synth.addEventListener('voiceschanged', voicesChangedHandler);
          
          // Extended timeout for Android devices that might not fire voiceschanged
          setTimeout(() => {
            Synth.removeEventListener('voiceschanged', voicesChangedHandler);
            voices = Synth.getVoices();
            if (voices.length === 0) {
              console.log('📱 [Android Speech] No voices found, forcing another attempt');
              // Force another getVoices call for stubborn Android devices
              setTimeout(() => {
                voices = Synth.getVoices();
                resolve(voices);
              }, 500);
            } else {
              resolve(voices);
            }
          }, isAndroid ? 2000 : 1000);
        }
      });
    };

    // Wait for voices to be available before proceeding
    waitForVoices().then((voices) => {
      console.log(`📱 [Speech] Available voices: ${voices.length}`);
      
      if (isAndroid) {
        // Android-specific implementation with enhanced error handling
        const fullText = `${name}. The ${genus}. ${entry}`;
        const utterance = new SpeechSynthesisUtterance(fullText);
        
        // Enhanced Android speech parameters
        utterance.rate = 0.7;    // Even slower rate for Android reliability
        utterance.pitch = 1.0;   // Normal pitch
        utterance.volume = 1.0;  // Full volume for Android
        
        // Set best available English voice for Android
        if (voices.length > 0) {
          // Prioritize local voices over network voices for Android
          const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            voice.localService === true
          ) || voices.find(voice => 
            voice.lang.startsWith('en') && 
            !voice.name.toLowerCase().includes('network')
          ) || voices.find(voice => 
            voice.lang.startsWith('en')
          );
          
          if (englishVoice) {
            utterance.voice = englishVoice;
            console.log('📱 [Android Speech] Using voice:', englishVoice.name, 'Local:', englishVoice.localService);
          } else {
            console.log('📱 [Android Speech] No English voice found, using default');
          }
        } else {
          console.log('📱 [Android Speech] No voices available, proceeding with default');
        }
        
        // Enhanced Android event listeners
        utterance.addEventListener('start', () => {
          console.log('📱 [Android Speech] Successfully started reading Pokemon entry');
          showToast('📢 Reading Pokédex entry...');
        });
        
        utterance.addEventListener('end', () => {
          console.log('📱 [Android Speech] Successfully finished reading Pokemon entry');
          showToast('✅ Finished reading entry');
        });
        
        utterance.addEventListener('error', (error) => {
          console.error('📱 [Android Speech] Speech synthesis error:', error);
          console.log('📱 [Android Speech] Error details:', {
            error: error.error,
            message: error.message,
            type: error.type
          });
          
          // Android-specific error handling and retry logic
          if (error.error === 'network' || error.error === 'synthesis-failed') {
            console.log('📱 [Android Speech] Network/synthesis error, attempting retry with different settings');
            showToast('⚠️ Speech failed, trying again...');
            
            // Retry with simplified text and different settings
            setTimeout(() => {
              const retryUtterance = new SpeechSynthesisUtterance(fullText);
              retryUtterance.rate = 0.6;
              retryUtterance.pitch = 1.0;
              retryUtterance.volume = 0.9;
              
              // Use default voice for retry
              retryUtterance.voice = null;
              
              retryUtterance.addEventListener('start', () => {
                console.log('📱 [Android Speech] Retry successful');
                showToast('📢 Reading Pokédex entry...');
              });
              
              retryUtterance.addEventListener('error', () => {
                console.log('📱 [Android Speech] Retry also failed');
                showToast('❌ Text-to-speech unavailable. Try enabling "TalkBack" or "Select to Speak" in Android Accessibility settings, then try again.');
              });
              
              Synth.speak(retryUtterance);
            }, 1000);
          } else {
            showToast('❌ Text-to-speech failed. On Android, try enabling "TalkBack" or "Select to Speak" in Accessibility settings.');
          }
        });
        
        // Android-specific: Multiple initialization attempts before speaking
        setTimeout(() => {
          console.log('📱 [Android Speech] Attempting to start speech synthesis');
          
          // Clear any pending speech before starting
          Synth.cancel();
          
          // Additional delay for Android TTS engine initialization
          setTimeout(() => {
            console.log('📱 [Android Speech] Starting utterance');
            Synth.speak(utterance);
            
            // Android fallback: Check if speech actually started
            setTimeout(() => {
              if (!Synth.speaking && !Synth.pending) {
                console.log('📱 [Android Speech] Speech did not start, attempting manual trigger');
                showToast('🔄 Initializing speech... Please wait.');
                
                // Force another attempt
                const forceUtterance = new SpeechSynthesisUtterance('Ready');
                forceUtterance.volume = 0.1;
                forceUtterance.rate = 1;
                forceUtterance.addEventListener('end', () => {
                  setTimeout(() => {
                    Synth.speak(utterance);
                    
                    // Final check - if still not working, provide help
                    setTimeout(() => {
                      if (!Synth.speaking && !Synth.pending) {
                        console.log('📱 [Android Speech] All attempts failed');
                        showToast('� Text-to-speech unavailable. Try: Settings → Accessibility → Text-to-speech → Install or update Google TTS');
                        
                        // Provide a one-time diagnostic
                        setTimeout(() => {
                          const diagnosticVoices = window.speechSynthesis.getVoices();
                          console.log('📱 [Android Diagnostic] Final voice count:', diagnosticVoices.length);
                          if (diagnosticVoices.length === 0) {
                            showToast('🚨 No TTS voices found. Install Google Text-to-Speech from Play Store');
                          } else {
                            showToast('⚙️ TTS voices found but not working. Check TTS settings or restart browser');
                          }
                        }, 2000);
                      }
                    }, 1000);
                  }, 200);
                });
                Synth.speak(forceUtterance);
              }
            }, 500);
          }, 300);
        }, 400);
        
      } else {
        // Non-Android devices: Use separate utterances for better control
        const nameUtterance = new SpeechSynthesisUtterance(name);
        const genusUtterance = new SpeechSynthesisUtterance(`The ${genus}`);
        const entryUtterance = new SpeechSynthesisUtterance(entry);
        
        // Configure speech parameters for better listening experience
        [nameUtterance, genusUtterance, entryUtterance].forEach(utterance => {
          utterance.rate = 0.9;    // Slightly slower for clarity
          utterance.pitch = 1.0;   // Normal pitch
          utterance.volume = 0.8;  // 80% volume
          
          // Set a voice if available (important for some mobile browsers)
          if (voices.length > 0) {
            // Prefer English voices
            const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
            if (englishVoice) {
              utterance.voice = englishVoice;
            }
          }
        });
        
        // Add event listeners for user feedback
        nameUtterance.addEventListener('start', () => {
          console.log('📱 [Speech] Starting to read Pokemon entry');
          showToast('Reading Pokemon entry...');
        });
        
        entryUtterance.addEventListener('end', () => {
          console.log('📱 [Speech] Finished reading Pokemon entry');
          showToast('Finished reading entry');
        });
        
        entryUtterance.addEventListener('error', (error) => {
          console.error('📱 [Speech] Speech synthesis error:', error);
          showToast('Error reading entry. Try tapping the button again.');
        });
        
        // Queue speech synthesis utterances in sequence
        console.log('📱 [Speech] Starting speech synthesis');
        Synth.speak(nameUtterance);
        Synth.speak(genusUtterance);
        
        // Brief pause between genus and entry for better flow
        setTimeout(() => {
          Synth.speak(entryUtterance);
        }, 100);
      }
    });
    
  } catch (error) {
    console.error('📱 [Speech] Error setting up speech synthesis:', error);
    showToast('Text-to-speech not available');
  }
}

/**
 * Stops any currently playing text-to-speech
 * Provides immediate cancellation of ongoing speech synthesis
 * @example
 * stopReadingEntry(); // Immediately stops any current speech
 */
export function stopReadingEntry() {
  if (Synth.speaking) {
    Synth.cancel();
    console.log('Speech synthesis cancelled');
    showToast('Stopped reading entry');
  }
}

/**
 * Toggles text-to-speech playback state
 * Pauses if speaking, resumes if paused, starts if stopped
 * @returns {string} Current state after toggle ('playing', 'paused', 'stopped')
 * @example
 * const state = toggleSpeechPlayback();
 * console.log(`Speech is now: ${state}`);
 */
export function toggleSpeechPlayback() {
  if (Synth.speaking && !Synth.paused) {
    // Currently speaking - pause it
    Synth.pause();
    showToast('Paused reading');
    return 'paused';
  } else if (Synth.paused) {
    // Currently paused - resume it
    Synth.resume();
    showToast('Resumed reading');
    return 'playing';
  } else {
    // Not speaking - already stopped
    showToast('No active reading to toggle');
    return 'stopped';
  }
}

// ====================================
// AUDIO UTILITY FUNCTIONS
// ====================================

/**
 * Checks if the browser supports audio playback
 * Tests for HTML5 audio support and common formats
 * @returns {boolean} True if audio is supported, false otherwise
 * @example
 * if (isAudioSupported()) {
 *   playPokemonCry(pokemon);
 * } else {
 *   showToast('Audio not supported in this browser');
 * }
 */
export function isAudioSupported() {
  const audio = document.createElement('audio');
  return !!(audio.canPlayType && (
    audio.canPlayType('audio/mpeg;').replace(/no/, '') ||
    audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '') ||
    audio.canPlayType('audio/wav; codecs="1"').replace(/no/, '')
  ));
}

/**
 * Checks if the browser supports the Web Speech API
 * @returns {boolean} True if speech synthesis is supported
 * @example
 * if (isSpeechSupported()) {
 *   startReadingEntry(name, genus, entry);
 * } else {
 *   showToast('Text-to-speech not supported');
 * }
 */
export function isSpeechSupported() {
  if (!('speechSynthesis' in window)) {
    console.log('📱 [Speech Check] speechSynthesis not available in window');
    return false;
  }
  
  // Additional check for mobile browsers that might have partial support
  try {
    const testUtterance = new SpeechSynthesisUtterance('test');
    if (!testUtterance) {
      console.log('📱 [Speech Check] Cannot create SpeechSynthesisUtterance');
      return false;
    }
    
    // Android-specific check - ensure voices are available
    const voices = window.speechSynthesis.getVoices();
    console.log('📱 [Speech Check] Available voices:', voices.length);
    
    // If no voices are available immediately, try to wait for them (Android issue)
    if (voices.length === 0) {
      console.log('📱 [Speech Check] No voices available immediately, will retry when needed');
      
      // Android-specific: Provide helpful guidance
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        console.log('📱 [Android Speech Check] Android device detected - TTS may need manual activation');
        return true; // Still return true, but with a warning that it might need setup
      }
    }
    
    console.log('📱 [Speech Check] Speech synthesis is supported');
    return true;
  } catch (error) {
    console.log('📱 [Speech Check] Error testing speech synthesis:', error);
    return false;
  }
}

/**
 * Preloads a Pokemon cry audio file for faster playback
 * Useful for preloading next/previous Pokemon cries
 * @param {string} cryUrl - URL of the cry audio file to preload
 * @returns {Promise<Audio>} Promise that resolves with preloaded audio object
 * @example
 * preloadPokemonCry('https://example.com/pikachu.ogg')
 *   .then(audio => console.log('Cry preloaded successfully'))
 *   .catch(error => console.log('Failed to preload cry'));
 */
export function preloadPokemonCry(cryUrl) {
  return new Promise((resolve, reject) => {
    if (!cryUrl) {
      reject(new Error('No cry URL provided'));
      return;
    }
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => {
      resolve(audio);
    });
    
    audio.addEventListener('error', (error) => {
      reject(error);
    });
    
    audio.src = cryUrl;
  });
}

// ====================================
// BACKWARD COMPATIBILITY EXPORTS
// ====================================

// Export for main.js compatibility - maps to current Pokemon cry function
export { playCurrentPokemonCry as playPokemonCry };

// Maintain backward compatibility with existing code
export { playCurrentPokemonCry as playPokemonCryLegacy };
export { tryAlternativeCry as tryAlternativeCryLegacy };
export { startReadingEntry as startReadingEntryLegacy };

// Global constants for backward compatibility
export const POKEMON_CRY_VOLUME = DEFAULT_CRY_VOLUME;
export const SPEECH_SYNTH = Synth;
