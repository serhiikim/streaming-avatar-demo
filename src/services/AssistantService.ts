import { OpenAIAssistant } from "../openai-assistant";
import { AssistantStorage } from "../storage";

export class AssistantService {
  private static instance: AssistantService;
  private assistant: OpenAIAssistant | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.assistant) {
      return;
    }

    try {
      this.assistant = new OpenAIAssistant(
        import.meta.env.VITE_OPENAI_API_KEY,
        import.meta.env.VITE_OPENAI_ASSISTANT_ID
      );
      
      await this.assistant.initialize();
      this.isInitialized = true;
      
      console.log('AssistantService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AssistantService:', error);
      throw new Error('Assistant initialization failed');
    }
  }

  // Новый метод для полной переинициализации
  async reinitialize(): Promise<void> {
    console.log('AssistantService: Reinitializing...');
    
    // Сбросить состояние
    this.assistant = null;
    this.isInitialized = false;
    
    // Создать новый assistant напрямую (без проверки в initialize)
    try {
      this.assistant = new OpenAIAssistant(
        import.meta.env.VITE_OPENAI_API_KEY,
        import.meta.env.VITE_OPENAI_ASSISTANT_ID
      );
      
      await this.assistant.initialize();
      this.isInitialized = true;
      
      console.log('AssistantService: Reinitialized successfully');
    } catch (error) {
      console.error('Failed to reinitialize AssistantService:', error);
      throw new Error('Assistant reinitialization failed');
    }
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.assistant) {
      throw new Error('Assistant not initialized');
    }

    try {
      const response = await this.assistant.getResponse(message);
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to get assistant response');
    }
  }

  getWelcomeMessage(): string {
    return AssistantStorage.getOpeningIntroduction();
  }

  updateWelcomeMessage(message: string): void {
    AssistantStorage.updateOpeningIntroduction(message);
  }

  getAssistant(): OpenAIAssistant | null {
    return this.assistant;
  }

  isReady(): boolean {
    return this.isInitialized && this.assistant !== null;
  }

  // Update assistant configuration (used by SettingsPage)
  async updateConfiguration(newAssistant: OpenAIAssistant): Promise<void> {
    this.assistant = newAssistant;
    console.log('Assistant configuration updated');
  }
}