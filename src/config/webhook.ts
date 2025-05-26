
interface WebhookPayload {
  action: string;
  data: any;
}

async function logAction(payload: WebhookPayload): Promise<void> {
  console.log('Action triggered:', {
    action: payload.action,
    data: payload.data,
    timestamp: new Date().toISOString()
  });
}

export const webhookActions = {
  callHuman: async (reason: string, urgency: 'low' | 'medium' | 'high') => {
    console.log('Calling human with:', { reason, urgency });
    await logAction({
      action: 'call_human',
      data: { 
        reason, 
        urgency,
        timestamp: new Date().toISOString()
      }
    });
  },

  scheduleMeeting: async (preferredTime: string, meetingType: string, attendees: string[]) => {
    console.log('Scheduling meeting:', { preferredTime, meetingType, attendees });
    await logAction({
      action: 'schedule_meeting',
      data: { 
        preferredTime, 
        meetingType, 
        attendees,
        timestamp: new Date().toISOString()
      }
    });
  },

  showSlide: async (slideId: string, contextSummary: string) => {
    console.log('Showing slide:', { slideId, contextSummary });
    await logAction({
      action: 'show_slide',
      data: { 
        slideId, 
        contextSummary,
        timestamp: new Date().toISOString()
      }
    });
  },

  submitSurveyData: async (questions: string[], answers: string[]) => {
    console.log('Submitting survey data:', { questions, answers });
    await logAction({
      action: 'submit_survey_data',
      data: { questions, answers, timestamp: new Date().toISOString() }
    });
  }
}; 