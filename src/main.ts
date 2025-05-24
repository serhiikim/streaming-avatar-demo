import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType
} from "@heygen/streaming-avatar";

import { OpenAIAssistant } from "./openai-assistant";
import { AvatarSetup } from "./components/AvatarSetup";

let openaiAssistant: OpenAIAssistant | null = null;

// DOM elements
const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;
const chatMessages = document.getElementById("chatMessages") as HTMLDivElement;

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

// Helper function to add message to chat
function addMessageToChat(message: string, isUser: boolean) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize streaming avatar session
async function initializeAvatarSession(assistant: OpenAIAssistant, openingIntro: string) {
  try {
    // Temporarily disable HeyGen API calls
    // const token = await fetchAccessToken();
    // avatar = new StreamingAvatar({ token });
    
    // avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
    // avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
    
    // sessionData = await avatar.createStartAvatar({
    //   quality: AvatarQuality.Medium,
    //   avatarName: "Wayne_20240711",
    //   language: "English",
    // });

    console.log("Chat session initialized");

    // Enable end button
    endButton.disabled = false;
    
    // Store assistant reference
    openaiAssistant = assistant;

    // Add intro message to chat
    addMessageToChat(openingIntro, false);

    // Temporarily disable avatar speak
    // await avatar.speak({
    //   text: openingIntro,
    //   taskType: TaskType.REPEAT,
    // });

  } catch (error) {
    console.error("Failed to initialize session:", error);
    addMessageToChat("Failed to initialize session. Please try again.", false);
  }
}

// Handle when avatar stream is ready
function handleStreamReady(event: any) {
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch(console.error);
    };
  } else {
    console.error("Stream is not available");
  }
}

// Handle stream disconnection
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
  }

  // Disable end button
  endButton.disabled = true;
}

// End the avatar session
async function terminateAvatarSession() {
  // Temporarily disable avatar cleanup
  // if (!avatar || !sessionData) return;
  // await avatar.stopAvatar();
  // videoElement.srcObject = null;
  // avatar = null;
  openaiAssistant = null;
  endButton.disabled = true;
  addMessageToChat("Session ended.", false);
}

// Handle speaking event
async function handleSpeak() {
  if (openaiAssistant && userInput.value) {
    try {
      const userMessage = userInput.value;
      addMessageToChat(userMessage, true);
      userInput.value = ""; // Clear input after speaking

      const response = await openaiAssistant.getResponse(userMessage);
      addMessageToChat(response, false);
      
      // Temporarily disable avatar speak
      // if (avatar) {
      //   await avatar.speak({
      //     text: response,
      //     taskType: TaskType.REPEAT,
      //   });
      // }
    } catch (error) {
      console.error("Error getting response:", error);
      addMessageToChat("Sorry, there was an error processing your request.", false);
    }
  }
}

// Initialize the application
function initializeApp() {
  // Create avatar setup
  const setup = new AvatarSetup({
    onSetupComplete: async (assistant, openingIntro) => {
      await initializeAvatarSession(assistant, openingIntro);
    }
  });

  // Get the main container and insert setup form before it
  const mainContainer = document.querySelector('.container');
  if (mainContainer && mainContainer.parentNode) {
    mainContainer.parentNode.insertBefore(setup.form, mainContainer);
  }

  // Add event listeners
  endButton.addEventListener("click", terminateAvatarSession);
  speakButton.addEventListener("click", handleSpeak);
}

// Start the application
initializeApp();