export interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'password';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  onValidation?: (isValid: boolean, message?: string) => void;
}

export class FormField {
  private container!: HTMLElement;
  private inputElement!: HTMLInputElement | HTMLTextAreaElement;
  private props: FormFieldProps;
  private errorElement!: HTMLElement;

  constructor(props: FormFieldProps) {
    this.props = props;
    this.createComponent();
    this.setupEventListeners();
    
    // Set initial value if provided
    if (props.value) {
      this.setValue(props.value);
    }
  }

  private createComponent(): void {
    this.container = document.createElement('div');
    this.container.className = 'form-field space-y-2';
    
    this.render();
  }

  private render(): void {
    const { id, label, type, placeholder, helpText, required, minLength, maxLength, rows } = this.props;
    
    this.container.innerHTML = `
      <label for="${id}" class="block text-sm font-semibold text-gray-700">
        ${label}
        ${required ? '<span class="text-red-500 ml-1">*</span>' : ''}
      </label>
      
      ${type === 'textarea' 
        ? `<textarea 
             id="${id}" 
             name="${id}"
             placeholder="${placeholder || ''}" 
             ${required ? 'required' : ''}
             ${minLength ? `minlength="${minLength}"` : ''}
             ${maxLength ? `maxlength="${maxLength}"` : ''}
             rows="${rows || 4}"
             class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300 resize-none"
           ></textarea>`
        : `<input 
             type="${type}" 
             id="${id}" 
             name="${id}"
             placeholder="${placeholder || ''}" 
             ${required ? 'required' : ''}
             ${minLength ? `minlength="${minLength}"` : ''}
             ${maxLength ? `maxlength="${maxLength}"` : ''}
             class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
           />`
      }
      
      ${helpText ? `<p class="text-sm text-gray-500">${helpText}</p>` : ''}
      
      <div class="error-message text-sm text-red-600 hidden" role="alert"></div>
    `;

    // Get references
    this.inputElement = this.container.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement;
    this.errorElement = this.container.querySelector('.error-message') as HTMLElement;
  }

  private setupEventListeners(): void {
    // Input change event
    this.inputElement.addEventListener('input', () => {
      const value = this.inputElement.value;
      
      // Notify parent of value change (for form-level validation)
      if (this.props.onChange) {
        this.props.onChange(value);
      }
      
      // Don't auto-validate on input, only on blur
    });

    // Blur event for validation (only validate individual field)
    this.inputElement.addEventListener('blur', () => {
      this.validateField();
    });
  }

  private validateField(): { isValid: boolean; message?: string } {
    const value = this.inputElement.value.trim();
    const { required, minLength, maxLength, label } = this.props;
    
    // Required validation
    if (required && !value) {
      return this.showError(`${label} is required`);
    }
    
    // Min length validation
    if (minLength && value.length > 0 && value.length < minLength) {
      return this.showError(`${label} must be at least ${minLength} characters`);
    }
    
    // Max length validation
    if (maxLength && value.length > maxLength) {
      return this.showError(`${label} must be no more than ${maxLength} characters`);
    }
    
    // All validations passed
    this.hideError();
    const result = { isValid: true };
    
    // Don't call onValidation to prevent loops
    // if (this.props.onValidation) {
    //   this.props.onValidation(true);
    // }
    
    return result;
  }

  private showError(message: string): { isValid: boolean; message: string } {
    this.errorElement.textContent = message;
    this.errorElement.classList.remove('hidden');
    this.inputElement.classList.add('border-red-500', 'focus:ring-red-500');
    this.inputElement.classList.remove('border-gray-300', 'focus:ring-primary');
    
    // Don't call onValidation to prevent loops
    // if (this.props.onValidation) {
    //   this.props.onValidation(false, message);
    // }
    
    return { isValid: false, message };
  }

  private hideError(): void {
    this.errorElement.classList.add('hidden');
    this.inputElement.classList.remove('border-red-500', 'focus:ring-red-500');
    this.inputElement.classList.add('border-gray-300', 'focus:ring-primary');
  }

  getValue(): string {
    return this.inputElement.value.trim();
  }

  setValue(value: string): void {
    // Temporarily remove event listeners to prevent recursion
    const oldValue = this.inputElement.value;
    this.inputElement.value = value;
    
    // Only validate if value actually changed
    if (oldValue !== value) {
      this.validateField();
    }
  }

  focus(): void {
    this.inputElement.focus();
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  validate(): { isValid: boolean; message?: string } {
    return this.validateField();
  }

  setEnabled(enabled: boolean): void {
    this.inputElement.disabled = !enabled;
    if (enabled) {
      this.inputElement.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      this.inputElement.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }
}