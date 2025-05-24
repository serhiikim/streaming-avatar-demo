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
    container.className = 'page-container avatar-page';
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }

  private render(): void {
    this.container.innerHTML = `
      <header class="page-header">
        <div class="header-content">
          <div class="page-title">
            <h2>🎭 Avatar Mode</h2>
            <p>Interactive AI avatar with voice and video</p>
          </div>
          <div class="page-actions">
            <button class="nav-button chat-button" data-route="chat">
              <span class="icon">💬</span>
              Switch to Chat
            </button>
            <button class="nav-button settings-button" data-route="settings">
              <span class="icon">⚙️</span>
              Settings
            </button>
            <button class="nav-button home-button" data-route="home">
              <span class="icon">🏠</span>
              Home
            </button>
          </div>
        </div>
      </header>
      
      <main class="avatar-layout">
        <!-- 1/3 Chat Section -->
        <div class="avatar-chat-section">
          <div class="chat-header">
            <h3>Conversation History</h3>
          </div>
          <div id="avatarChatContainer" class="avatar-chat-container"></div>
        </div>
        
        <!-- 2/3 Avatar Section -->
        <div class="avatar-video-section">
          <div class="avatar-video-container">
            <video id="avatarVideo" autoplay playsinline></video>
            <div class="avatar-status" id="avatarStatus">
              <span class="status-indicator disconnected"></span>
              <span class="status-text">Disconnected</span>
            </div>
          </div>
          
          <div class="avatar-controls">
            <div class="input-group">
              <input type="text" id="avatarInput" placeholder="Type your message..." />
              <button id="speakButton" class="speak-btn">
                <span class="icon">🎤</span>
                Send
              </button>
            </div>
            <div class="control-buttons">
              <button id="connectButton" class="connect-btn">
                <span class="icon">🔗</span>
                Connect Avatar
              </button>
              <button id="endSession" class="end-btn" disabled>
                <span class="icon">⏹️</span>
                End Session
              </button>
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

      console.log('AvatarPage initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize AvatarPage:', error);
      this.showError('Failed to initialize avatar interface.');
    }
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
      indicator.className = `status-indicator ${status}`;
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