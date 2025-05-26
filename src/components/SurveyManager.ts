export interface SurveyConfig {
    enabled: boolean;
    questions: string[];
  }
  
  export class SurveyManager {
    private container: HTMLElement;
    private config: SurveyConfig;
    private onConfigChange: (config: SurveyConfig) => void;
  
    constructor(container: HTMLElement, initialConfig: SurveyConfig, onConfigChange: (config: SurveyConfig) => void) {
      this.container = container;
      this.config = { ...initialConfig };
      this.onConfigChange = onConfigChange;
      this.render();
    }
  
    private render(): void {
      this.container.innerHTML = `
        <div class="space-y-6">
          <!-- Section Header -->
          <div class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-medium text-gray-900">Mandatory Survey</h3>
            <p class="text-sm text-gray-600 mt-1">
              Configure questions that users must answer before starting the conversation
            </p>
          </div>
  
          <!-- Survey Toggle -->
          <div class="flex items-center justify-between">
            <div>
              <label for="survey-enabled" class="text-sm font-medium text-gray-700">
                Enable Mandatory Survey
              </label>
              <p class="text-xs text-gray-500 mt-1">
                Users will be required to answer all questions before proceeding
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="survey-enabled"
                class="sr-only peer" 
                ${this.config.enabled ? 'checked' : ''}
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
  
          <!-- Questions Section -->
          <div id="questions-section" class="${this.config.enabled ? '' : 'hidden'}">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-700">Survey Questions</h4>
                <button 
                  id="add-question-btn"
                  type="button"
                  class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Add Question
                </button>
              </div>
              
              <div id="questions-list" class="space-y-3">
                <!-- Questions will be rendered here -->
              </div>
  
              ${this.config.questions.length === 0 ? `
                <div class="text-center py-8 text-gray-500">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="mt-2 text-sm">No questions added yet</p>
                  <p class="text-xs text-gray-400">Click "Add Question" to get started</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
  
      this.attachEventListeners();
      this.renderQuestions();
    }
  
    private attachEventListeners(): void {
      // Toggle survey enabled/disabled
      const toggleCheckbox = this.container.querySelector('#survey-enabled') as HTMLInputElement;
      toggleCheckbox?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.config.enabled = target.checked;
        
        const questionsSection = this.container.querySelector('#questions-section');
        if (questionsSection) {
          questionsSection.classList.toggle('hidden', !this.config.enabled);
        }
        
        // Auto-enable submitSurveyData action when survey is enabled
        this.onConfigChange(this.config);
      });
  
      // Add question button
      const addBtn = this.container.querySelector('#add-question-btn');
      addBtn?.addEventListener('click', () => {
        this.addQuestion();
      });
    }
  
    private renderQuestions(): void {
      const questionsList = this.container.querySelector('#questions-list');
      if (!questionsList) return;
  
      const questionsHTML = this.config.questions.map((question, index) => `
        <div class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200" data-index="${index}">
          <div class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
            ${index + 1}
          </div>
          <div class="flex-1 min-w-0">
            <textarea 
              class="question-input w-full p-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Enter your question here..."
              data-index="${index}"
            >${question}</textarea>
          </div>
          <button 
            type="button"
            class="remove-question flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
            data-index="${index}"
            title="Remove question"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `).join('');
  
      questionsList.innerHTML = questionsHTML;
  
      // Attach question-specific event listeners
      this.attachQuestionEventListeners();
    }
  
    private attachQuestionEventListeners(): void {
      // Question input changes
      this.container.querySelectorAll('.question-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLTextAreaElement;
          const index = parseInt(target.dataset.index || '0');
          this.config.questions[index] = target.value;
          this.onConfigChange(this.config);
        });
  
        // Auto-resize textarea
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        });
      });
  
      // Remove question buttons
      this.container.querySelectorAll('.remove-question').forEach(button => {
        button.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const index = parseInt(target.closest('.remove-question')?.getAttribute('data-index') || '0');
          this.removeQuestion(index);
        });
      });
    }
  
    private addQuestion(): void {
      this.config.questions.push('');
      this.onConfigChange(this.config);
      this.renderQuestions();
      
      // Focus on the new question input
      setTimeout(() => {
        const newInput = this.container.querySelector(`[data-index="${this.config.questions.length - 1}"] .question-input`) as HTMLTextAreaElement;
        newInput?.focus();
      }, 0);
    }
  
    private removeQuestion(index: number): void {
      this.config.questions.splice(index, 1);
      this.onConfigChange(this.config);
      this.renderQuestions();
    }
  
    public updateConfig(config: SurveyConfig): void {
      this.config = { ...config };
      this.render();
    }
  
    public getConfig(): SurveyConfig {
      return { ...this.config };
    }
  
    public getContainer(): HTMLElement {
      return this.container;
    }
  }