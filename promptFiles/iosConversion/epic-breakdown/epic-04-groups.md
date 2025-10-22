# Epic 4: Groups & Friend Management

**Goal**: Implement group creation, friend invitations, and group collections

**Duration**: 1-2 weeks (aggressive: 5-7 days)
**Priority**: 🟠 High
**Dependencies**: Epic 3 (Collections)

---

## 📖 Stories

### Story 4.1: Groups List & Creation

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Create Group model
- [ ] Implement GroupService
- [ ] Implement GroupsViewModel
- [ ] Create GroupsListView

  - List of user's groups
  - Group cards (name, member count, admin badge)
  - Create group button
  - Empty state

- [ ] Create CreateGroupView
  - Group name (required)
  - Description (optional)
  - Create button
  - Form validation

**Deliverables**:

- ✅ View all groups
- ✅ Create new group
- ✅ Group cards show member count
- ✅ Admin badge for groups where user is admin
- ✅ Works offline (cached groups)

---

### Story 4.2: Group Detail & Member Management

**Estimated Time**: 8-10 hours

**Tasks**:

- [ ] Create GroupDetailView

  - Group info (name, description, member count)
  - Members list with avatars
  - Collections for this group
  - Admin controls (if user is admin)
  - Leave group button

- [ ] Implement GroupDetailViewModel

  - Load group with members
  - Invite member (email)
  - Remove member (admin only)
  - Promote to admin (admin only)
  - Leave group

- [ ] Create InviteMemberView

  - Email input
  - Search users (optional)
  - Send invitation button

- [ ] Handle group invitations
  - Receive invitation notification
  - Accept/decline invitation
  - Join group on acceptance

**Deliverables**:

- ✅ Group detail view complete
- ✅ Can invite members by email
- ✅ Can remove members (admin)
- ✅ Can leave group
- ✅ Invitation system working

---

### Story 4.3: Friend Management (Optional)

**Estimated Time**: 6-8 hours
**Note**: Can be deferred to later if timeline is tight

**Tasks**:

- [ ] Create Friend request model
- [ ] Implement FriendService
- [ ] Create FriendsListView

  - Current friends
  - Pending requests
  - Add friend button

- [ ] Create AddFriendView

  - Search by email/username
  - Send friend request

- [ ] Handle friend requests
  - Receive notification
  - Accept/decline
  - View in friends list

**Deliverables**:

- ✅ Can send friend requests
- ✅ Can accept/decline requests
- ✅ Friends list displaying
- ✅ Can invite friends to groups easily

---

### Story 4.4: Group Collections

**Estimated Time**: 6-8 hours
**🔄 Can work in parallel with Story 4.2**

**Tasks**:

- [ ] Extend CollectionService for group collections
- [ ] Create group collection view

  - Similar to personal collections
  - Shows who added each restaurant
  - All members can add/remove (or admin-only, your choice)

- [ ] Implement permissions
  - Can all members add restaurants?
  - Or admin-only?
  - Document decision in code

**Deliverables**:

- ✅ Group collections working
- ✅ Members can collaborate
- ✅ Permissions enforced

---

## 🔄 Parallel Work Groups

**Week 1**:

- Day 1-3: Story 4.1 (Groups List) - Sequential, must be first
- Day 4-7: Stories 4.2 + 4.4 in parallel (Group Detail + Group Collections)

**Week 2** (if needed):

- Day 1-3: Story 4.3 (Friend Management) - Optional
- Day 4-7: Testing, polish, bug fixes

---

## ✅ Epic Completion Checklist

**Groups**:

- [ ] View all groups
- [ ] Create group
- [ ] Edit group details
- [ ] Delete group (admin only)
- [ ] Leave group

**Members**:

- [ ] View group members
- [ ] Invite members by email
- [ ] Remove members (admin)
- [ ] Promote to admin
- [ ] Accept/decline invitations

**Collections**:

- [ ] Create group collection
- [ ] Add restaurants to group collection
- [ ] All members see group collections
- [ ] Permissions working

**Testing**:

- [ ] Unit tests for GroupsViewModel
- [ ] Integration tests for group operations
- [ ] UI tests for group creation
- [ ] Offline mode tested

---

**Next**: [Epic 5: Decision Making](./epic-05-decisions.md)

**Groups make the app social! 👥**
