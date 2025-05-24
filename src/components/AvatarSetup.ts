import { OpenAIAssistant } from "../openai-assistant";
import { SetupForm } from "./forms/SetupForm";
import { AssistantConfigService, type AssistantConfig } from "../services/AssistantConfigService";

interface AvatarSetupProps {
  onSetupComplete: (assistant: OpenAIAssistant, openingIntro: string) => void;
}

export class AvatarSetup {
  public form!: HTMLElement;
  private setupForm!: SetupForm;
  private configService: AssistantConfigService;
  private setupCompleteCallback: (assistant: OpenAIAssistant, openingIntro: string) => void;

  constructor(props: AvatarSetupProps) {
    this.setupCompleteCallback = props.onSetupComplete;
    this.configService = AssistantConfigService.getInstance();
    this.initializeSetup();
  }

  private initializeSetup(): void {
    try {
      console.log('AvatarSetup: Starting initialization');
      
      // Get existing configuration
      const existingConfig = this.configService.getExistingConfig();
      console.log('AvatarSetup: Got existing config', existingConfig);
      
      // Create setup form
      this.setupForm = new SetupForm({
        onSubmit: this.handleSetupComplete.bind(this),
        onCancel: this.handleCancel.bind(this),
        initialValues: {
          openingIntro: existingConfig.openingIntro,
          // Other fields will be empty for now, could be extended
        },
        lastUpdated: existingConfig.lastUpdated
      });

      console.log('AvatarSetup: Created SetupForm');

      // Set form reference for backward compatibility
      this.form = this.setupForm.getContainer();
      
      console.log('AvatarSetup: Initialization complete');
    } catch (error) {
      console.error('AvatarSetup: Initialization failed:', error);
      throw error;
    }
  }

  private async handleSetupComplete(config: AssistantConfig): Promise<void> {
    try {
      // Save configuration using service
      const assistant = await this.configService.saveConfiguration(config);
      
      // Notify parent component
      this.setupCompleteCallback(assistant, config.openingIntro);
      
    } catch (error) {
      console.error('Setup completion failed:', error);
      throw error; // Let SetupForm handle the error display
    }
  }

  private handleCancel(): void {
    // Remove the form element
    if (this.form.parentNode) {
      this.form.remove();
    }
  }

  // Public methods for backward compatibility
  public remove(): void {
    if (this.form.parentNode) {
      this.form.remove();
    }
  }

  public focus(): void {
    this.setupForm.focus();
  }

  public reset(): void {
    this.setupForm.reset();
  }
}