import { ChatInterface } from "../components/ChatInterface";
import { AssistantService } from "../services/AssistantService";
import { NavigationService } from "../services/NavigationService";

export class ChatPage {
  private container: HTMLElement;
  private chatInterface: ChatInterface | null = null;
  private assistantService: AssistantService;
  private navigationService: NavigationService;

  constructor() {
    this.assistantService = AssistantService.getInstance();
    this.navigationService = NavigationService.getInstance();
    this.container = this.createContainer();
    this.render();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'page-container chat-page';
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }

  private render(): void {
    this.container.innerHTML = `
      <header class="page-header">
        <div class="header-content">
          <div class="page-title">
            <h2>💬 Chat Mode</h2>
            <p>Text-based conversation with your AI assistant</p>
          </div>
          <div class="page-actions">
            <button class="nav-button avatar-button" data-route="avatar">
              <span class="icon">🎭</span>
              Switch to Avatar
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
      
      <main class="chat-layout">
        <div class="chat-section">
          <div id="chatContainer" class="chat-container-full"></div>
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

      console.log('ChatPage initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize ChatPage:', error);
      this.showError('Failed to initialize chat interface.');
    }
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