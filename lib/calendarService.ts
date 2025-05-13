import { google } from 'googleapis';
import prisma from '@/lib/db';
import { refreshGoogleToken } from './googleAuth';

export async function getCalendarClient(userId: string) {
  // Get user's tokens
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true
    }
  });

  if (!user?.googleAccessToken || !user?.googleRefreshToken) {
    throw new Error('User not authorized for calendar access');
  }

  // Check if token needs refresh
  if (user.googleTokenExpiry && new Date() > user.googleTokenExpiry) {
    const { accessToken, expiryDate } = await refreshGoogleToken(user.googleRefreshToken);
    
    // Update tokens in database
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        googleAccessToken: accessToken,
        googleTokenExpiry: new Date(expiryDate!)
      }
    });
  }

  // Create calendar client
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken
  });

  return google.calendar({ version: 'v3', auth });
}

export async function checkTimeSlotAvailability(
  userId: string,
  date: string,
  time: string,
  duration: string = '30'
): Promise<boolean> {
  const calendar = await getCalendarClient(userId);
  
  const startDateTime = new Date(`${date}T${time}`);
  const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDateTime.toISOString(),
      timeMax: endDateTime.toISOString(),
      singleEvents: true,
    });

    return !response.data.items?.length; // Returns true if no events found
  } catch (error) {
    console.error('Error checking availability:', error);
    throw new Error('Failed to check calendar availability');
  }
}

export async function scheduleMeeting(
  userId: string,
  { date, time, duration = '30', description = '' }: {
    date: string;
    time: string;
    duration?: string;
    description?: string;
  }
) {
  // First check if the time slot is available
  const isAvailable = await checkTimeSlotAvailability(userId, date, time, duration);
  if (!isAvailable) {
    throw new Error('Time slot is not available. Please choose another time.');
  }

  const calendar = await getCalendarClient(userId);
  
  const startDateTime = new Date(`${date}T${time}`);
  const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

  const event = {
    summary: 'Meeting from WhatsApp Chat',
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'UTC',
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Store the meeting details in the database
    await prisma.meeting.create({
      data: {
        userId: parseInt(userId),
        eventId: response.data.id!,
        startTime: startDateTime,
        endTime: endDateTime,
        description: description
      }
    });

    return {
      success: true,
      eventId: response.data.id,
      link: response.data.htmlLink,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    };
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    throw new Error('Failed to schedule meeting');
  }
}

export async function rescheduleMeeting(
  userId: string,
  eventId: string,
  { date, time, duration = '30', description = '' }: {
    date: string;
    time: string;
    duration?: string;
    description?: string;
  }
) {
  // First check if the new time slot is available
  const isAvailable = await checkTimeSlotAvailability(userId, date, time, duration);
  if (!isAvailable) {
    throw new Error('Time slot is not available. Please choose another time.');
  }

  const calendar = await getCalendarClient(userId);
  
  const startDateTime = new Date(`${date}T${time}`);
  const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

  try {
    // Get the existing event
    try {
      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      // Update the event with new time
      const updatedEvent = {
        ...existingEvent.data,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'UTC',
        },
        description: description || existingEvent.data.description,
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updatedEvent,
      });

      return {
        success: true,
        eventId: response.data.id,
        link: response.data.htmlLink
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('Meeting not found. It may have been deleted or you may not have access to it.');
      }
      if (error.code === 403) {
        throw new Error('You do not have permission to modify this meeting.');
      }
      throw error; // Re-throw other errors
    }
  } catch (error: any) {
    console.error('Error rescheduling meeting:', error);
    if (error.message) {
      throw error; // Preserve the specific error message
    }
    throw new Error('Failed to reschedule meeting due to an unexpected error.');
  }
}

export async function cancelMeeting(
  userId: string,
  eventId: string
) {
  const calendar = await getCalendarClient(userId);

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return {
      success: true,
      message: 'Meeting cancelled successfully'
    };
  } catch (error: any) {
    console.error('Error cancelling meeting:', error);
    
    // Handle specific error cases
    if (error.code === 404) {
      throw new Error('Meeting not found. It may have been already cancelled or the event ID is invalid.');
    } else if (error.code === 403) {
      throw new Error('Permission denied. You may not have access to this meeting.');
    }
    
    throw new Error(`Failed to cancel meeting: ${error.message || 'Unknown error'}`);
  }
}

// Add a new function to get the latest meeting for a user
export async function getLatestMeeting(userId: string) {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: { userId: parseInt(userId) },
      orderBy: { startTime: 'desc' }
    });
    return meeting;
  } catch (error) {
    console.error('Error getting latest meeting:', error);
    return null;
  }
} 