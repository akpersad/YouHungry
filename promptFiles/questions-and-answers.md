# Questions & Answers Log - You Hungry? App

This document captures all questions asked during development and the decisions made, serving as a reference for future development and decision-making.

## 🎯 Core Functionality Decisions

### Q: What should we call "buckets" instead of "buckets"?

**A**: Collections. Users can give custom names, but they'll default to numbered (Collection 1, Collection 2, etc.)

### Q: What specific information should we store for restaurants beyond name and location?

**A**: Cuisine, Rating, and two custom optional fields:

- Price Range: Dropdown of $ - $$$$
- Time To Pick Up: Custom number input representing minutes

### Q: When groups make decisions, should there be a time limit for members to submit their rankings?

**A**: Default to 24 hours after a "decision" has been initiated. The user who started the decision should be given an "End Time" input that dictates. Maximum should be 2 weeks from current date.

### Q: For the "not chosen recently" weighting, what time period should we consider?

**A**: Rolling 30 days.

### Q: For group decisions, do you want real-time updates (WebSocket) or is polling/refresh sufficient?

**A**: Polling/refresh is fine. We can achieve most functionality with a fraction of the complexity.

### Q: Should I structure the codebase to make iOS app transition easier?

**A**: Yes, but not React Native. Keep components mobile-focused. I will ask you to do the conversion when the time comes, so keep that in mind for how you build.

### Q: Should the app work offline for viewing existing data, or is online-only acceptable?

**A**: I like the idea of it being a PWA. I want to explore that. Offline bits seems cool.

## 🔧 Technical Architecture Decisions

### Q: Which should be the primary restaurant data source - Google Places or Yelp?

**A**: Google Places for location data and Yelp for reviews/menus.

### Q: Should users be required to enter their address, or can we use location services to auto-detect?

**A**: Users can have their location auto-detected but also be able to enter an address because there may be times that they're future planning or looking for a specific restaurant.

### Q: For text notifications, should this be optional per user, or always enabled for group decisions?

**A**: Users should need to opt-in to receive SMS messages.

### Q: What character limit would be appropriate for collection names?

**A**: 50 characters - enough for descriptive names but not too long for mobile display.

### Q: Should there be an onboarding flow for new registrations?

**A**: No onboarding flow for the web version. We can have something guided in the iOS version. SMS opt-in can be offered on the registration page and toggled on their profile page.

### Q: For batching Google Places API calls, what delay would be acceptable?

**A**: Very acceptable. The delay would be minimal (under 100ms) as we'd batch requests within a short time window (200-500ms).

### Q: Which component library approach should we use for cross-platform compatibility?

**A**: Honestly, none. Let's use Tailwind for web and revisit when we approach the iOS app. No need to try to fit two different pegs in the same hole.

### Q: What's your preference for state management for iOS port?

**A**: Let's revisit when we're building iOS. For now, let's use what makes most sense for the Next.js app. I believe that would be context and the database.

## 📱 User Experience Decisions

### Q: For the custom fields (Price Range dropdown and Time To Pick Up), should these be required or optional when adding a restaurant?

**A**: Optional, editable, visible to all.

### Q: When a user starts a decision with a custom end time, should other group members be notified immediately?

**A**: They should only be notified if they've opted into SMS, otherwise they'll just find it in their "Active Decisions" section. When we turn this into an iOS app, I'll remove SMS options and go with native notifications.

### Q: Should the End Time be editable if needed?

**A**: Yes, the End Time should always be editable (unless the decision is closed) but you should not be able to choose a past time.

### Q: If no one has made a selection by the end time, what should happen?

**A**: If no one has made a selection, choose randomly. If anyone has made a selection, go down the decision flow.

### Q: For the PWA features, what specific offline capabilities are most important?

**A**: Yes to viewing existing collections and restaurants, making decisions with cached data. No to adding new restaurants to collections. Don't care one way or the other for basic viewing of previously loaded data.

### Q: For the 30-day rolling weighting system, should the weighting be exponential or linear?

**A**: Exponential. Yes, everything should always have a chance of being chosen, no matter how small. Yes, the weighting should reset if a restaurant hasn't been chosen in 30+ days.

### Q: For Twilio integration, should users be prompted to opt-in during onboarding or when they join their first group?

**A**: During onboarding. Yeah, opt-in control per group. Yes, the app should definitely work fully without SMS, SMS should only enhance the experience.

## 💰 Cost Optimization Decisions

### Q: Given your emphasis on minimizing API costs, should I implement aggressive caching for Google Places data?

**A**: Yes, as aggressive as possible. I'm expecting the use of restaurants to just be a reminder, not for minute by minute up to date information. Sure, batch if that makes sense? How much of a delay would that cause the end user? If it's trivial, then yes! Love stale-while-revalidate; let's do it.

### Q: Should I implement a local database to store frequently accessed restaurant data?

**A**: Yes, as aggressive as possible caching; I'm expecting the use of restaurants to just be a reminder, not for minute by minute up to date information.

## 🔄 Data Management Decisions

### Q: For the new requirement where group decisions affect individual history but not vice versa, how should this work?

**A**: Yes, restaurant weight should be specific to the group. Yeah, I think a "group" label would be a nice way to signify that. Correct, that's exactly how to think about the personal vs group. No, both can exist in the same plane.

### Q: Should individual history be completely separate from group weighting?

**A**: Yes, restaurant weight should be specific to the group.

### Q: Should group decisions show up in individual history with a "group" label?

**A**: Yeah, I think a "group" label would be a nice way to signify that.

### Q: Should individual history affect personal collection decisions but not group decisions?

**A**: Correct, that's exactly how to think about the personal vs group.

### Q: Should we track both "personal" and "group" decision history separately?

**A**: No, both can exist in the same plane.

## 🎨 Design & UI Decisions

### Q: What should the chronological view look like - calendar or list?

**A**: We'll play with the UI of the chronological view. I'm undecided what that'll look like, if it's like a calendar or a list.

### Q: Should we have an onboarding flow for new registrations?

**A**: Na, I'm thinking no onboarding flow for the web version. We can have something guided like what you described in the iOS version. The SMS opt-in can first be offered on the registration page. And toggled on their profile page.

## 📝 Implementation Decisions

### Q: Many of these services we'll need will need API keys or values. What do I need to provide?

**A**:

- **MongoDB**: Cluster connection string and database name
- **Clerk**: API keys for authentication
- **Google Places API**: For restaurant search and data
- **Google Address Validation API**: For address verification
- **Twilio**: Account SID, Auth Token, and phone number (if implementing SMS)

### Q: What collections need to be created in the MongoDB cluster?

**A**:

- `users` (user profiles, preferences)
- `restaurants` (restaurant data and metadata)
- `buckets` (personal and group food lists)
- `groups` (group information and memberships)
- `decisions` (historical decision records)
- `friendships` (friend relationships)

## 🚀 Future Considerations

### Q: Which web-specific APIs don't have mobile equivalents?

**A**: Most of these have mobile equivalents, so we should be fine:

- **Geolocation API**: For location detection (has mobile equivalents)
- **Google Places API**: For restaurant search (has mobile SDKs)
- **PWA APIs**: Service workers, push notifications (has mobile equivalents)
- **WebRTC**: If we add video calls later (has mobile equivalents)

### Q: For the iOS conversion, what approach should we take?

**A**: Let's revisit when we're building iOS. For now, let's use what makes most sense for the Next.js app. I believe that would be context and the database that we're using.

## 📊 Summary

### Key Decisions Made

1. **Collections** instead of "buckets" with custom naming
2. **30-day rolling weight system** with exponential weighting
3. **Polling/refresh** instead of WebSockets for group decisions
4. **PWA implementation** with offline capabilities
5. **Aggressive caching** to minimize API costs
6. **Mobile-first design** with Tailwind CSS
7. **SMS opt-in** system for notifications
8. **Separate weighting** for personal vs group decisions

### Pending Decisions

1. **Chronological view UI** - calendar vs list format
2. **iOS conversion strategy** - to be decided later
3. **Advanced features** - to be evaluated based on user feedback

### Implementation Notes

- All decisions maintain mobile-first, PWA-ready architecture
- Cost optimization is prioritized throughout
- Accessibility (WCAG AA) is required
- Performance and caching are critical considerations
