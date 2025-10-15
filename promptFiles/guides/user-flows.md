# User Experience Flows

This document outlines the major user journeys and flows for the You Hungry? app. Each flow includes the key screens, user actions, and system responses.

## 1. Registration & Onboarding Flow

### 1.1 New User Registration (UPDATED ✅ FULLY CUSTOM FLOW IMPLEMENTED)

1. **Landing Page** → User clicks "Sign Up"
2. **Custom Registration Page** → User sees app benefits explanation and custom registration form at `/sign-up`
3. **App Benefits Display** → Clear explanation of features (collections, group decisions, recommendations, etc.)
4. **Custom Registration Form** → User enters:
   - First name (required)
   - Last name (required)
   - Email address (required)
   - Username (required - 4-64 characters, validated for availability)
   - Password (required - 10-72 characters)
   - Confirm password (required - must match)
   - City (optional)
   - State (optional)
   - Phone number (optional - formatted as (XXX) XXX-XXXX)
   - Country code (default +1 for US)
   - SMS opt-in checkbox (optional)
5. **Real-time Validation** → Form validates fields on blur:
   - Email format validation
   - Username availability check via `/api/auth/check-username`
   - Password strength validation (10-72 characters)
   - Phone number format validation (10 digits)
   - Visual success indicators (✓ checkmarks) for valid fields
6. **Form Submission** → Uses Clerk's client-side SDK (`useSignUp` hook):
   - Creates user in Clerk with all profile information
   - Stores custom fields (phone, SMS opt-in, location) in `unsafeMetadata`
   - Triggers email verification code sending
7. **In-Form Email Verification** → User stays on same form:
   - Form transitions to verification state
   - Shows email icon and "Check Your Email" heading
   - Displays 6-digit code input field
   - User enters verification code from email
   - Can resend code after 60-second cooldown
8. **Verification Completion** → On successful verification:
   - Clerk activates the session
   - User automatically redirected to `/dashboard`
9. **Webhook Sync** → Clerk webhook creates MongoDB user record:
   - Captures all profile data including phone and SMS preferences
   - Sets up default notification settings
   - Creates user preferences structure

**Key Features Implemented**:

- Fully custom registration form using Clerk's client-side SDK (`useSignUp` hook)
- In-line email verification within the form (no page redirect)
- Real-time field validation with visual feedback
- Username availability checking with API endpoint `/api/auth/check-username`
- Phone number formatting with country code selection
- SMS opt-in with clear benefits explanation
- Location preferences (city/state) collected during registration
- Clerk webhook (`/api/webhooks/clerk`) creates MongoDB user with custom fields
- Phone number stored in MongoDB via webhook (in `unsafeMetadata`)
- 6-digit verification code with resend functionality
- Client-side form validation with comprehensive error messages
- Mobile responsive design optimized for all devices

**Technical Implementation**:

- Form component: `src/components/forms/CustomRegistrationForm.tsx` (uses Clerk's `useSignUp` hook)
- Username check API: `src/app/api/auth/check-username/route.ts`
- Webhook handler: `src/app/api/webhooks/clerk/route.ts` (creates MongoDB user)
- Verification fallback page: `src/app/sign-up/verify/page.tsx` (for external verification)
- Sign-up page: `src/app/sign-up/[[...rest]]/page.tsx`

Notes: ✅ COMPLETED - Fully custom registration form with Clerk client-side SDK integration and in-line email verification

### 1.2 Returning User Login (UPDATED ✅ IMPLEMENTED)

1. **Landing Page** → User clicks "Sign In"
2. **Custom Login Page** → User sees custom sign-in page at `/sign-in` with consistent branding
3. **Registration Success Message** → If redirected with `?registered=true`, shows success banner
4. **Page Header** → Displays "Welcome Back" and "Sign in to continue to ForkInTheRoad"
5. **Back to Home Button** → User can navigate back to home page
6. **Clerk Sign-in Component** → Clerk's `<SignIn />` component with custom styling:
   - Transparent background to match app theme
   - Custom color variables for primary, background, text colors
   - Hidden default header/subtitle (using custom header instead)
   - Styled form inputs, buttons, and validation messages
   - Social login buttons styled to match design system
7. **Authentication** → User enters credentials (email/username and password)
8. **Redirect to Dashboard** → After successful sign-in, redirected to `/dashboard`
9. **Additional Info** → Terms of Service and Privacy Policy notice

**Key Features Implemented**:

- Custom sign-in page at `/sign-in` route with wrapped Clerk component
- Success message displayed when coming from registration (`?registered=true` query param)
- Clerk `<SignIn />` component with extensive appearance customization
- CSS custom properties for theming (--color-primary, --color-background, etc.)
- Back to home navigation button
- Mobile responsive design with centered layout
- Suspense boundary for loading state
- Consistent design system integration

**Technical Implementation**:

- Sign-in page: `src/app/sign-in/[[...rest]]/page.tsx`
- Uses Clerk's `<SignIn />` component with appearance configuration
- AuthButtons component: `src/components/auth/AuthButtons.tsx` (links to custom pages)
- Fallback redirect: `/dashboard`
- Sign-up link: `/sign-up` (integrated in Clerk component)

Notes: ✅ COMPLETED - Custom sign-in page with Clerk component and extensive styling customization

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

### 4.1 Tiered Choice Decision (IMPLEMENTED ✅)

1. **Group Collection** → Admin clicks "Start Decision" button
2. **Decision Setup** → Admin sets:
   - Visit date/time (when group will actually go to restaurant)
   - Decision method (Tiered Choice selected)
   - Deadline (1-336 hours, default: 24 hours)
3. **Real-time Notification** → All group members see decision appear instantly
4. **Voting Interface** → Each member:
   - Clicks "Vote" button to open ranking interface
   - Drags and drops restaurants to rank their top 3 choices
   - Submits vote with visual confirmation ("✓ You've Voted")
   - Can re-vote until decision is closed
5. **Live Updates** → All members see real-time vote counts and status
6. **Decision Completion** → Admin clicks "Complete" when ready:
   - System calculates weighted scores based on vote positions
   - Selects restaurant with highest weighted score
   - Shows selected restaurant with detailed info (address, phone, rating, price)
   - Displays reasoning for selection
7. **Result Display** → Completed decision shows for 24 hours after visit date
8. **History Logging** → Decision logged in group and individual histories

**Key Features Implemented**:

- Real-time WebSocket updates for live collaboration
- Drag-and-drop ranking interface with visual feedback
- Weighted scoring algorithm (1st place = 3 points, 2nd = 2 points, 3rd = 1 point)
- Vote status indicators and re-voting capability
- Detailed restaurant information display
- 24-hour visibility window for completed decisions

### 4.2 Random Selection Decision (IMPLEMENTED ✅)

1. **Group Collection** → Admin clicks "Start Decision" button
2. **Decision Setup** → Admin sets:
   - Visit date/time (when group will actually go to restaurant)
   - Decision method (Random Selection selected)
   - Deadline (1-336 hours, default: 24 hours)
3. **Immediate Selection** → System:
   - Applies 30-day rolling weights to avoid recent selections
   - Randomly selects restaurant based on weighted probabilities
   - Shows selected restaurant with detailed information
4. **Result Display** → All members see selected restaurant instantly
5. **History Logging** → Decision logged in group and individual histories

**Key Features Implemented**:

- Weighted random selection with 30-day rolling system
- Immediate decision result display
- Restaurant details with address, phone, rating, price
- Reasoning explanation for selection

### 4.3 Decision Management (IMPLEMENTED ✅)

1. **Admin Controls** → Group admins can:
   - Start new decisions (tiered or random)
   - Complete tiered decisions when votes are in
   - Close decisions without completion
   - View all decision statuses and vote counts
2. **Member Participation** → All group members can:
   - Vote on tiered decisions
   - View decision results and restaurant details
   - See vote status and participant counts
3. **Real-time Updates** → All participants see:
   - Live vote counts and participant status
   - Real-time decision status changes
   - Automatic UI updates when votes are submitted
4. **Decision Visibility** → System shows:
   - Active decisions with voting interface
   - Recently completed decisions (24 hours after visit date)
   - Closed decisions are hidden from main display

**Key Features Implemented**:

- Real-time WebSocket subscriptions for live updates
- Fallback query system for connection reliability
- Admin-only controls for decision management
- Automatic participant deduplication
- Connection error handling with graceful fallbacks

### 4.4 Decision Timeout Handling (PLANNED)

1. **Time Expires** → System checks if anyone has voted
2. **No Votes** → Random selection from available restaurants
3. **Partial Votes** → Continue with tiered choice logic using available votes
4. **Notification** → All members notified of final decision

Notes: This feature is planned for future implementation

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

### 6.1 Profile Management (IMPLEMENTED ✅)

1. **Profile Page** → User navigates to `/profile` to view comprehensive profile settings
2. **Profile Information** → User can update name, username, city, and state
3. **Profile Picture Management** → User can view profile picture (managed through Clerk account)
4. **Phone Number Management** → User can manage phone number with verification flow
5. **SMS Preferences** → User can toggle SMS notifications with clear explanations
6. **Notification Preferences** → User can configure per-group notification settings
7. **Location Settings** → User can set default location and location preferences
8. **Push Notification Settings** → User can configure push notification preferences
9. **Save Changes** → All profile updates are saved with validation and error handling

**Key Features Implemented**:

- Complete profile page at `/profile` route with comprehensive user settings
- Clerk integration for profile picture display (synced from Clerk account)
- Phone number verification flow with Twilio SMS integration
- SMS opt-in/opt-out toggle with clear explanations and benefits
- Per-group notification preferences interface
- Location settings and default location management
- Push notification preferences in profile settings
- Comprehensive validation and error handling
- Real-time updates with TanStack Query integration
- Mobile-responsive design with accessibility features

Notes: ✅ COMPLETED - Complete user profile management system with Clerk-managed pictures, preferences, and settings

### 6.2 Phone Number Verification Flow (IMPLEMENTED ✅)

**Initial Setup (No Verified Number)**:

1. **Profile Page** → User sees "Enable SMS Notifications" toggle
2. **Toggle SMS** → User enables SMS notifications
3. **Phone Input Field** → SMS phone number input field appears
4. **Enter Number** → User enters phone number (formatted as "1 (XXX) XXX-XXXX")
5. **Click Verify** → User clicks "Verify" button to start verification

**Verification Process**: 6. **Send Code** → System sends 6-digit verification code via Twilio SMS 7. **Verification UI** → Blue verification panel appears with:

- Code input field (6 digits)
- Submit button
- Cancel button
- Resend code option

8. **Enter Code** → User enters 6-digit verification code
9. **Submit Code** → User clicks "Submit" to verify
10. **Verification Success** → System:
    - Updates phone number in database
    - Shows green "✓ Phone number verified and updated automatically!" message
    - Moves verified number to main phone number field
    - Shows "Verified" badge next to phone number
11. **Auto-close Panel** → Verification panel closes, user can now save profile

**Editing Verified Number**:

1. **Edit Number** → User modifies their verified phone number
2. **Verify Badge Changes** → "Verified" badge changes to "Verify" button
3. **Re-verification** → User must verify the new number before saving
4. **Same Flow** → Follows same verification process as initial setup

**Cancel Verification**:

1. **Cancel Button** → User can click "Cancel" during verification
2. **Clear State** → System clears verification code and pending number
3. **Return to Edit** → User can continue editing without verification

**Resend Code**:

1. **Resend Button** → User can click "Resend Code" if code wasn't received
2. **New Code** → System sends new 6-digit code via SMS
3. **Continue Verification** → User enters new code to verify

**Key Features Implemented**:

- Real-time phone number formatting with US format (1 (XXX) XXX-XXXX)
- Twilio SMS integration for verification code delivery
- 6-digit verification code system
- Verification state management (idle → validating → pending → verifying → verified)
- Inline verification UI with clear instructions
- Resend code functionality
- Cancel verification option
- Visual status indicators (loading, verified, pending)
- Automatic profile update on successful verification
- Phone number normalization and validation
- Error handling for failed verification attempts
- Development mode displays verification code in toast for testing

**API Endpoints**:

- `POST /api/user/verify-phone` - Sends verification code via SMS
- `PUT /api/user/verify-phone` - Verifies code and updates phone number

**Validation Rules**:

- Phone number must be 10-15 digits
- Must follow international E.164 format
- US numbers automatically formatted with country code
- Verification code must be exactly 6 digits
- Code expires based on Twilio settings

Notes: ✅ COMPLETED - Full phone verification flow with Twilio SMS integration

### 6.3 History View & Manual Entry

1. **History Page** → User navigates to `/history` to view comprehensive decision history
2. **View Options** → User can toggle between:
   - List view (detailed cards with restaurant info, dates, and context)
   - Calendar view (decisions plotted on calendar dates - UI placeholder)
3. **Filter Options** → User can filter by:
   - Decision type (personal/group/all)
   - Date range (start and end dates)
   - Collection, group, or specific restaurant
4. **Search Functionality** → Real-time search across restaurants, collections, and groups
5. **Export Options** → Download history as CSV or JSON for external analysis
6. **Pagination** → Efficient pagination showing 50 decisions per page
7. **Decision Details** → Each decision card shows:
   - Restaurant name, address, cuisine, rating, price range
   - Visit date (when they actually went to the restaurant)
   - Decision type (personal/group) and collection name
   - Decision method (Random Selection, Tiered Choice, or manually entered)
   - Group name (for group decisions)

#### Manual Entry Flow (IMPLEMENTED ✅)

1. **Open Manual Entry** → User clicks "Add Manual Entry" button on history page
2. **Modal Opens** → ManualDecisionForm displays in a modal overlay
3. **Select Decision Type** → User chooses:
   - Personal decision
   - Group decision (requires selecting a group)
4. **Select Group (if applicable)** → Dropdown shows user's groups
5. **Select Restaurant** → User chooses from available restaurants in their collections:
   - For personal: Shows restaurants from all personal collections
   - For group: Shows restaurants from selected group's collections
   - Restaurants are sorted alphabetically for easy selection
   - If no collections with restaurants exist, helpful message is shown
6. **Choose Visit Date** → Date picker with validation:
   - Can only select past dates (up to today)
   - Date represents when they actually visited the restaurant
7. **Add Notes (Optional)** → Text area for additional context:
   - Notes about the meal, experience, or why they went
   - Stored in decision's `result.reasoning` field
8. **Validation & Submit** → System validates:
   - Restaurant must exist in user's/group's collections
   - User must be a group member (for group decisions)
   - All required fields must be filled
9. **Success** → Decision is saved with:
   - Status: `completed`
   - Method: `manual`
   - Visit date as specified
   - Notes in result.reasoning
10. **History Update** → Decision immediately appears in history view
11. **Weight System Integration** → Manual decision affects 30-day rolling weights

**Key Features Implemented**:

- Dynamic restaurant loading based on selected type/group
- Real-time form validation with clear error messages
- Loading states during submission
- Automatic cache invalidation after creation
- Integration with existing decision history system
- Support for both personal and group contexts
- Notes field for rich historical context

Notes: Manual entry system fully implemented and integrated with history tracking and weight system.

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
