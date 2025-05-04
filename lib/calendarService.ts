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

export async function scheduleMeeting(
  userId: string,
  { date, time, duration = '30', description = '' }: {
    date: string;
    time: string;
    duration?: string;
    description?: string;
  }
) {
  const calendar = await getCalendarClient(userId);
  
  const startDateTime = new Date(`${date}T${time}`);
  const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

  const event = {
    summary: 'Meeting from WhatsApp Chat',
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'UTC', // Consider using user's timezone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'UTC', // Consider using user's timezone
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      link: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    throw new Error('Failed to schedule meeting');
  }
} 