import { ChatInterface } from "../components/ChatInterface";
import { AssistantService } from "../services/AssistantService";
import { NavigationService } from "../services/NavigationService";

export class ChatPage {
  private container: HTMLElement;
  private chatInterface: ChatInterface | null = null;
  private assistantService: AssistantService;
  private navigationService: NavigationService;
  private initialized = false;

  constructor() {
    this.assistantService = AssistantService.getInstance();
    this.navigationService = NavigationService.getInstance();
    this.container = this.createContainer();
    this.render();
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
              <span class="text-2xl">💬</span>
              <div>
                <h2 class="text-xl font-bold text-gray-800">Chat Mode</h2>
                <p class="text-sm text-gray-600">Text-based conversation with your AI assistant</p>
              </div>
            </div>
            
            <div class="flex space-x-3">
              <button class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-105" data-route="avatar">
                <span>🎭</span>
                <span class="font-medium">Switch to Avatar</span>
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
      
      <!-- Main Chat Area -->
      <main class="flex-1 max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 h-[calc(100vh-200px)]">
          <div id="chatContainer" class="h-full flex flex-col"></div>
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
          console.log('Chat message sent:', { message, response });
        }
      });

      // Add chat interface to container
      const chatContainer = this.container.querySelector('#chatContainer') as HTMLElement;
      if (chatContainer) {
        chatContainer.appendChild(this.chatInterface.getContainer());
        
        // Add welcome message
        const welcomeMessage = this.assistantService.getWelcomeMessage();
        this.chatInterface.addMessage(welcomeMessage, false);
      }

      this.initialized = true;
      console.log('ChatPage initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize ChatPage:', error);
      this.showError('Failed to initialize chat interface.');
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private showError(message: string): void {
    const chatContainer = this.container.querySelector('#chatContainer') as HTMLElement;
    if (chatContainer) {
      chatContainer.innerHTML = `
        <div class="error-container">
          <div class="error-message">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
          </div>
          <button class="retry-button" onclick="window.location.reload()">
            Retry
          </button>
        </div>
      `;
    }
  }

  show(): void {
    this.container.style.display = 'block';
    
    // Focus chat input if available
    if (this.chatInterface) {
      this.chatInterface.focus();
    }
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Update chat interface with new assistant (after settings change)
  async updateAssistant(): Promise<void> {
    if (!this.chatInterface) return;

    try {
      const assistant = this.assistantService.getAssistant();
      if (!assistant) return;

      // Create new chat interface with updated assistant
      const newChatInterface = new ChatInterface({
        assistant: assistant,
        onMessageSent: (message, response) => {
          console.log('Chat message sent:', { message, response });
        }
      });

      // Replace old interface
      const chatContainer = this.container.querySelector('#chatContainer') as HTMLElement;
      if (chatContainer) {
        chatContainer.innerHTML = '';
        chatContainer.appendChild(newChatInterface.getContainer());
        
        // Add updated welcome message
        const welcomeMessage = this.assistantService.getWelcomeMessage();
        newChatInterface.addMessage(welcomeMessage, false);
      }

      this.chatInterface = newChatInterface;
      
    } catch (error) {
      console.error('Failed to update chat assistant:', error);
    }
  }
}