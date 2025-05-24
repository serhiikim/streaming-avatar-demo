import { OpenAIAssistant } from "../openai-assistant";

interface ModeSelectorProps {
  onModeSelected: (mode: 'chat' | 'avatar', assistant: OpenAIAssistant) => void;
  onConfigureAvatar: () => void;
}

export class ModeSelector {
  public container!: HTMLElement;
  private onModeSelected: (mode: 'chat' | 'avatar', assistant: OpenAIAssistant) => void;
  private onConfigureAvatar: () => void;
  private assistant: OpenAIAssistant | null = null;

  constructor(props: ModeSelectorProps) {
    this.onModeSelected = props.onModeSelected;
    this.onConfigureAvatar = props.onConfigureAvatar;
    this.createInterface();
    this.initializeAssistant();
  }

  private createInterface() {
    this.container = document.createElement('div');
    this.container.className = 'mode-selector-container';
    this.container.innerHTML = `
      <div class="mode-selector-content">
        <h2>Choose Your Interaction Mode</h2>
        <p class="mode-selector-subtitle">How would you like to interact with your AI assistant?</p>
        
        <div class="mode-options">
          <div class="mode-option chat-option">
            <div class="mode-icon">💬</div>
            <h3>Chat Mode</h3>
            <p>Text-based conversation interface with instant responses</p>
            <div class="mode-features">
              <span class="feature">✓ Fast responses</span>
              <span class="feature">✓ Easy to use</span>
              <span class="feature">✓ Works everywhere</span>
            </div>
            <button class="mode-btn chat-btn" data-mode="chat">Start Chat</button>
          </div>

          <div class="mode-option avatar-option">
            <div class="mode-icon">🎭</div>
            <h3>Avatar Mode</h3>
            <p>Interactive AI avatar with voice and video capabilities</p>
            <div class="mode-features">
              <span class="feature">✓ Visual interaction</span>
              <span class="feature">✓ Voice responses</span>
              <span class="feature">✓ More engaging</span>
            </div>
            <button class="mode-btn avatar-btn" data-mode="avatar">Start Avatar</button>
          </div>
        </div>

        <div class="configuration-section">
          <div class="divider">
            <span>Advanced Options</span>
          </div>
          <button class="configure-btn secondary">
            <span class="icon">⚙️</span>
            Configure Assistant Behavior
          </button>
          <small>Customize your assistant's personality and available actions</small>
        </div>

        <div class="loading-section" style="display: none;">
          <div class="loading-spinner"></div>
          <p>Initializing assistant...</p>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Mode selection buttons
    const modeButtons = this.container.querySelectorAll('.mode-btn');
    modeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const mode = target.dataset.mode as 'chat' | 'avatar';
        this.handleModeSelection(mode);
      });
    });

    // Configure button
    const configureBtn = this.container.querySelector('.configure-btn');
    if (configureBtn) {
      configureBtn.addEventListener('click', () => {
        this.onConfigureAvatar();
      });
    }
  }

  private async initializeAssistant() {
    try {
      this.showLoading(true);
      
      // Initialize assistant with existing ID
      this.assistant = new OpenAIAssistant(
        import.meta.env.VITE_OPENAI_API_KEY,
        import.meta.env.VITE_OPENAI_ASSISTANT_ID
      );
      await this.assistant.initialize();
      
      this.showLoading(false);
      this.enableModeButtons(true);
      
    } catch (error) {
      console.error('Failed to initialize assistant:', error);
      this.showError('Failed to initialize assistant. Please check your configuration.');
    }
  }

  private handleModeSelection(mode: 'chat' | 'avatar') {
    if (!this.assistant) {
      this.showError('Assistant not ready. Please wait...');
      return;
    }

    this.onModeSelected(mode, this.assistant);
  }

  private showLoading(show: boolean) {
    const loadingSection = this.container.querySelector('.loading-section') as HTMLElement;
    const modeOptions = this.container.querySelector('.mode-options') as HTMLElement;
    const configSection = this.container.querySelector('.configuration-section') as HTMLElement;

    if (loadingSection && modeOptions && configSection) {
      if (show) {
        loadingSection.style.display = 'block';
        modeOptions.style.opacity = '0.5';
        configSection.style.opacity = '0.5';
      } else {
        loadingSection.style.display = 'none';
        modeOptions.style.opacity = '1';
        configSection.style.opacity = '1';
      }
    }
  }

  private enableModeButtons(enabled: boolean) {
    const modeButtons = this.container.querySelectorAll('.mode-btn') as NodeListOf<HTMLButtonElement>;
    modeButtons.forEach(button => {
      button.disabled = !enabled;
    });
  }

  private showError(message: string) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
      </div>
    `;
    
    // Remove existing error messages
    const existingError = this.container.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Add new error message
    const content = this.container.querySelector('.mode-selector-content');
    if (content) {
      content.appendChild(errorDiv);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  public remove() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}