'use client';

import React from 'react';
import Link from 'next/link';
import { Group } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { UserAvatar } from '@/components/ui/UserAvatar';

interface GroupListProps {
  groups: Group[];
  isLoading?: boolean;
  onCreateGroup?: () => void;
}

export function GroupList({
  groups,
  isLoading,
  onCreateGroup,
}: GroupListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-quaternary rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-quaternary rounded w-2/3 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-quaternary rounded w-20"></div>
                <div className="h-8 bg-quaternary rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-secondary mb-4">
          <svg
            className="mx-auto h-12 w-12 text-text-light"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-primary mb-2">No groups yet</h3>
        <p className="text-secondary mb-4">
          Create your first group to start collaborating with friends on
          restaurant decisions.
        </p>
        {onCreateGroup && (
          <Button onClick={onCreateGroup} variant="primary">
            Create Group
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card
          key={group._id.toString()}
          className="p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-primary">
                  {group.name}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-blue-800">
                  {group.memberIds.length} member
                  {group.memberIds.length !== 1 ? 's' : ''}
                </span>
              </div>

              {group.description && (
                <p className="text-secondary text-sm mb-3">
                  {group.description}
                </p>
              )}

              <div className="flex items-center space-x-2 mb-3">
                <span className="text-sm text-secondary">
                  {group.collectionIds.length} collection
                  {group.collectionIds.length !== 1 ? 's' : ''}
                </span>
                <span className="text-text-light">•</span>
                <span className="text-sm text-secondary">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Link href={`/groups/${group._id}`}>
                  <Button variant="primary" size="sm">
                    View Group
                  </Button>
                </Link>
                <Link href={`/groups/${group._id}/collections`}>
                  <Button variant="secondary" size="sm">
                    Collections
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
