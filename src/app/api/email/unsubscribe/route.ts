import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token && !email) {
      return new NextResponse(
        `
        <html>
          <head><title>Unsubscribe - You Hungry?</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>Unsubscribe from You Hungry? Notifications</h1>
            <p>Invalid unsubscribe link. Please contact support if you need assistance.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Return to You Hungry?</a></p>
          </body>
        </html>
      `,
        {
          headers: { 'Content-Type': 'text/html' },
          status: 400,
        }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    let user;

    if (email) {
      // Direct email unsubscribe
      user = await usersCollection.findOne({ email });
    } else if (token) {
      // Token-based unsubscribe (for future implementation)
      // For now, we'll implement a simple email-based approach
      logger.info('Token-based unsubscribe not yet implemented', { token });
      return new NextResponse(
        `
        <html>
          <head><title>Unsubscribe - You Hungry?</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>Unsubscribe from You Hungry? Notifications</h1>
            <p>Token-based unsubscribe is not yet implemented. Please use the email-based link or contact support.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Return to You Hungry?</a></p>
          </body>
        </html>
      `,
        {
          headers: { 'Content-Type': 'text/html' },
          status: 501,
        }
      );
    }

    if (!user) {
      return new NextResponse(
        `
        <html>
          <head><title>Unsubscribe - You Hungry?</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>Unsubscribe from You Hungry? Notifications</h1>
            <p>User not found. You may have already unsubscribed or the link is invalid.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Return to You Hungry?</a></p>
          </body>
        </html>
      `,
        {
          headers: { 'Content-Type': 'text/html' },
          status: 404,
        }
      );
    }

    // Update user preferences to disable email notifications
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          'preferences.notificationSettings.emailEnabled': false,
          updatedAt: new Date(),
        },
      }
    );

    logger.info('User unsubscribed from email notifications', {
      userId: user._id,
      email: user.email,
    });

    return new NextResponse(
      `
      <html>
        <head><title>Unsubscribed - You Hungry?</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <div style="background: #d1fae5; border: 1px solid #34d399; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h1 style="color: #059669; margin-top: 0;">✅ Successfully Unsubscribed</h1>
            <p style="color: #047857; margin-bottom: 0;">You have been unsubscribed from You Hungry? email notifications.</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px;">
            <h3>What this means:</h3>
            <ul>
              <li>You will no longer receive email notifications for group decisions</li>
              <li>You will no longer receive email notifications for friend requests</li>
              <li>You will no longer receive email notifications for group invitations</li>
              <li>You will no longer receive email notifications for decision results</li>
            </ul>
            
            <p><strong>Note:</strong> You can re-enable email notifications anytime in your account settings.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Return to You Hungry?
            </a>
          </div>
        </body>
      </html>
    `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    logger.error('Unsubscribe error:', error);
    return new NextResponse(
      `
      <html>
        <head><title>Error - You Hungry?</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>Error</h1>
          <p>An error occurred while processing your unsubscribe request. Please try again or contact support.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Return to You Hungry?</a></p>
        </body>
      </html>
    `,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 500,
      }
    );
  }
}
