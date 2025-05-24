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
    container.className = 'min-h-screen bg-gray-50';
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }

  private render(): void {
    this.container.innerHTML = `
      <main class="max-w-6xl mx-auto px-4 py-8">
        <!-- Welcome Section -->
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">Welcome to Your AI Assistant</h2>
          <p class="text-xl text-gray-600">Choose how you'd like to interact with your assistant today.</p>
        </div>
        
        <!-- Mode Selection Cards -->
        <div class="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          <!-- Chat Mode Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="text-6xl mb-6 text-center">💬</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4 text-center">Chat Mode</h3>
            <p class="text-gray-600 mb-6 text-center">Text-based conversation interface with instant responses</p>
            
            <div class="space-y-2 mb-8">
              <div class="flex items-center text-green-600">
                <span class="mr-3">✓</span>
                <span>Fast responses</span>
              </div>
              <div class="flex items-center text-green-600">
                <span class="mr-3">✓</span>
                <span>Easy to use</span>
              </div>
              <div class="flex items-center text-green-600">
                <span class="mr-3">✓</span>
                <span>Works everywhere</span>
              </div>
            </div>
            
            <button class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105" data-route="chat">
              Start Chat
            </button>
          </div>
          
          <!-- Avatar Mode Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="text-6xl mb-6 text-center">🎭</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4 text-center">Avatar Mode</h3>
            <p class="text-gray-600 mb-6 text-center">Interactive AI avatar with voice and video capabilities</p>
            
            <div class="space-y-2 mb-8">
              <div class="flex items-center text-green-600">
                <span class="mr-3">✓</span>
                <span>Visual interaction</span>
              </div>
              <div class="flex items-center text-green-600">
                <span class="mr-3">✓</span>
                <span>Voice responses</span>
              </div>
              <div class="flex items-center text-green-600">
                <span class="mr-3">✓</span>
                <span>More engaging</span>
              </div>
            </div>
            
            <button class="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-105" data-route="avatar">
              Start Avatar
            </button>
          </div>
        </div>

        <!-- Settings Section -->
        <div class="text-center">
          <div class="inline-flex items-center justify-center space-x-4 bg-white rounded-xl shadow-md px-6 py-4 hover:shadow-lg transition-all duration-300">
            <button class="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors" data-route="settings">
              <span class="text-xl">⚙️</span>
              <span class="font-medium">Configure Assistant</span>
            </button>
          </div>
          <p class="text-gray-500 text-sm mt-3">Customize your assistant's personality and available actions</p>
        </div>

        <!-- Loading Section -->
        <div class="loading-section fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="display: none;">
          <div class="bg-white rounded-xl p-8 max-w-sm mx-4 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p id="loadingMessage" class="text-gray-700 font-medium">Initializing assistant...</p>
          </div>
        </div>
      </main>
    `;
  }

  private setupEventListeners(): void {
    console.log('HomePage: Setting up event listeners');
    
    // Mode selection buttons
    const modeButtons = this.container.querySelectorAll('[data-route]');
    console.log('HomePage: Found buttons with data-route:', modeButtons.length);
    
    modeButtons.forEach((button, index) => {
      const route = button.getAttribute('data-route');
      console.log(`HomePage: Button ${index} has route:`, route);
      
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target as HTMLElement;
        const clickedRoute = target.dataset.route || target.closest('[data-route]')?.getAttribute('data-route');
        
        console.log('HomePage: Button clicked, route:', clickedRoute);
        
        if (clickedRoute === 'chat' || clickedRoute === 'avatar') {
          await this.handleModeSelection(clickedRoute);
        } else if (clickedRoute === 'settings') {
          console.log('HomePage: Navigating to settings via NavigationService');
          this.navigationService.navigateTo('settings');
        } else {
          console.warn('HomePage: Unknown route:', clickedRoute);
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