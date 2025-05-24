// Storage utility for managing assistant configuration
export interface AssistantConfig {
    openingIntroduction: string;
    lastUpdated: string;
    assistantId: string;
  }
  
  const STORAGE_KEY = 'assistant_config';
  const DEFAULT_OPENING_INTRO = "Hello! I'm your AI assistant. How can I help you today?";
  
  export class AssistantStorage {
    
    static saveConfig(config: Partial<AssistantConfig>): void {
      try {
        const existingConfig = this.getConfig();
        const updatedConfig: AssistantConfig = {
          ...existingConfig,
          ...config,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
        console.log('Assistant config saved:', updatedConfig);
      } catch (error) {
        console.error('Failed to save assistant config:', error);
      }
    }
  
    static getConfig(): AssistantConfig {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const config = JSON.parse(stored) as AssistantConfig;
          return {
            openingIntroduction: config.openingIntroduction || DEFAULT_OPENING_INTRO,
            lastUpdated: config.lastUpdated || new Date().toISOString(),
            assistantId: config.assistantId || import.meta.env.VITE_OPENAI_ASSISTANT_ID
          };
        }
      } catch (error) {
        console.error('Failed to load assistant config:', error);
      }
  
      // Return default config
      return {
        openingIntroduction: DEFAULT_OPENING_INTRO,
        lastUpdated: new Date().toISOString(),
        assistantId: import.meta.env.VITE_OPENAI_ASSISTANT_ID
      };
    }
  
    static getOpeningIntroduction(): string {
      return this.getConfig().openingIntroduction;
    }
  
    static updateOpeningIntroduction(intro: string): void {
      this.saveConfig({ openingIntroduction: intro });
    }
  
    static clearConfig(): void {
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Assistant config cleared');
      } catch (error) {
        console.error('Failed to clear assistant config:', error);
      }
    }
  
    static hasConfig(): boolean {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored !== null;
      } catch (error) {
        return false;
      }
    }
  
    static getConfigAge(): number {
      const config = this.getConfig();
      const lastUpdated = new Date(config.lastUpdated);
      const now = new Date();
      return now.getTime() - lastUpdated.getTime();
    }
  
    static isConfigRecent(maxAgeHours: number = 24): boolean {
      const ageMs = this.getConfigAge();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      return ageMs < maxAgeMs;
    }
  }