'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AddressInput } from '@/components/ui/AddressInput';
import { CityStateInput } from '@/components/ui/CityStateInput';
import { useProfile } from '@/hooks/useProfile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import {
  Loader2,
  Camera,
  Phone,
  MapPin,
  Bell,
  Shield,
  Check,
  AlertCircle,
} from 'lucide-react';

function ProfilePageContent() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { profile, isLoading, error, updateProfile, isUpdating } = useProfile();
  const {
    status: pushStatus,
    loading: pushLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // Local state for form fields
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    city: '',
    state: '',
    cityState: '', // Combined display value for city/state input
    phoneNumber: '', // Verified phone number
    smsOptIn: false,
    smsPhoneNumber: '',
    defaultLocation: '',
    groupDecisionsStarted: true,
    groupDecisionsCompleted: true,
    friendRequests: true,
    groupInvites: true,
    smsEnabled: false,
    emailEnabled: true,
    pushEnabled: false, // Default to false - requires permission
  });

  // Push notification state
  const [pushPermissionDenied, setPushPermissionDenied] = useState(false);
  const [hasPromptedForPush, setHasPromptedForPush] = useState(false);

  // State for address validation
  const [isDefaultLocationValid, setIsDefaultLocationValid] = useState(false);
  const [phoneValidationStatus, setPhoneValidationStatus] = useState<
    'idle' | 'validating' | 'pending' | 'verifying' | 'verified' | 'error'
  >('idle');
  const [phoneValidationError, setPhoneValidationError] = useState<
    string | null
  >(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(
    null
  );

  // Phone number formatting - formats as 1 (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string): string => {
    if (!value) return '';

    // Remove all non-digit characters
    let digits = value.replace(/\D/g, '');

    // If it's 11 digits and starts with 1 (US country code), keep it
    // If it's 10 digits, we'll add the 1 prefix
    let hasCountryCode = false;
    if (digits.length === 11 && digits.startsWith('1')) {
      hasCountryCode = true;
      digits = digits.slice(1); // Remove for formatting, we'll add it back
    }

    // Format based on length (should be 10 digits for US numbers)
    let formatted = '';
    if (digits.length <= 3) {
      formatted = digits;
    } else if (digits.length <= 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else {
      // If more than 10 digits, format first 10 only
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }

    // Add country code prefix if we had one or if we have a complete number
    if ((hasCountryCode || digits.length === 10) && digits.length >= 10) {
      return `1 ${formatted}`;
    }

    return formatted;
  };

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      const city = profile.city || '';
      const state = profile.state || '';
      const cityState = city && state ? `${city}, ${state}` : '';

      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        city: city,
        state: state,
        cityState: cityState,
        phoneNumber: profile.phoneNumber
          ? formatPhoneNumber(profile.phoneNumber)
          : '',
        smsOptIn: profile.smsOptIn || false,
        smsPhoneNumber: profile.smsPhoneNumber
          ? formatPhoneNumber(profile.smsPhoneNumber)
          : '',
        defaultLocation: profile.preferences?.defaultLocation || '',
        groupDecisionsStarted:
          profile.preferences?.notificationSettings?.groupDecisions?.started ??
          true,
        groupDecisionsCompleted:
          profile.preferences?.notificationSettings?.groupDecisions
            ?.completed ?? true,
        friendRequests:
          profile.preferences?.notificationSettings?.friendRequests ?? true,
        groupInvites:
          profile.preferences?.notificationSettings?.groupInvites ?? true,
        smsEnabled:
          profile.preferences?.notificationSettings?.smsEnabled ?? false,
        emailEnabled:
          // Email is enabled by default but disabled when no verified phone number
          profile.preferences?.notificationSettings?.emailEnabled ?? true,
        pushEnabled:
          profile.preferences?.notificationSettings?.pushEnabled ?? false,
      });
    }
  }, [profile]);

  // Check push permission status on mount and update state
  useEffect(() => {
    if (pushStatus.permission === 'denied') {
      setPushPermissionDenied(true);
    } else if (pushStatus.permission === 'granted' && pushStatus.subscribed) {
      // User has already granted permission and is subscribed
      setFormData((prev) => ({ ...prev, pushEnabled: true }));
    }
  }, [pushStatus]);

  // Prompt for push notifications on first profile visit after registration
  useEffect(() => {
    const isNewUser = searchParams.get('new_user') === 'true';

    if (
      isNewUser &&
      !hasPromptedForPush &&
      pushStatus.permission === 'default'
    ) {
      // Only prompt if permission hasn't been asked yet
      setHasPromptedForPush(true);
      handlePushToggle(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, hasPromptedForPush, pushStatus.permission]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle notification channel changes with validation
  const handleNotificationChannelChange = (
    channel: 'emailEnabled' | 'smsEnabled',
    checked: boolean
  ) => {
    // If trying to uncheck, ensure at least one channel remains checked
    if (!checked) {
      const otherChannel =
        channel === 'emailEnabled' ? 'smsEnabled' : 'emailEnabled';
      if (!formData[otherChannel]) {
        toast.error(
          'At least one notification method (Email or SMS) must be enabled'
        );
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [channel]: checked }));
  };

  // Show notification when phone number is verified (only during verification process)
  useEffect(() => {
    if (phoneValidationStatus === 'verified' && formData.phoneNumber) {
      toast.success(
        'Phone verified! You can now toggle between SMS and Email notifications.'
      );
    }
  }, [phoneValidationStatus, formData.phoneNumber]);

  // Handle city/state selection from the combined input
  const handleCityStateChange = (city: string, state: string) => {
    setFormData((prev) => ({
      ...prev,
      city: city,
      state: state,
      cityState: `${city}, ${state}`,
    }));
  };

  // Normalize phone number to just digits for comparison
  const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    // Remove leading 1 if present (US country code)
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    return digits;
  };

  // Phone number validation - client-side only
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters except + at the start
    const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    // International format validation (E.164)
    // Accepts: +1234567890, 1234567890, (123) 456-7890, 123-456-7890, etc.
    // Must be 10-15 digits (after cleaning), optional country code
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;

    return phoneRegex.test(cleanedPhone);
  };

  const handlePhoneValidation = async () => {
    // Use phoneNumber if it exists (editing verified number), otherwise use smsPhoneNumber
    const phoneToVerify = formData.phoneNumber || formData.smsPhoneNumber;

    if (!phoneToVerify) {
      setPhoneValidationError('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(phoneToVerify)) {
      setPhoneValidationError('Please enter a valid phone number');
      return;
    }

    setPhoneValidationStatus('validating');
    setPhoneValidationError(null);

    try {
      // Send verification code via Twilio
      const response = await fetch('/api/user/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneToVerify }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification code');
      }

      const data = await response.json();

      // Set to pending state - waiting for user to enter code
      setPhoneValidationStatus('pending');
      setPendingPhoneNumber(data.phoneNumber); // Store the formatted phone number
      setVerificationCode(''); // Clear any previous code

      // Show success message with verification code (for development)
      if (data.verificationCode) {
        toast.success(
          `Verification code sent! Code: ${data.verificationCode} (Development only)`
        );
      } else {
        toast.success('Verification code sent! Check your phone.');
      }
    } catch (error) {
      setPhoneValidationStatus('error');
      setPhoneValidationError(
        error instanceof Error
          ? error.message
          : 'Failed to send verification code. Please try again.'
      );
      toast.error('Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setPhoneValidationError('Please enter a valid 6-digit code');
      return;
    }

    if (!pendingPhoneNumber) {
      setPhoneValidationError('No pending phone number to verify');
      return;
    }

    setPhoneValidationStatus('verifying');
    setPhoneValidationError(null);

    try {
      // Verify the code
      const response = await fetch('/api/user/verify-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: pendingPhoneNumber,
          verificationCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify code');
      }

      const data = await response.json();

      // Set to verified state
      setPhoneValidationStatus('verified');
      setVerificationCode('');
      setPendingPhoneNumber(null);

      // Update the main phone number field
      setFormData((prev) => ({
        ...prev,
        phoneNumber: data.phoneNumber,
        smsPhoneNumber: data.phoneNumber,
      }));

      toast.success('Phone number verified successfully!');

      // Refresh profile to get updated data from server
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    } catch (error) {
      setPhoneValidationStatus('error');
      setPhoneValidationError(
        error instanceof Error
          ? error.message
          : 'Failed to verify code. Please try again.'
      );
      toast.error('Verification failed');
    }
  };

  const handleCancelVerification = () => {
    setPhoneValidationStatus('idle');
    setPhoneValidationError(null);
    setVerificationCode('');
    setPendingPhoneNumber(null);
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent('/profile'));
    }
  }, [isLoaded, clerkUser, router]);

  // Handle push notification toggle
  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      // User wants to enable push notifications

      // Check if device/browser supports push notifications
      if (!pushStatus.supported) {
        // Device doesn't support push, but still save the preference for other devices
        setFormData((prev) => ({ ...prev, pushEnabled: true }));

        await updateProfile({
          preferences: {
            notificationSettings: {
              pushEnabled: true,
            },
          },
        });

        toast.success(
          "Push notification preference saved! Note: This device/browser doesn't support push notifications, but the setting will apply to other devices."
        );
        return;
      }

      // Device supports push, try to subscribe
      try {
        // This will trigger the native browser/OS permission prompt
        await subscribe();

        // If we get here, permission was granted
        setFormData((prev) => ({ ...prev, pushEnabled: true }));
        setPushPermissionDenied(false);

        // Save to profile
        await updateProfile({
          preferences: {
            notificationSettings: {
              pushEnabled: true,
            },
          },
        });

        toast.success('Push notifications enabled!');
      } catch {
        // Permission was denied or error occurred
        setFormData((prev) => ({ ...prev, pushEnabled: false }));
        setPushPermissionDenied(true);
        toast.error(
          'Push notifications permission denied. Please enable in your browser settings.'
        );
      }
    } else {
      // User wants to disable push notifications
      try {
        // Only try to unsubscribe if device supports it and might be subscribed
        if (pushStatus.supported && pushStatus.subscribed) {
          await unsubscribe();
        }

        setFormData((prev) => ({ ...prev, pushEnabled: false }));

        // Save to profile
        await updateProfile({
          preferences: {
            notificationSettings: {
              pushEnabled: false,
            },
          },
        });

        toast.success('Push notifications disabled');
      } catch {
        toast.error('Failed to disable push notifications');
      }
    }
  };

  const handleSave = async () => {
    // Validate default location if it's provided
    if (formData.defaultLocation && !isDefaultLocationValid) {
      // Error handling is done in the hook
      return;
    }

    try {
      await updateProfile({
        // Note: name and username are managed by Clerk and not sent in update
        city: formData.city,
        state: formData.state,
        smsOptIn: formData.smsOptIn,
        smsPhoneNumber: formData.smsPhoneNumber,
        preferences: {
          defaultLocation: formData.defaultLocation || undefined,
          locationSettings: {
            city: formData.city || undefined,
            state: formData.state || undefined,
          },
          notificationSettings: {
            groupDecisions: {
              started: formData.groupDecisionsStarted,
              completed: formData.groupDecisionsCompleted,
            },
            friendRequests: formData.friendRequests,
            groupInvites: formData.groupInvites,
            smsEnabled: formData.smsEnabled,
            emailEnabled: formData.emailEnabled,
            pushEnabled: formData.pushEnabled,
          },
        },
      });
    } catch {
      // Error handling is done in the hook
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-primary mb-2">
            Error Loading Profile
          </h2>
          <p className="text-secondary mb-4">
            There was an error loading your profile.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary py-8">
      <div className="max-w-4xl mx-auto lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Profile Settings</h1>
          <p className="mt-2 text-secondary">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Profile Picture</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <UserAvatar
                  name={profile?.name || 'User'}
                  profilePicture={
                    clerkUser?.imageUrl || profile?.profilePicture
                  }
                  size="lg"
                />
                <div className="flex-1">
                  <p className="text-sm text-tertiary">
                    Profile picture is managed through your Clerk account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={formData.name} disabled />
                  <p className="text-sm text-tertiary mt-1">
                    Name is managed through your Clerk account.
                  </p>
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={formData.username} disabled />
                  <p className="text-sm text-tertiary mt-1">
                    Username is managed through your Clerk account.
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={profile?.email || ''} disabled />
                <p className="text-sm text-tertiary mt-1">
                  Email is managed through your Clerk account.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cityState">City & State</Label>
                <CityStateInput
                  id="cityState"
                  value={formData.cityState}
                  onChange={(value) => handleInputChange('cityState', value)}
                  onCityStateChange={handleCityStateChange}
                  placeholder="Search for a city..."
                />
              </div>
              <div>
                <Label htmlFor="defaultLocation">Default Location</Label>
                <AddressInput
                  id="defaultLocation"
                  value={formData.defaultLocation}
                  onChange={(value) =>
                    handleInputChange('defaultLocation', value)
                  }
                  onValidationChange={setIsDefaultLocationValid}
                  placeholder="Enter your default location for restaurant searches"
                />
                <p className="text-sm text-tertiary mt-1">
                  This will be used as the default location for restaurant
                  searches.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Phone & SMS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Phone & SMS Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show verified phone number if exists */}
              {formData.phoneNumber ? (
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
                  <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        handleInputChange('phoneNumber', formatted);
                        handleInputChange('smsPhoneNumber', formatted);
                        // Reset validation status when user edits
                        setPhoneValidationStatus('idle');
                        setPhoneValidationError(null);
                      }}
                      placeholder="1 (555) 123-4567"
                      className="flex-1"
                      maxLength={16} // 1 (XXX) XXX-XXXX = 16 characters
                      disabled={['pending', 'verifying', 'validating'].includes(
                        phoneValidationStatus
                      )}
                    />
                    {/* Show verification status or verify button */}
                    {(() => {
                      const phoneMatches =
                        normalizePhoneNumber(formData.phoneNumber) ===
                        normalizePhoneNumber(profile?.phoneNumber || '');
                      const isVerified = profile?.phoneVerified === true;

                      // Phone exists in profile and matches, check verification status
                      if (phoneMatches && formData.phoneNumber) {
                        if (isVerified) {
                          // Verified phone number
                          return (
                            <div className="flex items-center text-success font-medium px-4 whitespace-nowrap md:whitespace-nowrap">
                              <Check className="h-5 w-5 mr-2" />
                              Verified
                            </div>
                          );
                        } else {
                          // Unverified phone number - show button to verify
                          return phoneValidationStatus === 'pending' ? (
                            <div className="flex items-center text-warning font-medium px-4 whitespace-nowrap">
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Pending
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
                              <div className="flex items-center text-warning font-medium px-2">
                                ⚠️ Unverified
                              </div>
                              <Button
                                type="button"
                                onClick={handlePhoneValidation}
                                disabled={
                                  phoneValidationStatus === 'validating'
                                }
                                variant="outline"
                                size="sm"
                                className="w-full md:w-auto"
                              >
                                {phoneValidationStatus === 'validating' ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Sending...
                                  </>
                                ) : (
                                  'Verify Now'
                                )}
                              </Button>
                            </div>
                          );
                        }
                      } else {
                        // Phone number changed or is new - show verify button
                        return phoneValidationStatus === 'pending' ? (
                          <div className="flex items-center text-warning font-medium px-4 whitespace-nowrap">
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Pending
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={handlePhoneValidation}
                            disabled={
                              phoneValidationStatus === 'validating' ||
                              !formData.phoneNumber
                            }
                            variant="outline"
                            className="w-full md:w-auto"
                          >
                            {phoneValidationStatus === 'validating' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        );
                      }
                    })()}
                  </div>

                  {/* Show verification code input when pending or verifying */}
                  {(phoneValidationStatus === 'pending' ||
                    phoneValidationStatus === 'verifying') && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary rounded-lg">
                      <Label htmlFor="verificationCode">
                        Verification Code
                      </Label>
                      {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
                      <div className="flex flex-col space-y-2 mt-2 md:flex-row md:space-y-0 md:space-x-2">
                        <Input
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => {
                            // Only allow digits, max 6 characters
                            const value = e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 6);
                            setVerificationCode(value);
                            setPhoneValidationError(null);
                          }}
                          placeholder="000000"
                          className="flex-1"
                          maxLength={6}
                          autoFocus
                          disabled={phoneValidationStatus === 'verifying'}
                        />
                        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                          <Button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={
                              phoneValidationStatus === 'verifying' ||
                              verificationCode.length !== 6
                            }
                            className="w-full md:w-auto"
                          >
                            {phoneValidationStatus === 'verifying' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Verifying...
                              </>
                            ) : (
                              'Submit'
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleCancelVerification}
                            variant="outline"
                            disabled={phoneValidationStatus === 'verifying'}
                            className="w-full md:w-auto"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                      {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
                      <div className="flex flex-col space-y-2 mt-2 md:flex-row md:space-y-0 md:justify-between md:items-center">
                        <p className="text-sm text-primary">
                          Enter the 6-digit code sent to your phone.
                        </p>
                        <Button
                          type="button"
                          onClick={handlePhoneValidation}
                          variant="outline"
                          size="sm"
                          disabled={['verifying', 'validating'].includes(
                            phoneValidationStatus
                          )}
                          className="w-full md:w-auto"
                        >
                          Resend Code
                        </Button>
                      </div>
                    </div>
                  )}

                  {phoneValidationError && (
                    <p className="text-sm text-destructive mt-1">
                      {phoneValidationError}
                    </p>
                  )}
                  {phoneValidationStatus !== 'pending' && (
                    <p className="text-sm text-tertiary mt-1">
                      {(() => {
                        const phoneMatches =
                          normalizePhoneNumber(formData.phoneNumber) ===
                          normalizePhoneNumber(profile?.phoneNumber || '');
                        const isVerified = profile?.phoneVerified === true;

                        if (phoneMatches && formData.phoneNumber) {
                          if (isVerified) {
                            return 'Verified phone number for SMS notifications. Edit to change and re-verify.';
                          } else {
                            return 'Phone number needs verification. Click "Verify Now" to receive an SMS code.';
                          }
                        } else {
                          return 'Enter your phone number and click Verify to enable SMS notifications.';
                        }
                      })()}
                    </p>
                  )}
                </div>
              ) : (
                /* Show placeholder if no verified number */
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value=""
                    disabled
                    placeholder="No verified phone number"
                  />
                  <p className="text-sm text-tertiary mt-1">
                    No verified phone number yet. Enable SMS notifications below
                    to verify a number.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smsOptIn"
                    checked={formData.smsOptIn}
                    onCheckedChange={(checked) =>
                      handleInputChange('smsOptIn', checked)
                    }
                    disabled={formData.smsOptIn && !profile?.phoneVerified}
                  />
                  <Label htmlFor="smsOptIn">Enable SMS Notifications</Label>
                </div>
                {formData.smsOptIn && !profile?.phoneVerified && (
                  <p className="text-sm text-warning ml-8">
                    ⚠️ SMS notifications won&apos;t be sent until your phone
                    number is verified.
                  </p>
                )}
              </div>

              {/* Show SMS Phone Number field only if no verified number and SMS is enabled */}
              {formData.smsOptIn && !formData.phoneNumber && (
                <div>
                  <Label htmlFor="smsPhoneNumber">SMS Phone Number</Label>
                  {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
                  <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                    <Input
                      id="smsPhoneNumber"
                      value={formData.smsPhoneNumber}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        handleInputChange('smsPhoneNumber', formatted);
                        // Reset validation status when user types
                        if (phoneValidationStatus !== 'idle') {
                          setPhoneValidationStatus('idle');
                          setPhoneValidationError(null);
                        }
                      }}
                      placeholder="1 (555) 123-4567"
                      className="flex-1"
                      maxLength={16} // 1 (XXX) XXX-XXXX = 16 characters
                      disabled={['pending', 'verifying', 'validating'].includes(
                        phoneValidationStatus
                      )}
                    />
                    {phoneValidationStatus === 'pending' ? (
                      <div className="flex items-center text-warning font-medium px-4 whitespace-nowrap">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Pending
                      </div>
                    ) : phoneValidationStatus === 'verified' ? (
                      <div className="flex items-center text-success font-medium px-4">
                        <Check className="h-5 w-5 mr-2" />
                        Verified
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={handlePhoneValidation}
                        disabled={
                          phoneValidationStatus === 'validating' ||
                          !formData.smsPhoneNumber
                        }
                        variant="outline"
                        className="w-full md:w-auto"
                      >
                        {phoneValidationStatus === 'validating' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Show verification code input when pending or verifying */}
                  {(phoneValidationStatus === 'pending' ||
                    phoneValidationStatus === 'verifying') && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary rounded-lg">
                      <Label htmlFor="verificationCodeSMS">
                        Verification Code
                      </Label>
                      {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
                      <div className="flex flex-col space-y-2 mt-2 md:flex-row md:space-y-0 md:space-x-2">
                        <Input
                          id="verificationCodeSMS"
                          value={verificationCode}
                          onChange={(e) => {
                            // Only allow digits, max 6 characters
                            const value = e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 6);
                            setVerificationCode(value);
                            setPhoneValidationError(null);
                          }}
                          placeholder="000000"
                          className="flex-1"
                          maxLength={6}
                          autoFocus
                          disabled={phoneValidationStatus === 'verifying'}
                        />
                        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                          <Button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={
                              phoneValidationStatus === 'verifying' ||
                              verificationCode.length !== 6
                            }
                            className="w-full md:w-auto"
                          >
                            {phoneValidationStatus === 'verifying' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Verifying...
                              </>
                            ) : (
                              'Submit'
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleCancelVerification}
                            variant="outline"
                            disabled={phoneValidationStatus === 'verifying'}
                            className="w-full md:w-auto"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                      {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
                      <div className="flex flex-col space-y-2 mt-2 md:flex-row md:space-y-0 md:justify-between md:items-center">
                        <p className="text-sm text-primary">
                          Enter the 6-digit code sent to your phone.
                        </p>
                        <Button
                          type="button"
                          onClick={handlePhoneValidation}
                          variant="outline"
                          size="sm"
                          disabled={['verifying', 'validating'].includes(
                            phoneValidationStatus
                          )}
                          className="w-full md:w-auto"
                        >
                          Resend Code
                        </Button>
                      </div>
                    </div>
                  )}

                  {phoneValidationError && (
                    <p className="text-sm text-destructive mt-1">
                      {phoneValidationError}
                    </p>
                  )}
                  {phoneValidationStatus === 'verified' && (
                    <p className="text-sm text-success mt-1">
                      ✓ Phone number verified and updated automatically!
                    </p>
                  )}
                  {phoneValidationStatus !== 'pending' &&
                    phoneValidationStatus !== 'verified' && (
                      <p className="text-sm text-tertiary mt-1">
                        Enter your mobile phone number to receive SMS
                        notifications. Verification is required.
                      </p>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-primary mb-3">
                  Notification Channels
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="emailEnabled">Email Notifications</Label>
                      <p className="text-sm text-tertiary">
                        {formData.phoneNumber
                          ? 'Receive notifications via email'
                          : 'Verify a phone number to disable email notifications'}
                      </p>
                    </div>
                    <Switch
                      id="emailEnabled"
                      checked={
                        formData.phoneNumber ? formData.emailEnabled : true
                      }
                      onCheckedChange={(checked) =>
                        handleNotificationChannelChange('emailEnabled', checked)
                      }
                      disabled={!formData.phoneNumber}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor="pushEnabled">Push Notifications</Label>
                        <p className="text-sm text-tertiary">
                          Receive push notifications on your device
                        </p>
                      </div>
                      <Switch
                        id="pushEnabled"
                        checked={formData.pushEnabled}
                        onCheckedChange={handlePushToggle}
                        disabled={pushLoading}
                      />
                    </div>
                    {pushPermissionDenied && !formData.pushEnabled && (
                      <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-warning">
                          Push notifications permission denied. To enable,
                          please allow notifications in your browser settings
                          and try again.
                        </p>
                      </div>
                    )}
                    {!pushStatus.supported && formData.pushEnabled && (
                      <div className="mt-2 p-3 bg-accent/10 border border-primary/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-primary">
                          Push notifications are not supported on this
                          device/browser, but your preference has been saved and
                          will apply to other devices where you&apos;re logged
                          in.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <Label htmlFor="smsEnabled">SMS Notifications</Label>
                      <p className="text-sm text-tertiary">
                        Receive notifications via SMS
                      </p>
                      <p className="text-xs text-tertiary mt-1">
                        By enabling, you consent to receive transactional
                        messages. Msg & data rates may apply.{' '}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          Privacy Policy & Terms
                        </a>
                      </p>
                    </div>
                    <Switch
                      id="smsEnabled"
                      checked={formData.smsEnabled}
                      onCheckedChange={(checked) =>
                        handleNotificationChannelChange('smsEnabled', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-primary mb-3">
                  Notification Types
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="groupDecisionsStarted">
                        Decision Started
                      </Label>
                      <p className="text-sm text-tertiary">
                        Get notified when a group decision is started
                      </p>
                    </div>
                    <Switch
                      id="groupDecisionsStarted"
                      checked={formData.groupDecisionsStarted}
                      onCheckedChange={(checked) =>
                        handleInputChange('groupDecisionsStarted', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="groupDecisionsCompleted">
                        Decision Completed
                      </Label>
                      <p className="text-sm text-tertiary">
                        Get notified when a group decision is finalized
                      </p>
                    </div>
                    <Switch
                      id="groupDecisionsCompleted"
                      checked={formData.groupDecisionsCompleted}
                      onCheckedChange={(checked) =>
                        handleInputChange('groupDecisionsCompleted', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="friendRequests">Friend Requests</Label>
                      <p className="text-sm text-tertiary">
                        Notifications about friend requests
                      </p>
                    </div>
                    <Switch
                      id="friendRequests"
                      checked={formData.friendRequests}
                      onCheckedChange={(checked) =>
                        handleInputChange('friendRequests', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="groupInvites">Group Invitations</Label>
                      <p className="text-sm text-tertiary">
                        Notifications about group invitations
                      </p>
                    </div>
                    <Switch
                      id="groupInvites"
                      checked={formData.groupInvites}
                      onCheckedChange={(checked) =>
                        handleInputChange('groupInvites', checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security & Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary mb-4">
                Manage your password, two-factor authentication, and other
                security settings.
              </p>
              <div className="flex items-center space-x-4">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                      userButtonPopoverCard: 'shadow-lg',
                    },
                  }}
                  userProfileMode="modal"
                  afterSignOutUrl="/"
                  userProfileProps={{
                    appearance: {
                      elements: {
                        rootBox: 'w-full',
                        card: 'shadow-lg',
                      },
                    },
                  }}
                />
                <div className="text-sm">
                  <p className="font-medium">
                    Click your avatar to manage security settings
                  </p>
                  <p className="text-tertiary">
                    Password, 2FA, connected accounts, and more
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={
                isUpdating ||
                (formData.defaultLocation && !isDefaultLocationValid
                  ? true
                  : false)
              }
              className="min-w-32"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
          {formData.defaultLocation && !isDefaultLocationValid && (
            <div className="flex justify-end mt-2">
              <p className="text-sm text-destructive">
                Please enter a valid address for your default location.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
