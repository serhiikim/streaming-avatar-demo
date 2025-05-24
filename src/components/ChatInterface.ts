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
    this.container.className = 'chat-interface';
    this.container.innerHTML = `
      <div class="chat-messages-container">
        <div class="chat-messages" id="chatMessages"></div>
      </div>
      <div class="chat-input-container">
        <input
          type="text"
          id="chatInput"
          placeholder="Type your message here..."
          aria-label="Message input"
        />
        <button id="sendButton" class="success">Send</button>
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
    messageDiv.className = `chat-message ${isUser ? 'user' : 'assistant'}`;
    
    // Create message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-message-content';
    contentDiv.textContent = message;
    
    // Create timestamp
    const timeDiv = document.createElement('div');
    timeDiv.className = 'chat-message-time';
    timeDiv.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
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
    messageDiv.className = 'chat-message system';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-message-content';
    contentDiv.textContent = message;
    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }
}