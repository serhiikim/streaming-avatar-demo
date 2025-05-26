import { AvatarSetup } from "../components/AvatarSetup";
import { AssistantService } from "../services/AssistantService";
import { NavigationService } from "../services/NavigationService";

export class SettingsPage {
  private container: HTMLElement;
  private avatarSetup: AvatarSetup | null = null;
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
              <span class="text-2xl">⚙️</span>
              <div>
                <h2 class="text-xl font-bold text-gray-800">Assistant Settings</h2>
                <p class="text-sm text-gray-600">Customize your AI assistant's behavior and personality</p>
              </div>
            </div>
            
            <div>
              <button class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300" data-route="home">
                <span>←</span>
                <span class="font-medium">Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="max-w-4xl mx-auto px-4 py-8">
        <!-- Info Section -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 class="text-lg font-semibold text-blue-800 mb-4">Configuration Options</h3>
          <div class="grid md:grid-cols-3 gap-4 text-sm text-blue-700">
            <div class="flex items-start space-x-2">
              <span class="text-blue-500 mt-0.5">📝</span>
              <div>
                <div class="font-medium">Opening Introduction</div>
                <div class="text-blue-600">The first message your assistant will say</div>
              </div>
            </div>
            <div class="flex items-start space-x-2">
              <span class="text-blue-500 mt-0.5">🧠</span>
              <div>
                <div class="font-medium">Behavior Instructions</div>
                <div class="text-blue-600">How your assistant should respond and interact</div>
              </div>
            </div>
            <div class="flex items-start space-x-2">
              <span class="text-blue-500 mt-0.5">⚡</span>
              <div>
                <div class="font-medium">Available Actions</div>
                <div class="text-blue-600">Functions your assistant can perform</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Settings Form Container -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div id="settingsFormContainer" class="p-8">
            <!-- AvatarSetup form will be inserted here -->
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
  }

  async initialize(): Promise<void> {
    // Only initialize once
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing SettingsPage...');
      
      // Create avatar setup component
      this.avatarSetup = new AvatarSetup({
        onSetupComplete: async () => {
          await this.handleSetupComplete();
        }
      });

      // Add form to settings container
      const formContainer = this.container.querySelector('#settingsFormContainer') as HTMLElement;
      if (formContainer && this.avatarSetup) {
        console.log('Adding form to container');
        formContainer.appendChild(this.avatarSetup.form);
      } else {
        console.error('Form container or avatarSetup not found', { formContainer, avatarSetup: this.avatarSetup });
      }

      this.initialized = true;
      console.log('SettingsPage initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize SettingsPage:', error);
      this.showError(`Failed to load settings form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async handleSetupComplete(): Promise<void> {
    try {
      console.log('SettingsPage: Configuration saved, reinitializing assistant...');
      
      await this.assistantService.reinitialize();
      
      // Show success message
      this.showSuccess('Configuration saved successfully!');
      
      // Redirect to home after short delay
      setTimeout(() => {
        this.navigationService.navigateTo('home');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
      this.showError('Failed to save configuration. Please try again.');
    }
  }

  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    // Remove existing notifications
    const existingNotifications = this.container.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 max-w-sm transform transition-all duration-300 translate-x-0`;
    
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
    
    notification.innerHTML = `
      <div class="${bgColor} border rounded-lg shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <span class="${iconColor} text-xl">${type === 'success' ? '✅' : '⚠️'}</span>
          <span class="${textColor} font-medium flex-1">${message}</span>
          <button class="text-gray-400 hover:text-gray-600 text-xl" onclick="this.closest('.notification').remove()">×</button>
        </div>
      </div>
    `;

    // Add to body (not settings container for proper positioning)
    document.body.appendChild(notification);

    // Auto-remove success notifications after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.classList.add('translate-x-full', 'opacity-0');
          setTimeout(() => notification.remove(), 300);
        }
      }, 3000);
    }
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    // Cleanup avatar setup if exists
    if (this.avatarSetup) {
      if (this.avatarSetup.form.parentNode) {
        this.avatarSetup.form.remove();
      }
      this.avatarSetup = null;
    }
    
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Reset form if needed
  reset(): void {
    if (this.avatarSetup) {
      this.avatarSetup.form.remove();
      this.avatarSetup = null;
    }
    
    // Reinitialize
    this.initialize();
  }
}