import { OpenAIAssistant } from "../openai-assistant";

interface AvatarSetupProps {
  onSetupComplete: (assistant: OpenAIAssistant) => void;
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
  private form!: HTMLFormElement;
  private startButton!: HTMLButtonElement;
  private setupCompleteCallback: (assistant: OpenAIAssistant) => void;

  constructor(props: AvatarSetupProps) {
    this.setupCompleteCallback = props.onSetupComplete;
    this.initializeForm();
  }

  private initializeForm() {
    // Create form element
    this.form = document.createElement('form');
    this.form.id = 'avatarSetupForm';
    this.form.className = 'controls-container';
    this.form.innerHTML = `
      <h2>Configure Your Avatar</h2>
      
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
        <button type="submit" id="startSession" class="primary" disabled>Start Session</button>
      </div>
    `;

    // Add form to document
    document.body.appendChild(this.form);

    // Get start button reference
    this.startButton = this.form.querySelector('#startSession') as HTMLButtonElement;

    // Add event listeners
    this.form.addEventListener('input', this.validateForm.bind(this));
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  private validateForm() {
    const openingIntro = (this.form.querySelector('#openingIntro') as HTMLTextAreaElement).value;
    const fullPrompt = (this.form.querySelector('#fullPrompt') as HTMLTextAreaElement).value;
    
    const isValid = openingIntro.length >= 10 && fullPrompt.length >= 20;
    this.startButton.disabled = !isValid;
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
      this.startButton.textContent = 'Setting up...';
      this.startButton.classList.add('loading');

      // Generate instructions using GPT-4
      const instructions = await this.generateInstructions(formData);
      
      // Update assistant with new instructions
      const assistant = await this.updateAssistant(instructions, formData.actions);
      
      // Call the completion callback
      this.setupCompleteCallback(assistant);
      
      // Remove the form
      this.form.remove();
    } catch (error) {
      console.error('Setup failed:', error);
      this.startButton.disabled = false;
      this.startButton.textContent = 'Start Session';
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
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are an expert at creating OpenAI Assistant instructions.'
        }, {
          role: 'user',
          content: `Create optimized instructions for an OpenAI Assistant based on:
            Opening Intro: ${formData.openingIntro}
            Full Prompt: ${formData.fullPrompt}
            Available Actions: ${Object.entries(formData.actions)
              .filter(([_, enabled]) => enabled)
              .map(([action]) => action)
              .join(', ')}
            
            Important instructions for function calling:
            1. When a user requests any of the available actions, you MUST call the corresponding function
            2. For call_human: Use when user asks to speak with a human or needs human assistance
            3. For schedule_meeting: Use when user wants to schedule any type of meeting
            4. For show_slide: Use when user asks about specific information that might be in slides
            
            Function calling process:
            1. First, acknowledge the user's request
            2. Then, immediately call the appropriate function with relevant parameters
            3. After the function call, explain what action was taken
            4. If the function requires additional information, ask the user for it
            
            Remember: Always use functions when appropriate - don't just explain that you could do something, actually do it by calling the function.`
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