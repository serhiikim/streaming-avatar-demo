import OpenAI from "openai";
import { webhookActions } from "./config/webhook";

export class OpenAIAssistant {
  private client: OpenAI;
  private assistantId: string;
  private thread: any;
  private currentRun: any;

  constructor(apiKey: string, assistantId: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    this.assistantId = assistantId;
  }

  async initialize() {
    // Create a thread
    this.thread = await this.client.beta.threads.create();
  }

  private async waitForRunCompletion(runId: string) {
    while (true) {
      const run = await this.client.beta.threads.runs.retrieve(
        this.thread.id,
        runId
      );
      
      // Check if run requires action
      if (run.status === 'requires_action' && run.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        console.log('Function calls detected:', toolCalls);
        
        // Process each tool call
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`Executing ${functionName} with args:`, args);
          
          try {
            // Call appropriate webhook action
            switch (functionName) {
              case 'call_human':
                await webhookActions.callHuman(args.reason, args.urgency);
                break;
              case 'schedule_meeting':
                await webhookActions.scheduleMeeting(args.preferred_time, args.meeting_type, args.attendees);
                break;
              case 'show_slide':
                await webhookActions.showSlide(args.slide_id, args.context_summary);
                break;
                case 'submit_survey_data':
                  await webhookActions.submitSurveyData(args.questions, args.answers);
                break;
            }
            console.log(`Successfully executed ${functionName}`);
          } catch (error) {
            console.error(`Error executing ${functionName}:`, error);
          }
        }

        // Submit tool outputs to continue the run
        await this.client.beta.threads.runs.submitToolOutputs(
          this.thread.id,
          runId,
          {
            tool_outputs: toolCalls.map(toolCall => ({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: true })
            }))
          }
        );
      }
      
      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
      }
      
      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async getResponse(userMessage: string): Promise<string> {
    if (!this.thread) {
      throw new Error("Assistant not initialized. Call initialize() first.");
    }

    // Wait for any existing run to complete
    if (this.currentRun) {
      await this.waitForRunCompletion(this.currentRun.id);
    }

    // Add user message to thread
    await this.client.beta.threads.messages.create(this.thread.id, {
      role: "user",
      content: userMessage,
    });

    // Create and run the assistant
    this.currentRun = await this.client.beta.threads.runs.create(
      this.thread.id,
      { assistant_id: this.assistantId }
    );

    // Wait for the run to complete
    const completedRun = await this.waitForRunCompletion(this.currentRun.id);

    if (completedRun.status === "completed") {
      // Get the assistant's response
      const messages = await this.client.beta.threads.messages.list(
        this.thread.id
      );

      // Get the latest assistant message
      const lastMessage = messages.data.filter(
        (msg) => msg.role === "assistant"
      )[0];

      if (lastMessage && lastMessage.content[0].type === "text") {
        return lastMessage.content[0].text.value;
      }
    }

    return "Sorry, I couldn't process your request.";
  }
}
