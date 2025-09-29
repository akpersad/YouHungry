import React from 'react';
import { render, screen } from '@testing-library/react';
import { GroupList } from '../GroupList';
import { Group } from '@/types/database';
import { ObjectId } from 'mongodb';

const mockGroups: Group[] = [
  {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    name: 'Test Group 1',
    description: 'A test group',
    adminIds: [new ObjectId('507f1f77bcf86cd799439012')],
    memberIds: [
      new ObjectId('507f1f77bcf86cd799439012'),
      new ObjectId('507f1f77bcf86cd799439013'),
    ],
    collectionIds: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    _id: new ObjectId('507f1f77bcf86cd799439014'),
    name: 'Test Group 2',
    description: 'Another test group',
    adminIds: [new ObjectId('507f1f77bcf86cd799439012')],
    memberIds: [new ObjectId('507f1f77bcf86cd799439012')],
    collectionIds: [new ObjectId('507f1f77bcf86cd799439015')],
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
  },
];

describe('GroupList', () => {
  const mockOnCreateGroup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    render(
      <GroupList
        groups={[]}
        isLoading={true}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    // Check for loading skeletons
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no groups', () => {
    render(
      <GroupList
        groups={[]}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    expect(screen.getByText('No groups yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create your first group to start collaborating with friends on restaurant decisions.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Create Group')).toBeInTheDocument();
  });

  it('should render groups list', () => {
    render(
      <GroupList
        groups={mockGroups}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    expect(screen.getByText('A test group')).toBeInTheDocument();
    expect(screen.getByText('Test Group 2')).toBeInTheDocument();
    expect(screen.getByText('Another test group')).toBeInTheDocument();
  });

  it('should display member count correctly', () => {
    render(
      <GroupList
        groups={mockGroups}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    expect(screen.getByText('2 members')).toBeInTheDocument();
    expect(screen.getByText('1 member')).toBeInTheDocument();
  });

  it('should display collection count correctly', () => {
    render(
      <GroupList
        groups={mockGroups}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    expect(screen.getByText('0 collections')).toBeInTheDocument();
    expect(screen.getByText('1 collection')).toBeInTheDocument();
  });

  it('should display creation date', () => {
    render(
      <GroupList
        groups={mockGroups}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    // Check that creation dates are displayed (format may vary by locale/timezone)
    expect(screen.getAllByText(/Created/)).toHaveLength(2);
  });

  it('should have View Group and Collections buttons', () => {
    render(
      <GroupList
        groups={mockGroups}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    const viewGroupButtons = screen.getAllByText('View Group');
    const collectionsButtons = screen.getAllByText('Collections');

    expect(viewGroupButtons).toHaveLength(2);
    expect(collectionsButtons).toHaveLength(2);
  });

  it('should call onCreateGroup when Create Group button is clicked', () => {
    render(
      <GroupList
        groups={[]}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    const createButton = screen.getByText('Create Group');
    createButton.click();

    expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('should handle groups without description', () => {
    const groupsWithoutDescription = [
      {
        ...mockGroups[0],
        description: undefined,
      },
    ];

    render(
      <GroupList
        groups={groupsWithoutDescription}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    // Description should not be rendered
    expect(screen.queryByText('A test group')).not.toBeInTheDocument();
  });

  it('should handle groups with empty description', () => {
    const groupsWithEmptyDescription = [
      {
        ...mockGroups[0],
        description: '',
      },
    ];

    render(
      <GroupList
        groups={groupsWithEmptyDescription}
        isLoading={false}
        onCreateGroup={mockOnCreateGroup}
      />
    );

    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    // Empty description should not be rendered
    expect(screen.queryByText('A test group')).not.toBeInTheDocument();
  });
});
