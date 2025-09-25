# User Experience Flows

This document outlines the major user journeys and flows for the You Hungry? app. Each flow includes the key screens, user actions, and system responses.

## 1. Registration & Onboarding Flow

### 1.1 New User Registration

1. **Landing Page** → User clicks "Sign Up"
2. **Registration Page** → User enters email, password, name
3. **SMS Opt-in Prompt** → User can toggle SMS notifications (default: off)
4. **Location Permission** → User grants/denies location access
5. **Redirect to Dashboard** → User sees empty state with "Create Your First Collection" CTA

Notes: Love it

### 1.2 Returning User Login

1. **Landing Page** → User clicks "Sign In"
2. **Login Page** → User enters credentials
3. **Redirect to Dashboard** → User sees their collections and recent activity

Notes: Love it

## 2. Personal Collection Management

### 2.1 Create Collection

1. **Dashboard** → User clicks "Create Collection" button
2. **Create Collection Modal** → User enters collection name (defaults to "Collection 1")
3. **Validation** → System checks name uniqueness and character limit (50 chars)
4. **Success** → Collection appears in dashboard, user can add restaurants

Notes: Love it

### 2.2 Add Restaurant to Collection

1. **Collection View** → User clicks "Add Restaurant" button
2. **Restaurant Search** → User searches by name or location
3. **Search Results** → User sees list of restaurants with basic info
4. **Restaurant Details** → User can add custom fields (Price Range, Time to Pick Up)
5. **Add to Collection** → User selects which collection(s) to add to
6. **Success** → Restaurant appears in selected collection(s)

Notes: Love it

### 2.3 Make Personal Decision

1. **Collection View** → User clicks "Decide for Me" button
2. **Decision Options** → User chooses:
   - Tiered choice (rank top 3)
   - Random selection from all restaurants
   - Random selection from specific collection
3. **Decision Result** → System shows selected restaurant with reasoning
4. **History Update** → Decision is logged in personal history

Notes: Love it

## 3. Group Management

### 3.1 Create Group

1. **Groups Page** → User clicks "Create Group" button
2. **Group Setup** → User enters group name and description
3. **Add Members** → User searches for friends by email/username
4. **Invite Sent** → Friends receive notification to join group
5. **Group Created** → User becomes admin, can create group collections

Notes: Love it

### 3.2 Join Group

1. **Invitation Notification** → User receives group invite
2. **Group Preview** → User sees group name, members, collections
3. **Accept/Decline** → User joins group or declines invite
4. **Group Access** → User can view group collections and participate in decisions

Notes: Love it

### 3.3 Add Friend

1. **Friends Page** → User clicks "Add Friend" button
2. **Search Friend** → User searches by email or username
3. **Send Request** → Friend request is sent
4. **Friend Accepts** → Users can now add each other to groups

Notes: Love it

## 4. Group Decision Making

### 4.1 Tiered Choice Decision

1. **Group Collection** → Admin clicks "Start Decision" button
2. **Decision Setup** → Admin sets:
   - Decision deadline (default: 24 hours, max: 2 weeks)
   - Restaurant visit date/time (when group will actually go)
3. **Member Notification** → All members notified (SMS if opted-in)
4. **Ranking Phase** → Each member ranks their top 3 choices
5. **Voting Results** → System calculates majority winner
6. **Tie Resolution** → If tie, members choose between tied options
7. **Final Decision** → Winner announced with visit context, logged in group and individual histories

Notes: Love it. Though I realized on the make a decision flow, a user should also indicate when the restaurant choice will be. (There'll be two date/times - one when a decision will be made and when that group will be going to the restaurant)

### 4.2 Random Selection Decision

1. **Group Collection** → Any admin clicks "Random Pick" button
2. **Selection Options** → Admin chooses:
   - All group collections
   - Specific collection
   - All personal collections
3. **Decision Setup** → Admin sets:
   - Restaurant visit date/time (when group will actually go)
4. **Weighted Selection** → System applies 30-day rolling weights
5. **Decision Result** → Selected restaurant shown to all members with visit context
6. **History Update** → Decision logged in group and individual histories

Notes: Love it. Admin can refer to any one in that group that is an admin, not just the one that started the decision.

### 4.3 Decision Timeout Handling

1. **Time Expires** → System checks if anyone has voted
2. **No Votes** → Random selection from available restaurants
3. **Partial Votes** → Continue with tiered choice logic using available votes
4. **Notification** → All members notified of final decision

Notes: Love it

## 5. Restaurant Search & Discovery

### 5.1 Search by Location

1. **Search Page** → User enters address or uses current location
2. **Location Validation** → Google Address API validates address
3. **Restaurant Results** → Google Places API returns nearby restaurants
4. **Filter Options** → User can filter by cuisine, rating, price range
5. **Restaurant Selection** → User clicks restaurant to view details
6. **Add to Collections** → User can add to multiple collections

Notes: Love it

### 5.2 Search by Name

1. **Search Page** → User types restaurant name
2. **Search Results** → System shows matching restaurants
3. **Restaurant Details** → User views full restaurant information
4. **Add to Collections** → User adds restaurant to desired collections

Notes: Love it

## 6. Profile & Settings

### 6.1 Profile Management

1. **Profile Page** → User views current profile information
2. **Edit Profile** → User can update name, city, profile picture
3. **SMS Settings** → User can toggle SMS notifications per group
4. **Location Settings** → User can update default location
5. **Save Changes** → Profile updates are saved

Notes: Love it

### 6.2 History View

1. **History Page** → User sees chronological list of decisions with both calendar and list views
2. **View Options** → User can toggle between:
   - Timeline/list view (recent decisions in simple list, older grouped by week/month)
   - Calendar view (decisions plotted on calendar dates)
3. **Filter Options** → User can filter by personal/group decisions
4. **Decision Details** → User can view full decision context including visit date/time
5. **Manual Entry** → User can add decisions made outside the app
6. **Search** → User can search for specific restaurants or groups

Notes: Love it. We'll play with the UI of the chronlogical view. I'm undecidied what that'll look like, if it's like a calendar or a list.

## 7. PWA Offline Experience

### 7.1 Offline Viewing

1. **Cached Data** → User can view previously loaded collections
2. **Offline Indicator** → App shows when offline
3. **Sync Queue** → Actions queued for when connection returns
4. **Background Sync** → App syncs when connection restored

Notes: Love it

### 7.2 Offline Decision Making

1. **Cached Restaurants** → User can make decisions with cached data
2. **Decision Logging** → Decisions stored locally until sync
3. **Sync Notification** → User notified when decisions are synced

Notes: Love it

## 8. Error Handling & Edge Cases

### 8.1 Network Errors

1. **Connection Lost** → App shows offline mode
2. **API Failures** → User sees retry options
3. **Sync Conflicts** → App handles data conflicts gracefully

Notes: Love it

### 8.2 Group Decision Edge Cases

1. **Member Leaves** → Group continues with remaining members
2. **Admin Leaves** → Another member promoted to admin
3. **Empty Collections** → System prevents decisions on empty collections
4. **All Restaurants Chosen Recently** → System uses minimum weights

Notes: Love it

## 9. Mobile-First Considerations

### 9.1 Touch Interactions

1. **Swipe Gestures** → Swipe to delete, swipe to reorder
2. **Long Press** → Context menus for advanced actions
3. **Pull to Refresh** → Refresh data on collection views

Notes: Love it

### 9.2 Responsive Design

1. **Mobile Layout** → Single column, large touch targets
2. **Tablet Layout** → Two-column layout for better space usage
3. **Desktop Layout** → Multi-column layout with sidebar navigation

Notes: Love it

## 10. Accessibility Features

### 10.1 Screen Reader Support

1. **ARIA Labels** → All interactive elements properly labeled
2. **Focus Management** → Logical tab order and focus indicators
3. **Announcements** → Important changes announced to screen readers

Notes: Love it

### 10.2 Keyboard Navigation

1. **Tab Navigation** → All features accessible via keyboard
2. **Keyboard Shortcuts** → Common actions have keyboard shortcuts
3. **Focus Indicators** → Clear visual focus indicators

Notes: Love it

## Notes for Implementation

- All flows should include loading states and error handling
- Forms should have real-time validation
- Success/error messages should be clear and actionable
- Navigation should be consistent across all flows
- Data should be cached aggressively to minimize API calls
- All user actions should be logged for analytics and debugging
