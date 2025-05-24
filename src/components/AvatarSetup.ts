import { OpenAIAssistant } from "../openai-assistant";
import { AssistantStorage } from "../storage";

interface AvatarSetupProps {
  onSetupComplete: (assistant: OpenAIAssistant, openingIntro: string) => void;
}

interface SetupFormData {
  openingIntro: string;
  fullPrompt: string;
  actions: {
    callHuman: boolean;
    scheduleMeeting: boolean;
    showSlide: boolean;
  };
}

export class AvatarSetup {
  public form!: HTMLFormElement;
  private startButton!: HTMLButtonElement;
  private setupCompleteCallback: (assistant: OpenAIAssistant, openingIntro: string) => void;

  constructor(props: AvatarSetupProps) {
    this.setupCompleteCallback = props.onSetupComplete;
    this.initializeForm();
    this.loadExistingConfig();
  }

  private initializeForm() {
    // Create form element
    this.form = document.createElement('form');
    this.form.id = 'avatarSetupForm';
    this.form.className = 'controls-container';
    this.form.innerHTML = `
      <div class="setup-header">
        <h2>Configure Your Avatar</h2>
        <p class="setup-description">Customize your AI assistant's behavior and personality</p>
      </div>
      
      <div class="form-group">
        <label for="openingIntro">Opening Introduction</label>
        <textarea 
          id="openingIntro" 
          required 
          minlength="10" 
          placeholder="Write a friendly greeting that your avatar will use when starting a conversation..."
        ></textarea>
        <small>This will be the first thing your avatar says when starting a new session</small>
      </div>

      <div class="form-group">
        <label for="fullPrompt">Avatar Behavior Instructions</label>
        <textarea 
          id="fullPrompt" 
          required 
          minlength="20" 
          placeholder="Describe how you want your avatar to behave, respond to questions, and interact with users..."
        ></textarea>
        <small>These instructions will guide your avatar's personality and response style</small>
      </div>

      <div class="form-group">
        <label>Available Actions</label>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" name="actions" value="callHuman">
            <span>Call to Human</span>
            <small>Allow avatar to request human assistance</small>
          </label>
          <label>
            <input type="checkbox" name="actions" value="scheduleMeeting">
            <span>Schedule Meeting</span>
            <small>Enable meeting scheduling capabilities</small>
          </label>
          <label>
            <input type="checkbox" name="actions" value="showSlide">
            <span>Show Slides</span>
            <small>Allow avatar to display presentation slides</small>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="secondary cancel-btn">Cancel</button>
        <button type="button" id="startSession" class="primary" disabled>Save & Apply</button>
      </div>

      <div class="config-info">
        <div class="info-item">
          <span class="icon">💾</span>
          <small>Configuration will be saved locally for future use</small>
        </div>
        <div class="info-item">
          <span class="icon">🔄</span>
          <small id="lastUpdated">No previous configuration found</small>
        </div>
      </div>
    `;

    // Add form to document
    document.body.appendChild(this.form);

    // Get button references
    this.startButton = this.form.querySelector('#startSession') as HTMLButtonElement;
    const cancelButton = this.form.querySelector('.cancel-btn') as HTMLButtonElement;

    // Add event listeners
    this.form.addEventListener('input', this.validateForm.bind(this));
    this.startButton.addEventListener('click', this.handleSubmit.bind(this));
    cancelButton.addEventListener('click', this.handleCancel.bind(this));
  }

  private loadExistingConfig() {
    const config = AssistantStorage.getConfig();
    
    // Fill form with existing values
    const openingIntroTextarea = this.form.querySelector('#openingIntro') as HTMLTextAreaElement;
    const fullPromptTextarea = this.form.querySelector('#fullPrompt') as HTMLTextAreaElement;
    
    if (openingIntroTextarea && config.openingIntroduction) {
      openingIntroTextarea.value = config.openingIntroduction;
    }

    // Update last updated info
    const lastUpdatedElement = this.form.querySelector('#lastUpdated') as HTMLElement;
    if (lastUpdatedElement && AssistantStorage.hasConfig()) {
      const lastUpdated = new Date(config.lastUpdated);
      const timeAgo = this.getTimeAgo(lastUpdated);
      lastUpdatedElement.textContent = `Last updated: ${timeAgo}`;
    }

    // Validate form after loading
    this.validateForm();
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  private validateForm() {
    const openingIntro = (this.form.querySelector('#openingIntro') as HTMLTextAreaElement).value;
    const fullPrompt = (this.form.querySelector('#fullPrompt') as HTMLTextAreaElement).value;
    
    const isValid = openingIntro.length >= 10 && fullPrompt.length >= 20;
    this.startButton.disabled = !isValid;
  }

  private handleCancel() {
    this.form.remove();
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    
    const formData: SetupFormData = {
      openingIntro: (this.form.querySelector('#openingIntro') as HTMLTextAreaElement).value,
      fullPrompt: (this.form.querySelector('#fullPrompt') as HTMLTextAreaElement).value,
      actions: {
        callHuman: (this.form.querySelector('input[value="callHuman"]') as HTMLInputElement).checked,
        scheduleMeeting: (this.form.querySelector('input[value="scheduleMeeting"]') as HTMLInputElement).checked,
        showSlide: (this.form.querySelector('input[value="showSlide"]') as HTMLInputElement).checked,
      }
    };

    try {
      this.startButton.disabled = true;
      this.startButton.textContent = 'Saving...';
      this.startButton.classList.add('loading');

      // Generate instructions using GPT-4
      const instructions = await this.generateInstructions(formData);
      
      // Update assistant with new instructions
      const assistant = await this.updateAssistant(instructions, formData.actions);
      
      // Save configuration to local storage
      AssistantStorage.saveConfig({
        openingIntroduction: formData.openingIntro,
        assistantId: import.meta.env.VITE_OPENAI_ASSISTANT_ID
      });
      
      // Call the completion callback
      this.setupCompleteCallback(assistant, formData.openingIntro);
      
      // Remove the form
      this.form.remove();
    } catch (error) {
      console.error('Setup failed:', error);
      this.startButton.disabled = false;
      this.startButton.textContent = 'Save & Apply';
      this.startButton.classList.remove('loading');
      alert('Failed to setup avatar. Please try again.');
    }
  }

  private async generateInstructions(formData: SetupFormData): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENAI_MODEL,
        messages: [{
          role: 'system',
          content: 'You are an expert at creating OpenAI Assistant instructions.'
        }, {
          role: 'user',
          content: `Create comprehensive instructions for an OpenAI Assistant based on:
            Full Prompt: ${formData.fullPrompt}
            Available Actions: ${Object.entries(formData.actions)
              .filter(([_, enabled]) => enabled)
              .map(([action]) => action)
              .join(', ')}
            
            CRITICAL FUNCTION CALLING INSTRUCTIONS:
    You MUST call functions when users request the corresponding actions. Never just explain what you could do - actually perform the action by calling the function.
    
    1. CALL_HUMAN Function:
       - Trigger: When user asks to speak with a human, needs human assistance, or requests escalation
       - Examples: "I need to talk to someone", "Can I speak with a human?", "This is too complex"
       - Process: Acknowledge → Call function → Confirm action taken
    
    2. SCHEDULE_MEETING Function:
       - Trigger: When user wants to schedule any type of meeting, call, or appointment
       - Examples: "Can we schedule a demo?", "I'd like to book a meeting", "When can we talk?"
       - Process: Acknowledge → Call function → Ask for any missing details
    
    3. SHOW_SLIDE Function - DETAILED INSTRUCTIONS:
       - Trigger: When user asks about specific topics, features, pricing, or information that might be covered in presentation slides
       - Examples: "Tell me about your pricing", "How does the automation work?", "Show me customer success stories"
       
       SLIDE SEARCH PROCESS:
       a) Use file_search to find relevant slides based on user's question
       b) Look for slides matching these criteria:
          - Keywords that match the user's query
          - Content that addresses their specific question
          - Related topics that might be relevant
       
       SLIDE JSON STRUCTURE CONTEXT:
       The slides are stored in JSON format with this structure:
       - slide_id: Unique identifier (e.g., "slide_001")
       - title: Slide title
       - type: Slide category (e.g., "pricing", "feature_detail", "case_study")
       - content: Detailed slide content and data
       - description: What the slide is about
       - keywords: Search terms for finding relevant slides
       - context: When to use this slide
       - related_topics: Connected subjects
       
       SHOW_SLIDE EXECUTION:
       1. Search for relevant slides using file_search
       2. Identify the most appropriate slide(s) based on user query
       3. Call show_slide function with:
          - slide_id: The exact slide ID from JSON
          - context_summary: Brief summary of slide content relevant to user's question
       4. Provide a conversational explanation of the slide content
       5. Offer to show related slides or answer follow-up questions
       
       SLIDE MATCHING EXAMPLES:
       - User asks "What are your prices?" → Look for slides with type "pricing" or keywords ["pricing", "cost", "plans"]
       - User asks "How does automation work?" → Find slides with keywords ["automation", "workflow", "process"]
       - User asks "Do you have customer examples?" → Search for type "case_study" or keywords ["success stories", "customers"]
       - User asks "What integrations do you support?" → Look for keywords ["integration", "API", "connectivity"]
    
    FUNCTION CALLING BEST PRACTICES:
    1. Always acknowledge the user's request first
    2. Immediately call the appropriate function - don't hesitate
    3. Use natural language to explain what you're doing
    4. If multiple slides are relevant, show the most specific one first
    5. After showing a slide, offer related information or next steps
    6. If you can't find relevant information, still call the function and explain the search attempt
    
    RESPONSE FLOW EXAMPLE:
    User: "Can you show me your pricing options?"
    Assistant: "I'd be happy to show you our pricing information. Let me find the relevant details for you."
    [Calls show_slide function with pricing slide]
    Assistant: "Here's our pricing structure with three main plans... [explains content] Would you like me to show you more details about any specific plan or discuss implementation?"
    
    Remember: The goal is to be helpful and proactive. When in doubt, use the functions to provide the best possible assistance to users.`
}]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async updateAssistant(instructions: string, actions: SetupFormData['actions']): Promise<OpenAIAssistant> {
    const tools = [];
    
    if (actions.callHuman) {
      tools.push({
        type: 'function',
        function: {
          name: 'call_human',
          description: 'Initiate a call to connect user with a human representative',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string', description: 'Reason for human assistance request' },
              urgency: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        }
      });
    }

    if (actions.scheduleMeeting) {
      tools.push({
        type: 'function',
        function: {
          name: 'schedule_meeting',
          description: 'Schedule a meeting with the user',
          parameters: {
            type: 'object',
            properties: {
              preferred_time: { type: 'string' },
              meeting_type: { type: 'string' },
              attendees: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      });
    }

    if (actions.showSlide) {
      tools.push({
        type: 'function',
        function: {
          name: 'show_slide',
          description: 'Display a relevant slide from the knowledge base',
          parameters: {
            type: 'object',
            properties: {
              slide_id: { type: 'string', description: 'ID of the slide to display' },
              context_summary: { type: 'string', description: 'Summary of slide content' }
            }
          }
        }
      });
    }

    // Always add file search
    tools.push({ type: 'file_search' });

    const payload = {
      instructions,
      tools
    };

    console.log('Updating assistant with payload:', JSON.stringify(payload, null, 2));

    // Update assistant
    try {
      const response = await fetch(`https://api.openai.com/v1/assistants/${import.meta.env.VITE_OPENAI_ASSISTANT_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Assistant update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestPayload: payload
        });
        throw new Error(`Failed to update assistant: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log('Assistant updated successfully:', responseData);

      // Create and initialize new assistant instance
      const assistant = new OpenAIAssistant(
        import.meta.env.VITE_OPENAI_API_KEY,
        import.meta.env.VITE_OPENAI_ASSISTANT_ID
      );
      await assistant.initialize();
      return assistant;
    } catch (error) {
      console.error('Error updating assistant:', error);
      throw error;
    }
  }
}