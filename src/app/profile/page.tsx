'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
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
import { toast } from 'sonner';
import {
  Loader2,
  Camera,
  Phone,
  MapPin,
  Bell,
  Shield,
  Upload,
  X,
  Check,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    isUpdating,
    uploadPicture,
    isUploading,
    removePicture,
    isRemoving,
  } = useProfile();

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
    groupDecisions: true,
    friendRequests: true,
    groupInvites: true,
    smsEnabled: false,
    emailEnabled: true,
    pushEnabled: true,
  });

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
        groupDecisions:
          profile.preferences?.notificationSettings?.groupDecisions ?? true,
        friendRequests:
          profile.preferences?.notificationSettings?.friendRequests ?? true,
        groupInvites:
          profile.preferences?.notificationSettings?.groupInvites ?? true,
        smsEnabled:
          profile.preferences?.notificationSettings?.smsEnabled ?? false,
        emailEnabled:
          profile.preferences?.notificationSettings?.emailEnabled ?? true,
        pushEnabled:
          profile.preferences?.notificationSettings?.pushEnabled ?? true,
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const handleSave = async () => {
    // Validate default location if it's provided
    if (formData.defaultLocation && !isDefaultLocationValid) {
      // Error handling is done in the hook
      return;
    }

    try {
      await updateProfile({
        name: formData.name,
        username: formData.username,
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
            groupDecisions: formData.groupDecisions,
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadPicture(file);
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleRemovePicture = async () => {
    try {
      await removePicture();
    } catch {
      // Error handling is done in the hook
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading your profile.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Not Signed In
          </h2>
          <p className="text-gray-600 mb-4">
            Please sign in to view your profile.
          </p>
          <Button onClick={() => (window.location.href = '/sign-in')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">
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
                  profilePicture={profile?.profilePicture}
                  size="lg"
                />
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Picture
                          </>
                        )}
                      </Button>
                      {profile?.profilePicture && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemovePicture}
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Upload a JPEG, PNG, or WebP image (max 5MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
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
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange('username', e.target.value)
                    }
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={profile?.email || ''} disabled />
                <p className="text-sm text-gray-500 mt-1">
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
                <p className="text-sm text-gray-500 mt-1">
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
                  <div className="flex space-x-2">
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
                    {/* Show verify button if phone number has changed from verified number */}
                    {normalizePhoneNumber(formData.phoneNumber) !==
                    normalizePhoneNumber(profile?.phoneNumber || '') ? (
                      phoneValidationStatus === 'pending' ? (
                        <div className="flex items-center text-amber-600 font-medium px-4 whitespace-nowrap">
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
                      )
                    ) : (
                      /* Show verified badge if number matches profile */
                      <div className="flex items-center text-green-600 font-medium px-4">
                        <Check className="h-5 w-5 mr-2" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Show verification code input when pending or verifying */}
                  {(phoneValidationStatus === 'pending' ||
                    phoneValidationStatus === 'verifying') && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label htmlFor="verificationCode">
                        Verification Code
                      </Label>
                      <div className="flex space-x-2 mt-2">
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
                        <Button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={
                            phoneValidationStatus === 'verifying' ||
                            verificationCode.length !== 6
                          }
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
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-blue-600">
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
                        >
                          Resend Code
                        </Button>
                      </div>
                    </div>
                  )}

                  {phoneValidationError && (
                    <p className="text-sm text-red-500 mt-1">
                      {phoneValidationError}
                    </p>
                  )}
                  {phoneValidationStatus !== 'pending' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {normalizePhoneNumber(formData.phoneNumber) ===
                      normalizePhoneNumber(profile?.phoneNumber || '')
                        ? 'Verified phone number for SMS notifications. Edit to change and re-verify.'
                        : 'Enter your phone number and click Verify to enable SMS notifications.'}
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
                  <p className="text-sm text-gray-500 mt-1">
                    No verified phone number yet. Enable SMS notifications below
                    to verify a number.
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="smsOptIn"
                  checked={formData.smsOptIn}
                  onCheckedChange={(checked) =>
                    handleInputChange('smsOptIn', checked)
                  }
                />
                <Label htmlFor="smsOptIn">Enable SMS Notifications</Label>
              </div>

              {/* Show SMS Phone Number field only if no verified number and SMS is enabled */}
              {formData.smsOptIn && !formData.phoneNumber && (
                <div>
                  <Label htmlFor="smsPhoneNumber">SMS Phone Number</Label>
                  <div className="flex space-x-2">
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
                      <div className="flex items-center text-amber-600 font-medium px-4 whitespace-nowrap">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Pending
                      </div>
                    ) : phoneValidationStatus === 'verified' ? (
                      <div className="flex items-center text-green-600 font-medium px-4">
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
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label htmlFor="verificationCodeSMS">
                        Verification Code
                      </Label>
                      <div className="flex space-x-2 mt-2">
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
                        <Button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={
                            phoneValidationStatus === 'verifying' ||
                            verificationCode.length !== 6
                          }
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
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-blue-600">
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
                        >
                          Resend Code
                        </Button>
                      </div>
                    </div>
                  )}

                  {phoneValidationError && (
                    <p className="text-sm text-red-500 mt-1">
                      {phoneValidationError}
                    </p>
                  )}
                  {phoneValidationStatus === 'verified' && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Phone number verified and updated automatically!
                    </p>
                  )}
                  {phoneValidationStatus !== 'pending' &&
                    phoneValidationStatus !== 'verified' && (
                      <p className="text-sm text-gray-500 mt-1">
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
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Notification Channels
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailEnabled">Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="emailEnabled"
                      checked={formData.emailEnabled}
                      onCheckedChange={(checked) =>
                        handleInputChange('emailEnabled', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushEnabled">Push Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive push notifications on your device
                      </p>
                    </div>
                    <Switch
                      id="pushEnabled"
                      checked={formData.pushEnabled}
                      onCheckedChange={(checked) =>
                        handleInputChange('pushEnabled', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsEnabled">SMS Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      id="smsEnabled"
                      checked={formData.smsEnabled}
                      onCheckedChange={(checked) =>
                        handleInputChange('smsEnabled', checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Notification Types
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="groupDecisions">Group Decisions</Label>
                      <p className="text-sm text-gray-500">
                        Notifications about group decision making
                      </p>
                    </div>
                    <Switch
                      id="groupDecisions"
                      checked={formData.groupDecisions}
                      onCheckedChange={(checked) =>
                        handleInputChange('groupDecisions', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="friendRequests">Friend Requests</Label>
                      <p className="text-sm text-gray-500">
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
                      <p className="text-sm text-gray-500">
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
              <p className="text-sm text-gray-600 mb-4">
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
                  <p className="text-gray-500">
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
              <p className="text-sm text-red-600">
                Please enter a valid address for your default location.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
