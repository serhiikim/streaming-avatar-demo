import { NavigationService } from "../services/NavigationService";
import { AssistantService } from "../services/AssistantService";

export class HomePage {
  private container: HTMLElement;
  private navigationService: NavigationService;
  private assistantService: AssistantService;

  constructor() {
    this.navigationService = NavigationService.getInstance();
    this.assistantService = AssistantService.getInstance();
    this.container = this.createContainer();
    this.render();
    this.setupEventListeners();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'page-container home-page';
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }

  private render(): void {
    this.container.innerHTML = `
      <main class="home-content">
        <div class="welcome-section">
          <h2>Welcome to Your AI Assistant</h2>
          <p>Choose how you'd like to interact with your assistant today.</p>
        </div>
        
        <div class="mode-selection">
          <div class="mode-card chat-card">
            <div class="mode-icon">💬</div>
            <h3>Chat Mode</h3>
            <p>Text-based conversation interface with instant responses</p>
            <div class="mode-features">
              <span class="feature">✓ Fast responses</span>
              <span class="feature">✓ Easy to use</span>
              <span class="feature">✓ Works everywhere</span>
            </div>
            <button class="mode-button chat-button" data-route="chat">Start Chat</button>
          </div>
          
          <div class="mode-card avatar-card">
            <div class="mode-icon">🎭</div>
            <h3>Avatar Mode</h3>
            <p>Interactive AI avatar with voice and video capabilities</p>
            <div class="mode-features">
              <span class="feature">✓ Visual interaction</span>
              <span class="feature">✓ Voice responses</span>
              <span class="feature">✓ More engaging</span>
            </div>
            <button class="mode-button avatar-button" data-route="avatar">Start Avatar</button>
          </div>
        </div>

        <div class="quick-actions">
          <button class="settings-link" data-route="settings">
            <span class="icon">⚙️</span>
            Configure Assistant
          </button>
        </div>

        <div class="loading-section" style="display: none;">
          <div class="loading-spinner"></div>
          <p id="loadingMessage">Initializing assistant...</p>
        </div>
      </main>
    `;
  }

  private setupEventListeners(): void {
    // Mode selection buttons
    const modeButtons = this.container.querySelectorAll('[data-route]');
    modeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const route = target.dataset.route;
        
        if (route === 'chat' || route === 'avatar') {
          await this.handleModeSelection(route);
        } else if (route === 'settings') {
          this.navigationService.navigateTo('settings');
        }
      });
    });
  }

  private async handleModeSelection(mode: 'chat' | 'avatar'): Promise<void> {
    try {
      this.showLoading('Initializing assistant...');
      
      // Initialize assistant service if not ready
      if (!this.assistantService.isReady()) {
        await this.assistantService.initialize();
      }
      
      this.hideLoading();
      
      // Navigate to selected mode
      this.navigationService.navigateTo(mode);
      
    } catch (error) {
      console.error('Failed to initialize assistant:', error);
      this.hideLoading();
      this.showError('Failed to initialize assistant. Please check your configuration.');
    }
  }

  private showLoading(message: string): void {
    const loadingSection = this.container.querySelector('.loading-section') as HTMLElement;
    const loadingMessage = this.container.querySelector('#loadingMessage') as HTMLElement;
    const modeSelection = this.container.querySelector('.mode-selection') as HTMLElement;
    const quickActions = this.container.querySelector('.quick-actions') as HTMLElement;

    if (loadingSection && loadingMessage && modeSelection && quickActions) {
      loadingMessage.textContent = message;
      loadingSection.style.display = 'block';
      modeSelection.style.opacity = '0.5';
      quickActions.style.opacity = '0.5';
      
      // Disable buttons
      const buttons = this.container.querySelectorAll('button');
      buttons.forEach(btn => (btn as HTMLButtonElement).disabled = true);
    }
  }

  private hideLoading(): void {
    const loadingSection = this.container.querySelector('.loading-section') as HTMLElement;
    const modeSelection = this.container.querySelector('.mode-selection') as HTMLElement;
    const quickActions = this.container.querySelector('.quick-actions') as HTMLElement;

    if (loadingSection && modeSelection && quickActions) {
      loadingSection.style.display = 'none';
      modeSelection.style.opacity = '1';
      quickActions.style.opacity = '1';
      
      // Enable buttons
      const buttons = this.container.querySelectorAll('button');
      buttons.forEach(btn => (btn as HTMLButtonElement).disabled = false);
    }
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
      </div>
    `;
    
    // Remove existing errors
    const existingError = this.container.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error
    const welcomeSection = this.container.querySelector('.welcome-section');
    if (welcomeSection) {
      welcomeSection.appendChild(errorDiv);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}