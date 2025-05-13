import { scheduleMeeting, rescheduleMeeting, cancelMeeting, getLatestMeeting } from './calendarService';

type ToolCall = {
  tool: string;
  parameters: Record<string, string>;
};

export function parseToolCalls(text: string): ToolCall[] {
  const toolCallRegex = /\[TOOL_CALL:\s*(\w+)\((.*?)\)\]/g;
  // const paramRegex = /(\w+)=([^,\s)]+)/g;
  const paramRegex = /(\w+)=(?:'([^']*)'|"([^"]*)"|([^,\s)]+))/g;
  const toolCalls: ToolCall[] = [];

  let match;
  while ((match = toolCallRegex.exec(text)) !== null) {
    const toolName = match[1];
    const paramString = match[2];
    const parameters: Record<string, string> = {};

    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramString)) !== null) {
      // parameters[paramMatch[1]] = paramMatch[2];


       // The value could be in group 2 (single quotes), 3 (double quotes), or 4 (no quotes)
       const paramValue = paramMatch[2] !== undefined ? paramMatch[2] : 
       paramMatch[3] !== undefined ? paramMatch[3] : 
       paramMatch[4];
       parameters[paramMatch[1]] = paramValue;
      /*
      With these changes, your parser will now correctly handle tool calls like:
      [TOOL_CALL: schedule_meeting(date='2025-05-10', time='14:30')]
      [TOOL_CALL: schedule_meeting(date=2025-05-10, time=14:30, description='Quarterly review meeting')]
 */


    }

    toolCalls.push({
      tool: toolName,
      parameters
    });
  }

  return toolCalls;
}

export async function handleToolCall(toolCall: ToolCall, userId: string): Promise<string> {
  switch (toolCall.tool) {
    case 'schedule_meeting':
      return await handleScheduleMeeting(toolCall.parameters, userId);
    case 'reschedule_meeting':
      return await handleRescheduleMeeting(toolCall.parameters, userId);
    case 'cancel_meeting':
      return await handleCancelMeeting(toolCall.parameters, userId);
    default:
      throw new Error(`Unknown tool: ${toolCall.tool}`);
  }
}

async function handleScheduleMeeting(params: Record<string, string>, userId: string): Promise<string> {
  const { date, time, duration = '30', description = '' } = params;
  
  if (!date || !time) {
    throw new Error('Meeting scheduling requires date and time parameters');
  }

  try {
    const result = await scheduleMeeting(userId, {
      date,
      time,
      duration,
      description
    });

    return `Meeting scheduled successfully for ${date} at ${time}. You can view it here: ${result.link}`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not available')) {
      return `Sorry, that time slot is not available. Please suggest a different time.`;
    }
    console.error('Error scheduling meeting:', error);
    throw new Error('Failed to schedule meeting');
  }
}

async function handleRescheduleMeeting(params: Record<string, string>, userId: string): Promise<string> {
  const { eventId, date, time, duration = '30', description = '' } = params;
  
  if (!eventId || !date || !time) {
    return 'Meeting rescheduling requires an event ID, date and time.';
  }

  try {
    const result = await rescheduleMeeting(userId, eventId, {
      date,
      time,
      duration,
      description
    });

    return `Meeting rescheduled successfully to ${date} at ${time}. You can view the updated event here: ${result.link}`;
  } catch (error) {
    console.error('Error rescheduling meeting:', error);
    if (error instanceof Error) {
      // Return user-friendly error message
      if (error.message.includes('not found')) {
        return 'Sorry, I couldn\'t find that meeting. It may have been deleted or you might not have access to it.';
      }
      if (error.message.includes('permission')) {
        return 'Sorry, you don\'t have permission to modify this meeting.';
      }
      if (error.message.includes('not available')) {
        return 'That time slot is not available. Please choose a different time.';
      }
      return `Sorry, I couldn't reschedule the meeting: ${error.message}`;
    }
    return 'Sorry, something went wrong while trying to reschedule the meeting.';
  }
}

async function handleCancelMeeting(params: Record<string, string>, userId: string): Promise<string> {
  let { eventId } = params;
  
  if (!eventId) {
    // If no eventId provided, try to get the latest meeting
    const latestMeeting = await getLatestMeeting(userId);
    if (!latestMeeting) {
      return 'No recent meeting found to cancel.';
    }
    eventId = latestMeeting.eventId;
  }

  try {
    await cancelMeeting(userId, eventId);
    return `Meeting cancelled successfully.`;
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return 'This meeting appears to have been already cancelled or does not exist.';
      }
      return `Failed to cancel meeting: ${error.message}`;
    }
    return 'An unexpected error occurred while cancelling the meeting.';
  }
}

function calculateEndTime(date: string, startTime: string, durationMinutes: number): string {
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
  return endDateTime.toISOString();
} 