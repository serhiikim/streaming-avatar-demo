import { ChatInterface } from "../components/ChatInterface";
import { AssistantService } from "../services/AssistantService";
import { AvatarService } from "../services/AvatarService";
import type { AvatarStatus } from "../services/AvatarService";
import { NavigationService } from "../services/NavigationService";

export class AvatarPage {
  private container: HTMLElement;
  private chatInterface: ChatInterface | null = null;
  private assistantService: AssistantService;
  private avatarService: AvatarService;
  private navigationService: NavigationService;
  private initialized = false;

  constructor() {
    this.assistantService = AssistantService.getInstance();
    this.avatarService = AvatarService.getInstance();
    this.navigationService = NavigationService.getInstance();
    this.container = this.createContainer();
    this.render();
    this.setupAvatarStatusCallback();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gray-50';
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }

  private render(): void {
    this.container.innerHTML = `
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🎭</span>
              <div>
                <h2 class="text-xl font-bold text-gray-800">Avatar Mode</h2>
                <p class="text-sm text-gray-600">Interactive AI avatar with voice and video</p>
              </div>
            </div>
            
            <div class="flex space-x-3">
              <button class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105" data-route="chat">
                <span>💬</span>
                <span class="font-medium">Switch to Chat</span>
              </button>
              
              <button class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300" data-route="settings">
                <span>⚙️</span>
                <span class="font-medium">Settings</span>
              </button>
              
              <button class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300" data-route="home">
                <span>🏠</span>
                <span class="font-medium">Home</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Main Split Layout -->
      <main class="flex-1 max-w-7xl mx-auto px-4 py-6">
        <div class="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <!-- 1/3 Chat Section -->
          <div class="col-span-1 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200">
              <h3 class="font-semibold text-gray-800">Conversation History</h3>
            </div>
            <div id="avatarChatContainer" class="flex-1 overflow-hidden"></div>
          </div>
          
          <!-- 2/3 Avatar Section -->
          <div class="col-span-2 space-y-4">
            <!-- Video Container -->
            <div class="bg-black rounded-2xl shadow-lg overflow-hidden relative" style="aspect-ratio: 16/9;">
              <video id="avatarVideo" autoplay playsinline class="w-full h-full object-cover"></video>
              
              <!-- Status Indicator -->
              <div id="avatarStatus" class="absolute top-4 left-4 flex items-center space-x-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded-full text-sm">
                <span class="status-indicator w-2 h-2 rounded-full bg-gray-400"></span>
                <span class="status-text">Disconnected</span>
              </div>
            </div>
            
            <!-- Controls -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <!-- Input Group -->
              <div class="flex space-x-3 mb-4">
                <input 
                  type="text" 
                  id="avatarInput" 
                  placeholder="Type your message..." 
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
                />
                <button id="speakButton" class="flex items-center space-x-2 px-6 py-3 bg-success text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span>🎤</span>
                  <span class="font-medium">Send</span>
                </button>
              </div>
              
              <!-- Control Buttons -->
              <div class="flex space-x-3">
                <button id="connectButton" class="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all duration-300">
                  <span>🔗</span>
                  <span class="font-medium">Connect Avatar</span>
                </button>
                
                <button id="endSession" class="flex items-center space-x-2 px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  <span>⏹️</span>
                  <span class="font-medium">End Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Navigation buttons
    const navButtons = this.container.querySelectorAll('[data-route]');
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const route = (e.currentTarget as HTMLElement).dataset.route;
        if (route) {
          this.navigationService.navigateTo(route as any);
        }
      });
    });

    // Avatar controls
    const speakButton = this.container.querySelector('#speakButton') as HTMLButtonElement;
    const endButton = this.container.querySelector('#endSession') as HTMLButtonElement;
    const connectButton = this.container.querySelector('#connectButton') as HTMLButtonElement;
    const avatarInput = this.container.querySelector('#avatarInput') as HTMLInputElement;

    if (speakButton) {
      speakButton.addEventListener('click', () => this.handleSpeak());
    }

    if (endButton) {
      endButton.addEventListener('click', () => this.handleEndSession());
    }

    if (connectButton) {
      connectButton.addEventListener('click', () => this.initializeAvatar());
    }

    if (avatarInput) {
      avatarInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          this.handleSpeak();
        }
      });
    }
  }

  private setupAvatarStatusCallback(): void {
    this.avatarService.setStatusCallback((status: AvatarStatus, message: string) => {
      this.updateAvatarStatus(status, message);
    });
  }

  async initialize(): Promise<void> {
    // Only initialize once
    if (this.initialized) {
      return;
    }

    try {
      // Ensure assistant is ready
      if (!this.assistantService.isReady()) {
        await this.assistantService.initialize();
      }

      // Create chat interface
      const assistant = this.assistantService.getAssistant();
      if (!assistant) {
        throw new Error('Assistant not available');
      }

      this.chatInterface = new ChatInterface({
        assistant: assistant,
        onMessageSent: (message, response) => {
          console.log('Avatar chat message sent:', { message, response });
        }
      });

      // Add chat interface to container
      const chatContainer = this.container.querySelector('#avatarChatContainer') as HTMLElement;
      if (chatContainer) {
        chatContainer.appendChild(this.chatInterface.getContainer());
      }

      this.initialized = true;
      console.log('AvatarPage initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize AvatarPage:', error);
      this.showError('Failed to initialize avatar interface.');
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async initializeAvatar(): Promise<void> {
    try {
      const videoElement = this.container.querySelector('#avatarVideo') as HTMLVideoElement;
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      await this.avatarService.initialize(videoElement);
      
      // Enable controls
      this.updateControlsState(true);
      
      // Add welcome message and speak it
      const welcomeMessage = this.assistantService.getWelcomeMessage();
      if (this.chatInterface) {
        this.chatInterface.addMessage(welcomeMessage, false);
      }
      
      await this.avatarService.speak(welcomeMessage);
      
    } catch (error) {
      console.error('Failed to initialize avatar:', error);
      if (this.chatInterface) {
        this.chatInterface.addSystemMessage("Failed to initialize avatar. Please try again.");
      }
    }
  }

  private async handleSpeak(): Promise<void> {
    const avatarInput = this.container.querySelector('#avatarInput') as HTMLInputElement;
    if (!avatarInput.value.trim() || !this.avatarService.isConnected()) {
      return;
    }

    try {
      const userMessage = avatarInput.value.trim();
      avatarInput.value = '';

      // Add to chat interface
      if (this.chatInterface) {
        this.chatInterface.addMessage(userMessage, true);
      }

      // Get response from assistant
      const response = await this.assistantService.sendMessage(userMessage);
      
      // Add response to chat interface
      if (this.chatInterface) {
        this.chatInterface.addMessage(response, false);
      }
      
      // Speak with avatar
      await this.avatarService.speak(response);

    } catch (error) {
      console.error('Error in avatar conversation:', error);
      if (this.chatInterface) {
        this.chatInterface.addMessage("Sorry, there was an error processing your request.", false);
      }
    }
  }

  private async handleEndSession(): Promise<void> {
    try {
      await this.avatarService.disconnect();
      this.updateControlsState(false);
      
      if (this.chatInterface) {
        this.chatInterface.addSystemMessage("Avatar session ended.");
      }
      
    } catch (error) {
      console.error('Error ending avatar session:', error);
    }
  }

  private updateAvatarStatus(status: AvatarStatus, message: string): void {
    const statusElement = this.container.querySelector('#avatarStatus');
    if (!statusElement) return;

    const indicator = statusElement.querySelector('.status-indicator');
    const textElement = statusElement.querySelector('.status-text');
    
    if (indicator) {
      // Remove all status classes
      indicator.classList.remove('bg-gray-400', 'bg-yellow-400', 'bg-green-400', 'bg-orange-400', 'bg-red-400');
      
      // Add appropriate status class
      switch (status) {
        case 'connecting':
          indicator.classList.add('bg-yellow-400', 'animate-pulse');
          break;
        case 'connected':
          indicator.classList.add('bg-green-400');
          break;
        case 'disconnecting':
          indicator.classList.add('bg-orange-400', 'animate-pulse');
          break;
        case 'disconnected':
          indicator.classList.add('bg-gray-400');
          break;
        case 'error':
          indicator.classList.add('bg-red-400');
          break;
      }
    }
    
    if (textElement) {
      textElement.textContent = message;
    }
  }

  private updateControlsState(connected: boolean): void {
    const speakButton = this.container.querySelector('#speakButton') as HTMLButtonElement;
    const endButton = this.container.querySelector('#endSession') as HTMLButtonElement;
    const connectButton = this.container.querySelector('#connectButton') as HTMLButtonElement;
    const avatarInput = this.container.querySelector('#avatarInput') as HTMLInputElement;

    if (speakButton) speakButton.disabled = !connected;
    if (endButton) endButton.disabled = !connected;
    if (connectButton) connectButton.disabled = connected;
    if (avatarInput) avatarInput.disabled = !connected;
  }

  private showError(message: string): void {
    const chatContainer = this.container.querySelector('#avatarChatContainer') as HTMLElement;
    if (chatContainer && this.chatInterface) {
      this.chatInterface.addSystemMessage(message);
    }
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    // Cleanup avatar connection
    if (this.avatarService.isConnected()) {
      this.avatarService.disconnect().catch(console.error);
    }
    
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Update interfaces with new assistant (after settings change)
  async updateAssistant(): Promise<void> {
    if (!this.chatInterface) return;

    try {
      const assistant = this.assistantService.getAssistant();
      if (!assistant) return;

      // Create new chat interface with updated assistant
      const newChatInterface = new ChatInterface({
        assistant: assistant,
        onMessageSent: (message, response) => {
          console.log('Avatar chat message sent:', { message, response });
        }
      });

      // Replace old interface
      const chatContainer = this.container.querySelector('#avatarChatContainer') as HTMLElement;
      if (chatContainer) {
        chatContainer.innerHTML = '';
        chatContainer.appendChild(newChatInterface.getContainer());
        
        // Add updated welcome message
        const welcomeMessage = this.assistantService.getWelcomeMessage();
        newChatInterface.addMessage(welcomeMessage, false);
      }

      this.chatInterface = newChatInterface;
      
    } catch (error) {
      console.error('Failed to update avatar assistant:', error);
    }
  }
}