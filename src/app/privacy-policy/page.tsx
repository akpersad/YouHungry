'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Shield,
  Database,
  Users,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-primary py-8 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Privacy Policy & Terms of Service
          </h1>
          <p className="text-secondary">Last Updated: October 16, 2025</p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-secondary">
                Welcome to Fork In The Road! This application is a personal
                project created and maintained by Andrew Persad. This Privacy
                Policy & Terms of Service describes how we collect, use, and
                protect your information when you use our restaurant discovery
                and group decision platform.
              </p>
              <p className="text-secondary">
                By creating an account and using Fork In The Road, you agree to
                the terms outlined in this policy. If you do not agree with
                these terms, please do not use our service.
              </p>
            </CardContent>
          </Card>

          {/* SMS Terms & Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>SMS Notifications & Consent</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">
                  How SMS Notifications Work
                </h3>
                <p className="text-secondary">
                  When you opt-in to SMS notifications, you consent to receive
                  transactional text messages from Fork In The Road. These
                  messages are sent via Twilio and include:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-secondary">
                  <li>
                    Group decision notifications (when decisions start or
                    complete)
                  </li>
                  <li>Friend request alerts</li>
                  <li>Group invitation notifications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Message Frequency & Costs
                </h3>
                <p className="text-secondary">
                  Message frequency varies based on your activity and
                  participation in groups. Some users may receive no messages if
                  they are not part of any groups, while others may receive
                  multiple messages per day if they participate in many active
                  groups. Message and data rates may apply from your mobile
                  carrier.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Consent & Opt-Out
                </h3>
                <p className="text-secondary">
                  Consent to receive SMS messages is{' '}
                  <strong>not required</strong> to create an account or use Fork
                  In The Road. You can opt-in during registration or at any time
                  in your profile settings. To opt-out of SMS notifications,
                  simply disable the SMS notifications toggle in your Profile
                  Settings. We do not currently support replying STOP to
                  opt-out, but you can always disable SMS in your settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">SMS Support</h3>
                <p className="text-secondary">
                  For help with SMS notifications or to report issues, please
                  contact us at{' '}
                  <a
                    href="mailto:nodemailer_persad@yahoo.com"
                    className="text-primary hover:underline"
                  >
                    nodemailer_persad@yahoo.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Collection & Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Collection & Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Information We Collect
                </h3>
                <p className="text-secondary mb-2">
                  We collect the following types of information to provide and
                  improve our services:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-secondary">
                  <li>
                    <strong>Account Information:</strong> Name, email address,
                    username, password (encrypted), and optional profile picture
                  </li>
                  <li>
                    <strong>Contact Information:</strong> Phone number
                    (optional, for SMS notifications)
                  </li>
                  <li>
                    <strong>Location Data:</strong> City, state, and default
                    search location (optional)
                  </li>
                  <li>
                    <strong>User Content:</strong> Restaurant collections, group
                    memberships, friend connections, preferences, and activity
                  </li>
                  <li>
                    <strong>Usage Analytics:</strong> Anonymized user behavior
                    data collected via Google Analytics
                  </li>
                  <li>
                    <strong>Error & Performance Data:</strong> Application
                    errors and performance metrics collected via Sentry for
                    debugging and improvement purposes
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">
                  How We Use Your Information
                </h3>
                <p className="text-secondary mb-2">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-secondary">
                  <li>Provide and maintain our services</li>
                  <li>
                    Send you notifications about group activities and social
                    interactions
                  </li>
                  <li>
                    Personalize your experience with restaurant recommendations
                  </li>
                  <li>
                    Improve our application based on usage patterns and error
                    reports
                  </li>
                  <li>
                    Communicate with you about service updates or support
                    requests
                  </li>
                  <li>Ensure the security and integrity of our platform</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Data Storage & Security
                </h3>
                <p className="text-secondary">
                  Your data is securely stored in MongoDB Atlas with encryption
                  at rest and in transit. We implement industry-standard
                  security measures to protect your information, including
                  encrypted passwords, secure API endpoints, and regular
                  security audits. However, no method of transmission over the
                  internet is 100% secure, and we cannot guarantee absolute
                  security.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Third-Party Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-secondary mb-2">
                We use the following third-party services to provide our
                functionality:
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-primary">Clerk</h4>
                  <p className="text-sm text-secondary">
                    Authentication and user management platform. Handles secure
                    login, registration, and session management.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-primary">Twilio</h4>
                  <p className="text-sm text-secondary">
                    SMS messaging service for sending text notifications to
                    users who opt-in.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-primary">Google Services</h4>
                  <p className="text-sm text-secondary">
                    Google Analytics (anonymized usage analytics), Google Maps
                    API (location services), and Google Places API (restaurant
                    search and information).
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-primary">Yelp Fusion API</h4>
                  <p className="text-sm text-secondary">
                    Restaurant data, ratings, reviews, and business information.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-primary">Sentry</h4>
                  <p className="text-sm text-secondary">
                    Error tracking and performance monitoring to help us
                    identify and fix issues quickly.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-primary">MongoDB Atlas</h4>
                  <p className="text-sm text-secondary">
                    Cloud database service for secure data storage.
                  </p>
                </div>
              </div>

              <p className="text-secondary text-sm mt-4">
                Each of these services has their own privacy policies and terms
                of service. We encourage you to review their policies to
                understand how they handle your data.
              </p>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Your Rights & Choices</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-secondary mb-2">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-secondary">
                <li>
                  <strong>Access:</strong> You can view and access your account
                  information at any time through your Profile Settings.
                </li>
                <li>
                  <strong>Modify:</strong> You can update your profile
                  information, preferences, and notification settings at any
                  time.
                </li>
                <li>
                  <strong>Delete:</strong> You can delete your account and
                  associated data by contacting us at
                  nodemailer_persad@yahoo.com. We will process deletion requests
                  within 30 days.
                </li>
                <li>
                  <strong>Opt-Out:</strong> You can disable SMS notifications,
                  email notifications, and push notifications at any time in
                  your settings.
                </li>
                <li>
                  <strong>Data Export:</strong> You can request a copy of your
                  data by contacting us at nodemailer_persad@yahoo.com.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children&apos;s Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary">
                Fork In The Road is not intended for use by children under the
                age of 13. We do not knowingly collect personal information from
                children under 13. If we become aware that we have collected
                information from a child under 13, we will take steps to delete
                that information promptly. If you believe we have collected
                information from a child under 13, please contact us immediately
                at nodemailer_persad@yahoo.com.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary">
                We may update this Privacy Policy & Terms of Service from time
                to time to reflect changes in our practices or for legal,
                operational, or regulatory reasons. When we make changes, we
                will update the &quot;Last Updated&quot; date at the top of this
                page. For significant changes, we will notify you via email or
                through a prominent notice in the application. Your continued
                use of Fork In The Road after changes are posted constitutes
                your acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary mb-4">
                If you have any questions, concerns, or requests regarding this
                Privacy Policy & Terms of Service, or about how we handle your
                data, please contact us:
              </p>
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="font-medium text-primary">Email:</p>
                <a
                  href="mailto:nodemailer_persad@yahoo.com"
                  className="text-primary hover:underline text-lg"
                >
                  nodemailer_persad@yahoo.com
                </a>
              </div>
              <p className="text-secondary text-sm mt-4">
                We will respond to your inquiry as soon as possible, typically
                within 5-7 business days.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button onClick={() => router.back()} variant="outline">
            Return to Application
          </Button>
        </div>
      </div>
    </div>
  );
}
