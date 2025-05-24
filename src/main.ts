import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType
} from "@heygen/streaming-avatar";

import { OpenAIAssistant } from "./openai-assistant";
import { AvatarSetup } from "./components/AvatarSetup";
import { ChatInterface } from "./components/ChatInterface";
import { ModeSelector } from "./components/ModeSelector";
import { AssistantStorage } from "./storage";

let openaiAssistant: OpenAIAssistant | null = null;
let chatInterface: ChatInterface | null = null;
let modeSelector: ModeSelector | null = null;
let avatarSetup: AvatarSetup | null = null;

// Interface mode management
type InterfaceMode = 'chat' | 'avatar';
let currentMode: InterfaceMode = 'chat';

// DOM elements
const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;

// Main containers
let chatContainer: HTMLElement;
let avatarContainer: HTMLElement;
let controlsContainer: HTMLElement;
let mainContainer: HTMLElement;

let avatar: StreamingAvatar | null = null;
let sessionData: any = null;

// Helper function to fetch access token
async function fetchAccessToken(): Promise<string> {
  const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;
  const response = await fetch(
    "https://api.heygen.com/v1/streaming.create_token",
    {
      method: "POST",
      headers: { "x-api-key": apiKey },
    }
  );

  const { data } = await response.json();
  return data.token;
}

// Initialize chat mode
async function initializeChatMode(assistant: OpenAIAssistant) {
  try {
    openaiAssistant = assistant;
    currentMode = 'chat';

    // Hide mode selector
    if (modeSelector) {
      modeSelector.remove();
      modeSelector = null;
    }

    // Show main interface
    mainContainer.style.display = 'block';
    
    // Get container references
    chatContainer = document.querySelector('.chat-container') as HTMLElement;
    avatarContainer = document.querySelector('.avatar-container') as HTMLElement;
    controlsContainer = document.querySelector('.controls-container') as HTMLElement;

    // Create chat interface
    chatInterface = new ChatInterface({
      assistant: assistant,
      onMessageSent: (message, response) => {
        console.log('Chat message sent:', { message, response });
      }
    });

    // Setup chat interface
    if (chatContainer) {
      chatContainer.innerHTML = '';
      chatContainer.appendChild(chatInterface.getContainer());
      chatContainer.style.display = 'block';
    }

    // Hide avatar elements
    if (avatarContainer) avatarContainer.style.display = 'none';
    if (controlsContainer) controlsContainer.style.display = 'none';

    // Add header controls
    addHeaderControls();

    // Add welcome message from storage
    const welcomeMessage = AssistantStorage.getOpeningIntroduction();
    chatInterface.addMessage(welcomeMessage, false);

    console.log("Chat mode initialized successfully");

  } catch (error) {
    console.error("Failed to initialize chat mode:", error);
    showError("Failed to initialize chat interface.");
  }
}

// Initialize avatar mode
async function initializeAvatarMode(assistant: OpenAIAssistant) {
  try {
    openaiAssistant = assistant;
    currentMode = 'avatar';

    // Hide mode selector
    if (modeSelector) {
      modeSelector.remove();
      modeSelector = null;
    }

    // Show main interface
    mainContainer.style.display = 'block';
    
    // Get container references
    chatContainer = document.querySelector('.chat-container') as HTMLElement;
    avatarContainer = document.querySelector('.avatar-container') as HTMLElement;
    controlsContainer = document.querySelector('.controls-container') as HTMLElement;

    // Create chat interface for history
    chatInterface = new ChatInterface({
      assistant: assistant,
      onMessageSent: (message, response) => {
        console.log('Chat message sent:', { message, response });
      }
    });

    // Setup interfaces
    if (chatContainer) {
      chatContainer.innerHTML = '';
      chatContainer.appendChild(chatInterface.getContainer());
      chatContainer.style.display = 'block';
    }

    // Show avatar elements
    if (avatarContainer) avatarContainer.style.display = 'block';
    if (controlsContainer) controlsContainer.style.display = 'block';

    // Add header controls
    addHeaderControls();

    // Initialize avatar
    await initializeAvatar();

    console.log("Avatar mode initialized successfully");

  } catch (error) {
    console.error("Failed to initialize avatar mode:", error);
    showError("Failed to initialize avatar interface.");
  }
}

// Initialize avatar streaming
async function initializeAvatar() {
  try {
    const token = await fetchAccessToken();
    avatar = new StreamingAvatar({ token });
    
    avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
    avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
    
    sessionData = await avatar.createStartAvatar({
      quality: AvatarQuality.Medium,
      avatarName: "Wayne_20240711",
      language: "English",
    });

    // Enable end button
    if (endButton) {
      endButton.disabled = false;
    }

    // Get welcome message from storage
    const welcomeMessage = AssistantStorage.getOpeningIntroduction();
    if (chatInterface) {
      chatInterface.addMessage(welcomeMessage, false);
    }

    // Speak welcome message
    if (avatar) {
      await avatar.speak({
        text: welcomeMessage,
        taskType: TaskType.REPEAT,
      });
    }

  } catch (error) {
    console.error("Failed to initialize avatar:", error);
    if (chatInterface) {
      chatInterface.addSystemMessage("Failed to initialize avatar. Using chat mode instead.");
    }
  }
}

// Add header controls for mode switching
function addHeaderControls() {
  const header = document.querySelector('header');
  if (!header || header.querySelector('.header-controls')) return;

  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'header-controls';
  controlsDiv.innerHTML = `
    <div class="mode-indicator">
      <span class="current-mode-icon">${currentMode === 'avatar' ? '🎭' : '💬'}</span>
      <span class="current-mode-text">${currentMode === 'avatar' ? 'Avatar Mode' : 'Chat Mode'}</span>
    </div>
    <div class="control-buttons">
      <button class="switch-mode-btn" ${currentMode === 'avatar' ? 'data-target="chat"' : 'data-target="avatar"'}>
        <span class="icon">${currentMode === 'avatar' ? '💬' : '🎭'}</span>
        Switch to ${currentMode === 'avatar' ? 'Chat' : 'Avatar'}
      </button>
      <button class="configure-assistant-btn">
        <span class="icon">⚙️</span>
        Configure
      </button>
    </div>
  `;

  header.appendChild(controlsDiv);

  // Add event listeners
  const switchBtn = controlsDiv.querySelector('.switch-mode-btn') as HTMLButtonElement;
  const configureBtn = controlsDiv.querySelector('.configure-assistant-btn') as HTMLButtonElement;

  switchBtn.addEventListener('click', handleModeSwitch);
  configureBtn.addEventListener('click', showAvatarSetup);
}

// Handle mode switching
async function handleModeSwitch() {
  if (!openaiAssistant) return;

  const newMode: InterfaceMode = currentMode === 'chat' ? 'avatar' : 'chat';
  
  try {
    // Clean up current mode
    if (currentMode === 'avatar' && avatar) {
      await avatar.stopAvatar();
      if (videoElement) videoElement.srcObject = null;
      avatar = null;
      sessionData = null;
    }

    // Switch to new mode
    if (newMode === 'avatar') {
      currentMode = 'avatar';
      if (avatarContainer) avatarContainer.style.display = 'block';
      if (controlsContainer) controlsContainer.style.display = 'block';
      await initializeAvatar();
    } else {
      currentMode = 'chat';
      if (avatarContainer) avatarContainer.style.display = 'none';
      if (controlsContainer) controlsContainer.style.display = 'none';
      if (endButton) endButton.disabled = true;
    }

    // Update header controls
    updateHeaderControls();

  } catch (error) {
    console.error('Error switching modes:', error);
    showError('Failed to switch modes. Please try again.');
  }
}

// Update header controls
function updateHeaderControls() {
  const headerControls = document.querySelector('.header-controls');
  if (!headerControls) return;

  const modeIcon = headerControls.querySelector('.current-mode-icon');
  const modeText = headerControls.querySelector('.current-mode-text');
  const switchBtn = headerControls.querySelector('.switch-mode-btn') as HTMLButtonElement;

  if (modeIcon) modeIcon.textContent = currentMode === 'avatar' ? '🎭' : '💬';
  if (modeText) modeText.textContent = currentMode === 'avatar' ? 'Avatar Mode' : 'Chat Mode';
  
  if (switchBtn) {
    switchBtn.innerHTML = `
      <span class="icon">${currentMode === 'avatar' ? '💬' : '🎭'}</span>
      Switch to ${currentMode === 'avatar' ? 'Chat' : 'Avatar'}
    `;
    switchBtn.setAttribute('data-target', currentMode === 'avatar' ? 'chat' : 'avatar');
  }
}

// Show avatar setup
function showAvatarSetup() {
  if (avatarSetup) return; // Already showing

  avatarSetup = new AvatarSetup({
    onSetupComplete: async (assistant, openingIntro) => {
      // Update current assistant
      openaiAssistant = assistant;
      
      // Save the opening introduction to storage
      AssistantStorage.updateOpeningIntroduction(openingIntro);
      
      // Update chat interface with new assistant
      if (chatInterface) {
        // Create new chat interface with updated assistant
        const newChatInterface = new ChatInterface({
          assistant: assistant,
          onMessageSent: (message, response) => {
            console.log('Chat message sent:', { message, response });
          }
        });
        
        // Replace old interface
        if (chatContainer) {
          chatContainer.innerHTML = '';
          chatContainer.appendChild(newChatInterface.getContainer());
        }
        
        chatInterface = newChatInterface;
        chatInterface.addMessage(openingIntro, false);
      }
      
      // Hide setup
      if (avatarSetup) {
        avatarSetup.form.remove();
        avatarSetup = null;
      }
      
      showSuccess("Assistant configuration updated successfully!");
    }
  });

  // Insert setup form
  if (mainContainer && mainContainer.parentNode) {
    mainContainer.parentNode.insertBefore(avatarSetup.form, mainContainer);
  }
}

// Event handlers for avatar mode
function handleStreamReady(event: any) {
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch(console.error);
    };
  }
}

function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) videoElement.srcObject = null;
  if (endButton) endButton.disabled = true;
}

// Handle avatar speaking
async function handleSpeak() {
  if (currentMode !== 'avatar' || !openaiAssistant || !userInput.value) return;

  try {
    const userMessage = userInput.value;
    userInput.value = "";

    if (chatInterface) {
      chatInterface.addMessage(userMessage, true);
    }

    const response = await openaiAssistant.getResponse(userMessage);
    
    if (chatInterface) {
      chatInterface.addMessage(response, false);
    }
    
    if (avatar) {
      await avatar.speak({
        text: response,
        taskType: TaskType.REPEAT,
      });
    }
  } catch (error) {
    console.error("Error getting response:", error);
    if (chatInterface) {
      chatInterface.addMessage("Sorry, there was an error processing your request.", false);
    }
  }
}

// End avatar session
async function terminateAvatarSession() {
  if (avatar && sessionData) {
    try {
      await avatar.stopAvatar();
      if (videoElement) videoElement.srcObject = null;
      avatar = null;
      sessionData = null;
    } catch (error) {
      console.error("Error terminating avatar session:", error);
    }
  }
  
  if (endButton) endButton.disabled = true;
  if (chatInterface) {
    chatInterface.addSystemMessage("Avatar session ended.");
  }
}

// Utility functions
function showError(message: string) {
  console.error(message);
  alert(message); // Simple implementation - you can enhance this
}

function showSuccess(message: string) {
  console.log(message);
  alert(message); // Simple implementation - you can enhance this
}

// Initialize the application
function initializeApp() {
  // Get main container
  mainContainer = document.querySelector('.container') as HTMLElement;
  
  // Hide main container initially
  if (mainContainer) {
    mainContainer.style.display = 'none';
  }

  // Create mode selector
  modeSelector = new ModeSelector({
    onModeSelected: async (mode, assistant) => {
      if (mode === 'chat') {
        await initializeChatMode(assistant);
      } else {
        await initializeAvatarMode(assistant);
      }
    },
    onConfigureAvatar: () => {
      // Remove mode selector and show avatar setup
      if (modeSelector) {
        modeSelector.remove();
        modeSelector = null;
      }
      
      avatarSetup = new AvatarSetup({
        onSetupComplete: async (assistant, openingIntro) => {
          // Save configuration
          AssistantStorage.updateOpeningIntroduction(openingIntro);
          
          // After setup, show mode selector again
          if (avatarSetup) {
            avatarSetup.form.remove();
            avatarSetup = null;
          }
          
          // Reinitialize mode selector
          modeSelector = new ModeSelector({
            onModeSelected: async (mode, assistant) => {
              if (mode === 'chat') {
                await initializeChatMode(assistant);
              } else {
                await initializeAvatarMode(assistant);
              }
            },
            onConfigureAvatar: showAvatarSetup
          });
          
          // Add mode selector to page
          if (mainContainer && mainContainer.parentNode) {
            mainContainer.parentNode.insertBefore(modeSelector.container, mainContainer);
          }
        }
      });
      
      // Add setup form to page
      if (mainContainer && mainContainer.parentNode) {
        mainContainer.parentNode.insertBefore(avatarSetup.form, mainContainer);
      }
    }
  });

  // Add mode selector to page
  if (mainContainer && mainContainer.parentNode) {
    mainContainer.parentNode.insertBefore(modeSelector.container, mainContainer);
  }

  // Add event listeners for avatar controls
  if (endButton) endButton.addEventListener("click", terminateAvatarSession);
  if (speakButton) speakButton.addEventListener("click", handleSpeak);
  if (userInput) {
    userInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && currentMode === 'avatar') {
        handleSpeak();
      }
    });
  }
}

// Start the application
initializeApp();