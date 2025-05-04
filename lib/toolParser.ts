import { scheduleMeeting } from './calendarService';

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
    // Add more tool handlers here
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
    console.error('Error scheduling meeting:', error);
    throw new Error('Failed to schedule meeting');
  }
}

function calculateEndTime(date: string, startTime: string, durationMinutes: number): string {
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
  return endDateTime.toISOString();
} 