import { OpenAIAssistant } from "../openai-assistant";

interface ChatInterfaceProps {
  assistant: OpenAIAssistant;
  onMessageSent?: (message: string, response: string) => void;
}

export class ChatInterface {
  private container!: HTMLElement;
  private messagesContainer!: HTMLElement;
  private inputElement!: HTMLInputElement;
  private sendButton!: HTMLButtonElement;
  private assistant: OpenAIAssistant;
  private onMessageSent?: (message: string, response: string) => void;

  constructor(props: ChatInterfaceProps) {
    this.assistant = props.assistant;
    this.onMessageSent = props.onMessageSent;
    this.createInterface();
    this.setupEventListeners();
  }

  private createInterface() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'flex flex-col h-full bg-white rounded-xl shadow-sm';
    this.container.innerHTML = `
      <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chatMessages">
        <!-- Messages will be added here -->
      </div>
      <div class="border-t border-gray-200 p-4">
        <div class="flex space-x-3">
          <input
            type="text"
            id="chatInput"
            placeholder="Type your message here..."
            aria-label="Message input"
            class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300 resize-none"
          />
          <button id="sendButton" class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
            Send
          </button>
        </div>
      </div>
    `;

    // Get references to elements
    this.messagesContainer = this.container.querySelector('#chatMessages') as HTMLElement;
    this.inputElement = this.container.querySelector('#chatInput') as HTMLInputElement;
    this.sendButton = this.container.querySelector('#sendButton') as HTMLButtonElement;
  }

  private setupEventListeners() {
    // Send button click
    this.sendButton.addEventListener('click', () => this.handleSendMessage());
    
    // Enter key press
    this.inputElement.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.handleSendMessage();
      }
    });

    // Auto-resize input on typing
    this.inputElement.addEventListener('input', () => {
      this.inputElement.style.height = 'auto';
      this.inputElement.style.height = this.inputElement.scrollHeight + 'px';
    });
  }

  private async handleSendMessage() {
    const message = this.inputElement.value.trim();
    if (!message) return;

    try {
      // Disable input while processing
      this.setInputEnabled(false);
      
      // Add user message to chat
      this.addMessage(message, true);
      
      // Clear input
      this.inputElement.value = '';
      this.inputElement.style.height = 'auto';

      // Get response from assistant
      const response = await this.assistant.getResponse(message);
      
      // Add assistant response to chat
      this.addMessage(response, false);

      // Notify parent component
      if (this.onMessageSent) {
        this.onMessageSent(message, response);
      }

    } catch (error) {
      console.error('Error getting response:', error);
      this.addMessage('Sorry, there was an error processing your request.', false);
    } finally {
      // Re-enable input
      this.setInputEnabled(true);
      this.inputElement.focus();
    }
  }

  private setInputEnabled(enabled: boolean) {
    this.inputElement.disabled = !enabled;
    this.sendButton.disabled = !enabled;
    this.sendButton.textContent = enabled ? 'Send' : 'Sending...';
  }

  public addMessage(message: string, isUser: boolean) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
      isUser 
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' 
        : 'bg-gray-100 text-gray-800 rounded-bl-md'
    }`;
    
    // Create message text
    const textDiv = document.createElement('div');
    textDiv.className = 'text-sm leading-relaxed';
    textDiv.textContent = message;
    
    // Create timestamp
    const timeDiv = document.createElement('div');
    timeDiv.className = `text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`;
    timeDiv.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    messageContent.appendChild(textDiv);
    messageContent.appendChild(timeDiv);
    messageDiv.appendChild(messageContent);
    
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  private scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  public clear() {
    this.messagesContainer.innerHTML = '';
  }

  public focus() {
    this.inputElement.focus();
  }

  public addSystemMessage(message: string) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-center mb-4';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }
}