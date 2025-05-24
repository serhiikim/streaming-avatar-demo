import { FormField } from "./FormField";
import { ActionSelector } from "./ActionSelector";
import type { AssistantConfig } from "../../services/AssistantConfigService";

export interface SetupFormProps {
  onSubmit: (config: AssistantConfig) => Promise<void>;
  onCancel: () => void;
  initialValues?: Partial<AssistantConfig>;
  lastUpdated?: string | null;
}

export class SetupForm {
  private container!: HTMLElement;
  private openingIntroField!: FormField;
  private behaviorField!: FormField;
  private actionSelector!: ActionSelector;
  private submitButton!: HTMLButtonElement;
  private cancelButton!: HTMLButtonElement;
  
  private props: SetupFormProps;
  private isValid = false;
  private isSubmitting = false;
  private isValidating = false; // Add this to prevent recursion

  constructor(props: SetupFormProps) {
    this.props = props;
    this.createComponent();
    this.setupFormFields();
    this.setupEventListeners();
    this.loadInitialValues();
  }

  private createComponent(): void {
    this.container = document.createElement('form');
    this.container.className = 'setup-form max-w-4xl mx-auto';
    
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Configure Your Avatar</h2>
          <p class="text-gray-600">Customize your AI assistant's behavior and personality</p>
        </div>
        
        <!-- Form Fields Container -->
        <div class="space-y-6">
          <div id="openingIntroContainer"></div>
          <div id="behaviorContainer"></div>
          <div id="actionsContainer"></div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button type="button" class="cancel-btn px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium">
            Cancel
          </button>
          <button type="submit" class="submit-btn px-6 py-3 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium" disabled>
            Save & Apply
          </button>
        </div>

        <!-- Config Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div class="grid md:grid-cols-2 gap-4 text-sm">
            <div class="flex items-center space-x-2 text-blue-700">
              <span class="text-blue-500">💾</span>
              <span>Configuration will be saved locally for future use</span>
            </div>
            <div class="flex items-center space-x-2 text-blue-700">
              <span class="text-blue-500">🔄</span>
              <span id="lastUpdatedText">${this.getLastUpdatedText()}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Get button references
    this.submitButton = this.container.querySelector('.submit-btn') as HTMLButtonElement;
    this.cancelButton = this.container.querySelector('.cancel-btn') as HTMLButtonElement;
  }

  private setupFormFields(): void {
    // Opening Introduction Field
    this.openingIntroField = new FormField({
      id: 'openingIntro',
      label: 'Opening Introduction',
      type: 'textarea',
      placeholder: 'Write a friendly greeting that your avatar will use when starting a conversation...',
      helpText: 'This will be the first thing your avatar says when starting a new session',
      required: true,
      minLength: 10,
      rows: 4,
      onChange: () => this.validateForm()
      // Remove onValidation to break the loop
    });

    // Behavior Instructions Field
    this.behaviorField = new FormField({
      id: 'fullPrompt',
      label: 'Avatar Behavior Instructions',
      type: 'textarea',
      placeholder: 'Describe how you want your avatar to behave, respond to questions, and interact with users...',
      helpText: 'These instructions will guide your avatar\'s personality and response style',
      required: true,
      minLength: 20,
      rows: 6,
      onChange: () => this.validateForm()
      // Remove onValidation to break the loop
    });

    // Action Selector
    this.actionSelector = new ActionSelector({
      actions: [
        {
          id: 'callHuman',
          title: 'Call to Human',
          description: 'Allow avatar to request human assistance',
          icon: '📞'
        },
        {
          id: 'scheduleMeeting',
          title: 'Schedule Meeting',
          description: 'Enable meeting scheduling capabilities',
          icon: '📅'
        },
        {
          id: 'showSlide',
          title: 'Show Slides',
          description: 'Allow avatar to display presentation slides',
          icon: '📊'
        }
      ],
      onChange: () => this.validateForm()
    });

    // Add fields to containers
    const openingIntroContainer = this.container.querySelector('#openingIntroContainer');
    const behaviorContainer = this.container.querySelector('#behaviorContainer');
    const actionsContainer = this.container.querySelector('#actionsContainer');

    if (openingIntroContainer) openingIntroContainer.appendChild(this.openingIntroField.getContainer());
    if (behaviorContainer) behaviorContainer.appendChild(this.behaviorField.getContainer());
    if (actionsContainer) actionsContainer.appendChild(this.actionSelector.getContainer());
  }

  private setupEventListeners(): void {
    // Form submission
    this.container.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Cancel button
    this.cancelButton.addEventListener('click', () => {
      this.props.onCancel();
    });
  }

  private loadInitialValues(): void {
    if (this.props.initialValues) {
      const { openingIntro, fullPrompt, actions } = this.props.initialValues;
      
      if (openingIntro) {
        this.openingIntroField.setValue(openingIntro);
      }
      
      if (fullPrompt) {
        this.behaviorField.setValue(fullPrompt);
      }
      
      if (actions) {
        const selectedActions = Object.entries(actions)
          .filter(([_, enabled]) => enabled)
          .map(([action]) => action);
        this.actionSelector.setSelectedActions(selectedActions);
      }
    }
    
    this.validateForm();
  }

  private validateForm(): void {
    // Prevent recursion during validation
    if (this.isValidating) return;
    this.isValidating = true;
    
    // Get current values and check basic requirements
    const openingIntroValue = this.openingIntroField.getValue();
    const behaviorValue = this.behaviorField.getValue();
    
    const openingIntroValid = openingIntroValue.length >= 10;
    const behaviorValid = behaviorValue.length >= 20;
    
    this.isValid = openingIntroValid && behaviorValid;
    this.submitButton.disabled = !this.isValid || this.isSubmitting;
    
    this.isValidating = false;
  }

  private async handleSubmit(): Promise<void> {
    if (!this.isValid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.setFormEnabled(false);
    this.showSubmittingState();

    try {
      const config: AssistantConfig = {
        openingIntro: this.openingIntroField.getValue(),
        fullPrompt: this.behaviorField.getValue(),
        actions: this.getSelectedActionsConfig()
      };

      await this.props.onSubmit(config);
      
    } catch (error) {
      console.error('Form submission failed:', error);
      this.showError('Failed to save configuration. Please try again.');
    } finally {
      this.isSubmitting = false;
      this.setFormEnabled(true);
      this.hideSubmittingState();
    }
  }

  private getSelectedActionsConfig(): AssistantConfig['actions'] {
    const selectedActions = this.actionSelector.getSelectedActions();
    return {
      callHuman: selectedActions.includes('callHuman'),
      scheduleMeeting: selectedActions.includes('scheduleMeeting'),
      showSlide: selectedActions.includes('showSlide')
    };
  }

  private setFormEnabled(enabled: boolean): void {
    this.openingIntroField.setEnabled(enabled);
    this.behaviorField.setEnabled(enabled);
    this.cancelButton.disabled = !enabled;
    
    if (enabled) {
      this.cancelButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      this.cancelButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  private showSubmittingState(): void {
    this.submitButton.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>Saving...</span>
      </div>
    `;
  }

  private hideSubmittingState(): void {
    this.submitButton.innerHTML = 'Save & Apply';
  }

  private showError(message: string): void {
    // Remove existing error
    const existingError = this.container.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4';
    errorDiv.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-red-500">⚠️</span>
        <span>${message}</span>
      </div>
    `;

    // Insert before form actions
    const formActions = this.container.querySelector('.flex.justify-end');
    if (formActions) {
      formActions.parentNode?.insertBefore(errorDiv, formActions);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  private getLastUpdatedText(): string {
    if (!this.props.lastUpdated) {
      return 'No previous configuration found';
    }

    const lastUpdated = new Date(this.props.lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Last updated: ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `Last updated: ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Last updated: Just now';
    }
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  focus(): void {
    this.openingIntroField.focus();
  }

  reset(): void {
    this.openingIntroField.setValue('');
    this.behaviorField.setValue('');
    this.actionSelector.setSelectedActions([]);
    this.validateForm();
  }
}