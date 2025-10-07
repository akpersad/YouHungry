'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { validateGroupName, validateGroupDescription } from '@/lib/validation';

interface CreateGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    memberEmails?: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateGroupForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateGroupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    email?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: 'name' | 'description', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    const email = currentEmail.trim();
    if (!email) return;

    if (!validateEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address',
      }));
      return;
    }

    if (memberEmails.includes(email)) {
      setErrors((prev) => ({ ...prev, email: 'This email is already added' }));
      return;
    }

    setMemberEmails((prev) => [...prev, email]);
    setCurrentEmail('');
    setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setMemberEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; description?: string } = {};

    const nameError = validateGroupName(formData.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    const descriptionError = validateGroupDescription(formData.description);
    if (descriptionError) {
      newErrors.description = descriptionError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        memberEmails: memberEmails.length > 0 ? memberEmails : undefined,
      });

      // Reset form on success
      setFormData({ name: '', description: '' });
      setMemberEmails([]);
      setCurrentEmail('');
      setErrors({});
      onClose();
    } catch (error) {
      logger.error('Error creating group:', error);
      // Error handling is done by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', description: '' });
      setMemberEmails([]);
      setCurrentEmail('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Group">
      <form onSubmit={handleSubmit} className="space-y-4" role="form">
        <div>
          <label
            htmlFor="group-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Group Name *
          </label>
          <Input
            id="group-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter group name"
            error={errors.name}
            disabled={isSubmitting || isLoading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="group-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="group-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your group..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
            } ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting || isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Member Invitation Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invite Members (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Add email addresses of people you want to invite to this group
          </p>

          <div className="flex space-x-2 mb-3">
            <Input
              type="email"
              value={currentEmail}
              onChange={(e) => {
                setCurrentEmail(e.target.value);
                // Clear email error when user starts typing
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter email address"
              error={errors.email}
              disabled={isSubmitting || isLoading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddEmail}
              disabled={isSubmitting || !currentEmail.trim()}
            >
              Add
            </Button>
          </div>

          {memberEmails.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Invited Members:
              </p>
              <div className="space-y-1">
                {memberEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <span className="text-sm text-gray-700">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      disabled={isSubmitting || isLoading}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || isLoading}
          >
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
