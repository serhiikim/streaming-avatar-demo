export interface ActionConfig {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface ActionSelectorProps {
  actions: ActionConfig[];
  selectedActions?: string[];
  onChange: (selectedActions: string[]) => void;
  onSubmitSurveyDataChange?: (enabled: boolean) => void; // New callback
}

export class ActionSelector {
  private container!: HTMLElement;
  private actions: ActionConfig[];
  private selectedActions: Set<string> = new Set();
  private onChange: (selectedActions: string[]) => void;
  private onSubmitSurveyDataChange?: (enabled: boolean) => void;

  constructor(props: ActionSelectorProps) {
    this.actions = props.actions;
    this.onChange = props.onChange;
    this.onSubmitSurveyDataChange = props.onSubmitSurveyDataChange;
    
    if (props.selectedActions) {
      this.selectedActions = new Set(props.selectedActions);
    }
    
    this.createComponent();
    this.setupEventListeners();
  }

  private createComponent(): void {
    this.container = document.createElement('div');
    this.container.className = 'action-selector';
    
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="space-y-4">
        <label class="block text-sm font-semibold text-gray-700">Available Actions</label>
        <div class="grid md:grid-cols-2 gap-4">
          ${this.actions.map(action => this.renderActionCard(action)).join('')}
        </div>
      </div>
    `;
  }

  private renderActionCard(action: ActionConfig): string {
    const isSelected = this.selectedActions.has(action.id);
    const isSubmitSurvey = action.id === 'submitSurveyData';
    
    return `
      <label class="action-card flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'border-primary bg-blue-50' 
          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      } ${isSubmitSurvey ? 'md:col-span-2' : ''}" data-action="${action.id}">
        <input 
          type="checkbox" 
          name="actions" 
          value="${action.id}" 
          class="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          ${isSelected ? 'checked' : ''}
        >
        <div class="flex-1">
          <div class="font-medium text-gray-800 flex items-center space-x-2">
            ${action.icon ? `<span>${action.icon}</span>` : ''}
            <span>${action.title}</span>
          </div>
          <div class="text-sm text-gray-600 mt-1">${action.description}</div>
          ${isSubmitSurvey ? `
            <div class="text-xs text-blue-600 mt-2 flex items-center space-x-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Enabling this will show survey questions configuration below</span>
            </div>
          ` : ''}
        </div>
      </label>
    `;
  }

  private setupEventListeners(): void {
    this.container.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      
      if (target.type === 'checkbox' && target.name === 'actions') {
        const actionId = target.value;
        
        if (target.checked) {
          this.selectedActions.add(actionId);
        } else {
          this.selectedActions.delete(actionId);
        }
        
        // Update visual state
        this.updateCardVisualState(actionId, target.checked);
        
        // Special handling for submitSurveyData
        if (actionId === 'submitSurveyData' && this.onSubmitSurveyDataChange) {
          this.onSubmitSurveyDataChange(target.checked);
        }
        
        // Notify parent component
        this.onChange(Array.from(this.selectedActions));
      }
    });
  }

  private updateCardVisualState(actionId: string, isSelected: boolean): void {
    const card = this.container.querySelector(`[data-action="${actionId}"]`) as HTMLElement;
    if (card) {
      if (isSelected) {
        card.className = card.className.replace('border-gray-200 hover:bg-gray-50 hover:border-gray-300', 'border-primary bg-blue-50');
      } else {
        card.className = card.className.replace('border-primary bg-blue-50', 'border-gray-200 hover:bg-gray-50 hover:border-gray-300');
      }
    }
  }

  getSelectedActions(): string[] {
    return Array.from(this.selectedActions);
  }

  setSelectedActions(actions: string[]): void {
    const wasSubmitSurveySelected = this.selectedActions.has('submitSurveyData');
    this.selectedActions = new Set(actions);
    const isSubmitSurveySelected = this.selectedActions.has('submitSurveyData');
    
    // Check if submitSurveyData state changed
    if (wasSubmitSurveySelected !== isSubmitSurveySelected && this.onSubmitSurveyDataChange) {
      this.onSubmitSurveyDataChange(isSubmitSurveySelected);
    }
    
    // Update visual state
    this.updateVisualState();
  }
  
  private updateVisualState(): void {
    // Update checkboxes and visual state without full re-render
    this.actions.forEach(action => {
      const checkbox = this.container.querySelector(`input[value="${action.id}"]`) as HTMLInputElement;
      const card = this.container.querySelector(`[data-action="${action.id}"]`) as HTMLElement;
      
      if (checkbox && card) {
        const isSelected = this.selectedActions.has(action.id);
        checkbox.checked = isSelected;
        this.updateCardVisualState(action.id, isSelected);
      }
    });
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  validate(): { isValid: boolean; message?: string } {
    return { isValid: true }; // Actions are optional
  }
}