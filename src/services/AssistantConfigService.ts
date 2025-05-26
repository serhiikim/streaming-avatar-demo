import { OpenAIAssistant } from "../openai-assistant";
import { AssistantStorage } from "../storage";

export interface AssistantConfig {
  openingIntro: string;
  fullPrompt: string;
  actions: {
    callHuman: boolean;
    scheduleMeeting: boolean;
    showSlide: boolean;
    submitSurveyData: boolean;
  };
  survey: {
    enabled: boolean;
    questions: string[];
  };
}

export class AssistantConfigService {
  private static instance: AssistantConfigService;

  private constructor() {}

  static getInstance(): AssistantConfigService {
    if (!AssistantConfigService.instance) {
      AssistantConfigService.instance = new AssistantConfigService();
    }
    return AssistantConfigService.instance;
  }

  async saveConfiguration(config: AssistantConfig): Promise<OpenAIAssistant> {
    try {
      // Generate instructions using GPT-4
      const instructions = await this.generateInstructions(config);
      
      // Update assistant with new instructions
      const assistant = await this.updateAssistant(instructions, config.actions);
      
      // Save configuration to local storage
      AssistantStorage.saveConfig({
        openingIntroduction: config.openingIntro,
        assistantId: import.meta.env.VITE_OPENAI_ASSISTANT_ID
      });
      
      return assistant;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Configuration save failed');
    }
  }

  getExistingConfig(): { openingIntro: string; lastUpdated: string | null } {
    const config = AssistantStorage.getConfig();
    const hasConfig = AssistantStorage.hasConfig();
    
    return {
      openingIntro: config.openingIntroduction,
      lastUpdated: hasConfig ? config.lastUpdated : null
    };
  }

  private async generateInstructions(config: AssistantConfig): Promise<string> {
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
          content: this.buildInstructionPrompt(config)
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate instructions');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private buildInstructionPrompt(config: AssistantConfig): string {
    const enabledActions = Object.entries(config.actions)
      .filter(([_, enabled]) => enabled)
      .map(([action]) => action)
      .join(', ');
      let surveyInstructions = '';
  if (config.survey.enabled && config.survey.questions.length > 0) {
    surveyInstructions = `
    
MANDATORY SURVEY FLOW:
After providing your opening introduction, you MUST conduct a survey with these questions:
${config.survey.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

SURVEY RULES:
1. Ask questions ONE AT A TIME in the exact order provided
2. Wait for user's response before asking the next question
3. Do not allow user to skip questions - politely redirect if they try
4. Keep track of all answers
5. After collecting all answers, call submit_survey_data function with the responses
6. Only after survey completion, proceed with normal conversation

SURVEY EXECUTION EXAMPLE:
- Ask question 1, wait for answer
- Ask question 2, wait for answer
- Continue until all questions answered
- Call submit_survey_data with all collected answers
- Then say: "Thank you for completing the survey! How can I help you today?"`;
  }

    return `Create comprehensive instructions for an OpenAI Assistant based on:
      Full Prompt: ${config.fullPrompt}
      Available Actions: ${enabledActions}
      ${surveyInstructions}
      
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

Remember: The goal is to be helpful and proactive. When in doubt, use the functions to provide the best possible assistance to users.`;
  }

  private async updateAssistant(instructions: string, actions: AssistantConfig['actions']): Promise<OpenAIAssistant> {
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

    if (actions.submitSurveyData) {
      tools.push({
        type: 'function',
        function: {
          name: 'submit_survey_data',
          description: 'Submit collected survey responses',
          parameters: {
            type: 'object',
            properties: {
              questions: {
                type: 'array', 
                items: { type: 'string' },
                description: 'Array of questions that were asked'
              },
              answers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of user answers to survey questions'
              }
            },
            required: ['questions', 'answers']
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

    const payload = { instructions, tools };

    console.log('Updating assistant with payload:', JSON.stringify(payload, null, 2));

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
  }
}