import { AvatarSetup } from "../components/AvatarSetup";
import { AssistantService } from "../services/AssistantService";
import { NavigationService } from "../services/NavigationService";

export class SettingsPage {
  private container: HTMLElement;
  private avatarSetup: AvatarSetup | null = null;
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
    container.className = 'page-container settings-page';
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }

  private render(): void {
    this.container.innerHTML = `
      <header class="page-header">
        <div class="header-content">
          <div class="page-title">
            <h2>⚙️ Assistant Settings</h2>
            <p>Customize your AI assistant's behavior and personality</p>
          </div>
          <div class="page-actions">
            <button class="nav-button back-button" data-route="home">
              <span class="icon">←</span>
              Back to Home
            </button>
          </div>
        </div>
      </header>
      
      <main class="settings-layout">
        <div class="settings-container">
          <div class="settings-info">
            <div class="info-card">
              <h3>Configuration Options</h3>
              <ul>
                <li><strong>Opening Introduction:</strong> The first message your assistant will say</li>
                <li><strong>Behavior Instructions:</strong> How your assistant should respond and interact</li>
                <li><strong>Available Actions:</strong> Functions your assistant can perform</li>
              </ul>
            </div>
          </div>
          
          <div id="settingsFormContainer" class="settings-form-container">
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
    try {
      // Create avatar setup component
      this.avatarSetup = new AvatarSetup({
        onSetupComplete: async (assistant, openingIntro) => {
          await this.handleSetupComplete(assistant, openingIntro);
        }
      });

      // Add form to settings container
      const formContainer = this.container.querySelector('#settingsFormContainer') as HTMLElement;
      if (formContainer && this.avatarSetup) {
        formContainer.appendChild(this.avatarSetup.form);
      }

      console.log('SettingsPage initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize SettingsPage:', error);
      this.showError('Failed to load settings form.');
    }
  }

  private async handleSetupComplete(assistant: any, openingIntro: string): Promise<void> {
    try {
      // Update assistant service
      await this.assistantService.updateConfiguration(assistant);
      
      // Update welcome message in storage
      this.assistantService.updateWelcomeMessage(openingIntro);
      
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
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✅' : '⚠️'}</span>
        <span class="notification-text">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add to top of settings container
    const settingsContainer = this.container.querySelector('.settings-container');
    if (settingsContainer) {
      settingsContainer.insertBefore(notification, settingsContainer.firstChild);
    }

    // Auto-remove success notifications after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
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