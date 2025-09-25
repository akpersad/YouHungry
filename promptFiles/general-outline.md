(Please clean this doc up)

# Overall Concept

The app idea I have is one born from a constant conversation I have with my wife; what should we eat tonight when we decide we don't want to cook and want to order in. We have a bunch of restaurants we use in rotation but in the moment, we always forget about a bunch and choose from the comfort favorites. Only after, do we remember something we said we wanted to try. Also, we've started to bucket things into different categories like "A little hungry", "A lot hungry", "Super Hungry", "Could Eat a Horse Hungry" but often times forget the buckets and what is included in what. Also, there are times where we want different things as our top choices but will often agree on choice 2 or 3.

So, I want to create an app that will help streamline this and allow us to use our phones. Thinking of this as a next.js project that will be mobile first and eventually turn it into an iOS swift iteration. Going next first since I know next and I'm not paying for an Apple developer account yet. I assume my wife and I will primarily be the users but I foresee friends using it with their spouses. Maybe even my friend group when we're deciding where to have group dinner.

The app will have two flows: an authenticated one and an unathenticated one. We touch the latter later. For the former, a signed in user will be able to search for someone to add them as a "friend". The user can then create a group consisting of at least one other person in their friend list. That person become that groups admin and be allowed privileges over the group like naming it or removing members. Others members will be allowed to be promoted to admin role by other admins. The members of a group don't need to be friends with each other; the person adding them to a group only needs to be friends with the person they're adding at that time.

Let's start with just a single user experience first. A user will be allowed to create their own buckets only associated with them. For example, I can create a bucket that says "To try when I'm alone" or "To have when I'm really hungry". The user will then be allowed to search for a restaurant and add that restaurant to a specific bucket. Same restaurants can belong to many different buckets. However, you can not have the same restaurant multiple times in the same bucket.

For the group experience, admins will be the only ones to create buckets but anyone in the group should be able to add any restaurant to the buckets associated with that group.

Restaurant selection can be one of two ways. First is a tiered choice; where each member in the group will select their top 3 choices from a bucket and once every has made a choice, once there is a majority vote, that is selected. Choice will be given in order of selection. For example, both have restaurant A as choice 1, then restaurant A is the selection. However, if person 1 ranks their options, in order restaurant A, restaurant B, and restaurant C and person 2 ranks theirs as restaurant D, restaurant A, restaurant C. Then restaurant A will be picked. In the event of a tie (for example, person 1 ranks restaurant A as 1 and restaurant B as 2 and person 2 ranks restaurant B as 1 and restaurant A as 2) then they'll be notified of a tie and be given a choice between the two. If they then select opposite choices again, one is chosen at random. In the event that none of the top 3 choices are the same, they'll be asked to re-rank 3 choices again. If no consensus is arrived at during the second ranking, a random choice is then made but users will be given a choice to choose from the 6 restaurants ranks or from the remaining restaurants in the bucket.

The second way of choosing would allow users to skip directly to the random selectetion. With this route, they should be able to choose from all restaurants in every bucket or select a specific bucket to choose from. For individuals, that should be straight forward. For groups, we'll probably need to implement some kind of websocket (maybe Socket.io?) so the choice is shown to everyone. (Actually, as I re-read, maybe sockets aren't necessary but I defer to you if you think they are). I'd also potentially like a way to text the users that weren't online at the time of choice with the decision made. Probably with Twilio. But if that's too complicated or too complex, I'm okay to backlog that idea.

With either route, in the random selection, restaurants should be weighed, so initially they all have the same chance, but those not chosen recently have a higher chance of being selected. For example, restaurant 1 was chosen Monday, restaurant 3 was chosen Tuesday, and restaurant 2 was chosen Wednesday. If I have the app make a decision on Friday, the chance of a restaurant being chosen, from most to least likely, will be 1, 3, 2, in that order.

I guess we should also have a historical view as well, so people can see what they've had in the past and see if there are trends. I'd also like for users to have the ability to place historical options, as there may be days that the group knows where they want to go and won't need the app. This would mostly be for the weighing system, so there's a way lower chance they're being offered something that they had yesterday.

I'd also like a profile page that allows users to update information about themselves, such as name, city, profile picture. Open to suggestions on whatever else you think would make sense. I think Clerk handles a lot of this but should we have an internal page that references the Clerk data? Unclear.

Another feature I want is a restaurant search page. A user would input an address (validated by something like google address validation) and then shown a list or map of restaurants. They can then select those restaurants and directly add them to buckets available to them. (Personal and group ones. How this is organized will mostly be up to you to ensure the best UX).

We'll also need a buckets page that allows adminstrative actions to be done on buckets, like view, update, or delete. Note, that I don't want these called buckets, I'm just using that to be clear in language but I'll look to you for suggestions on what we can name it.

Now for the unauthenticated user, I imagine we'll have a landing page describing what the app is and some general info. They'll be offered the restaurant search page as well, though obviously not allowed to save anything.

That also brings to mind we'll need register and login pages. Can you think of any more pages we'll need?

(_New_) I think we should also add a feature where anything you have with a group should also be added to your individual history. But not the other way, if you have something individually, it should have no bearing on the selections in groups. Makes sense that you wouldn't want the same thing two days in a row but a group might want something that you've had recently that they haven't.

# Technology to Use

(Note that this is a combination of things I want to be used but also I'll need you to fill in some blanks and also give suggestions on things I might be missing)

- Next.js
- Typescript
- MongoDB
- Clerk
- Twilio
- GraphQL
- APIs
  - Google places?
  - Google address validation
  - Yelp (potentially to show menus, if available)
- Socket.io (?)
- Performance and Benchmark tools?
- A11y tools
- Google Analytics
- Some kind of true randomizer package?
- React Testing Library (I want to make sure the app if fully unit tested)
- Vercel is what I'll be hosting the web app on
- Tailwind CSS
- Open to anything else that would be cool or interesting

# Design Guidelines

- Use tailwind and tailwind components as much as possible. Create custom components once you're sure tailwind cannot adequetely deliver what we want.
- Use the guide in ./design-system.md as a starting point. I've taken that from another project. The color palette I'd like to use. Something may not be relevant.
- App should be WCAG AA accessible
- App needs to be mobile first but responsive for any screen size

# Implementation Guideline

- (_New_) This will be an important directive throughout while you're building the app; it is imperitve that you make the app as efficient as possible and cache data where and when appropriate. We need to minimize API calls to only those that are necessary. Some of these calls will have a cost incurred and I want to be price concious and ensure we're minimizing any potential costs.
- Make sure the take things a step at a time. I want to make sure you're building incrementally and not taking on everything at once, which can cause confusion and issues
- Make things are reusable and componentized as possible.
- Make sure things are memoized where makes sense. Don't want users bogged down by an inefficient app
- I want you to keep detailed documentation broken out into different files in the promptFiles directory and they should be updated periodically to ensure everything is captured. For example, there should be a pending-items file that lists out everything that is planned broken out into sections that make the most sense. This would also capture potential backlog items we can get to in future iterations that don't make sense to add in the first release.
- I want to optimize for SEO as well. I will probably use this as a showcase piece when applying to jobs, so it'll need to appeal to hiring managers but also to automated ATS scanners.
- Once a task is done, we need to make sure that it's captured in a "done" file.
- I also want you to rewrite and organize this file (general-outline.md) into a more cohesive and methodical file as I may be starting many new chats and there won't be a huge context window. But I will start each prompt with "Please refer to general-outline.md before doing anything I've asked of you"

# Notes before you begin:

- Many of these services we'll need will need API keys or values (such as the name of the Mongo cluster). Please let me know exactly what I need to provide for you.
  - Also let me know what collections need to be created in the cluster that needs to be created.
- Please make sure you absolutely understand the ask and know exactly how I envision the app.
- You should do so by asking questions and building off of my answers.
- Any and all questions should be asked to best ensure you're delivering my vision.

# Questions

## Core Functionality Questions

1. **Bucket Naming**: You mentioned not wanting to call them "buckets" - what would you prefer? Some suggestions: "Lists", "Collections", "Categories", "Mood Boards", or "Food Moods"?

   A. Collections. But we should have helper text allowing users to give the custom names, but they'll default to numbered (Collection 1, Collection 2, etc.)

2. **Restaurant Data**: For restaurants, what specific information do you want to store beyond name and location? (e.g., cuisine type, price range, delivery time, rating, notes, photos?)

   A. Cuisine, Rating. I'll also like two custom, optional fields users can fill in; Price Range, which will be a dropdown of $ - $$$$ and Time To Pick Up, which will be a custom number input representing minutes.

3. **Group Decision Timing**: When groups make decisions, should there be a time limit for members to submit their rankings, or should it wait indefinitely until everyone responds?

   A. It should default to 24 hours after a "decision" has been initiated but user who started the decision should be given a "End Time" input that dictates. Maximum should be 2 weeks from current date.

4. **Weighting System**: For the "not chosen recently" weighting, what time period should we consider? (e.g., last 7 days, 14 days, 30 days?)

   A. I'd like it to be a rolling 30 days.

## Technical Architecture Questions

5. **Real-time Updates**: For group decisions, do you want real-time updates (WebSocket) or is polling/refresh sufficient? Real-time would be more engaging but adds complexity.

   A. Polling/refresh is fine. Seems like we can achieve most of the functionality with a fraction of the complexity.

6. **Mobile App Priority**: Since you mentioned eventually wanting an iOS app, should I structure the codebase to make this transition easier? (e.g., using React Native Web or keeping components very mobile-focused?)

   A. Yes, but not React Native, just keep components mobile-focused. Also understand that I will be asking you to do the conversion when the time comes, so if that has any impact on how you build, please keep that in mind.

7. **Offline Capability**: Should the app work offline for viewing existing data, or is online-only acceptable?

   A. I like the idea of it being a PWA. I want to explore that. Offline bits seems cool.

## API and Services Questions

8. **Google Places vs Yelp**: Which should be the primary restaurant data source? Google Places for location data and Yelp for reviews/menus?

   A. Yes, that's how I'm seeing it. I trust Google Places for the location data most.

9. **Address Validation**: Should users be required to enter their address, or can we use location services to auto-detect?

   A. Users can have their location auto-detected but I also want them to be able to enter in an address because there may be times that they're future planning or looking for a specific restaurant.

10. **Twilio Integration**: For the text notifications, should this be optional per user, or always enabled for group decisions?

    A. Users should need to opt-in to receive sms messages.

## Additional Clarifications Needed

11. **Collection Naming System**: You mentioned collections default to "Collection 1, Collection 2, etc." but users can give custom names. Should there be any validation on custom names (length limits, character restrictions, uniqueness within a user's collections)?

    A. Validation; it should have a character limit, though I'm not sure what would be appropriate. Looking to you for guidance. It should also be unique per group. So there could be multiple "Really Hungry" collections in our db but not in groups.

12. **Restaurant Custom Fields**: For the custom fields (Price Range dropdown and Time To Pick Up), should these be:

    - Required or optional when adding a restaurant?
    - Editable after adding a restaurant?
    - Visible to all group members or just the person who added the restaurant?

    A. Optional, editable, visible to all

13. **Group Decision Flow**: When a user starts a decision with a custom end time, should:

    - Other group members be notified immediately when the decision starts?
    - There be a way to extend the time if needed?
    - The decision automatically resolve to random selection if time expires?

    A. They should only be notified if they've opted into sms, otherwise they'll just find it in their "Active Decisions" section. When we turn this into an iOS app, I'll remove SMS options and go with native notification. Yeah, the End Time should always be editable (unless the decision is closed) but you should not be able to choose a past time. Yeah, if no one has made a selection, choose randomly. If anyone has made a selection, go down the decision flow.

14. **PWA Implementation**: For the PWA features, what specific offline capabilities are most important to you?

    - View existing collections and restaurants?
    - Make decisions with cached data?
    - Add new restaurants to collections?
    - Or just basic viewing of previously loaded data?

    A. Yes, Yes, No, Don't care one way or the other

15. **Weighting Algorithm Details**: For the 30-day rolling weighting system, should:

    - The weighting be exponential (recently chosen restaurants have much lower chance) or linear?
    - There be a minimum chance for any restaurant (so nothing is completely excluded)?
    - The weighting reset if a restaurant hasn't been chosen in 30+ days?

    A. Exponential. Yes, everything should always have a chance of being chosen, no matter how small. Yes.

16. **SMS Opt-in Flow**: For Twilio integration, should:

    - Users be prompted to opt-in during onboarding or when they join their first group?
    - There be granular controls (e.g., opt-in for some groups but not others)?
    - The app work fully without SMS (just with in-app notifications)?

    A. During onboarding. (Note: should we have an onboarding flow for new registrations?). Yeah, opt-in control per group. Yes, the app should definitely work fully without SMS, SMS should only enhance the experience.

17. **Cost Optimization Strategy**: Given your emphasis on minimizing API costs, should I:

    - Implement aggressive caching for Google Places data (cache restaurant details for 30+ days)?
    - Batch API calls where possible?
    - Use a local database to store frequently accessed restaurant data?
    - Implement a "stale-while-revalidate" pattern for restaurant searches?

    A. Yes, as aggresive as possible; I'm expecting the use of restaurants to just be a reminder, not for minute by minute up to date information. Sure, batch if that makes sense? How much of a delay would that cause the end user? If it's trivial, then yes! Love stale-while-revalidate; let's do it.

18. **Mobile-First Component Structure**: Since you want easy iOS conversion later, should I:

    - Use a specific component library that has iOS equivalents?
    - Structure state management in a way that's easily portable?
    - Avoid any web-specific APIs that don't have mobile equivalents?

    A. I think we need to talk this out. What component library is available that would span both? Sure would that make things easy or should we rethink state management to be more efficient natively when we port? Which APIs currently identified don't have mobile equivalents?

## Follow-up Questions from Your Responses

19. **Collection Naming Character Limit**: What character limit would be appropriate for collection names? I'm thinking 50 characters would be reasonable - enough for descriptive names but not too long for mobile display. What do you think?

    A. Love it.

20. **Onboarding Flow**: You asked about having an onboarding flow for new registrations. Should this include:

    - Welcome screens explaining the app concept?
    - Tutorial on how to create collections and add restaurants?
    - SMS opt-in prompt?
    - Location permission request?
    - Sample data setup (like creating a "Favorites" collection)?

    A. Na, I'm thinking no onboarding flow for the web version. We can have something guided like what you described in the iOS version. The SMS opt-in can first be offered on the registration page. And toggled on their profile page.

21. **Batching API Calls Delay**: For batching Google Places API calls, the delay would be minimal (under 100ms) as we'd batch requests that happen within a short time window (like 200-500ms). This would be imperceptible to users but could save significant API costs. Is this acceptable?

    A. Very acceptable.

22. **Component Library Options**: For cross-platform compatibility, here are the main options:

    - **React Native Web**: Allows using React Native components on web, but adds complexity
    - **NativeBase**: Has both React and React Native versions
    - **Tamagui**: Modern, performant, works on web and React Native
    - **Custom components**: Build our own with mobile-first design principles
      Which approach interests you most?

      A. Honestly, none. Let's use tailwind for web and revisit when we approach the iOS app. No need to try to fit two different pegs in the same hole.

23. **Web-Specific APIs to Avoid**: The main web-specific APIs we're using that don't have direct mobile equivalents are:

    - **Geolocation API**: For location detection (has mobile equivalents)
    - **Google Places API**: For restaurant search (has mobile SDKs)
    - **PWA APIs**: Service workers, push notifications (has mobile equivalents)
    - **WebRTC**: If we add video calls later (has mobile equivalents)
      Most of these have mobile equivalents, so we should be fine.

      A. Awesome.

24. **State Management for iOS Port**: For the iOS conversion, we could:

    - Use **Zustand** or **Jotai** (lightweight, easy to port)
    - Use **Redux Toolkit** (more complex but very portable)
    - Use **React Query/TanStack Query** for server state (has React Native support)
    - Keep state management simple and component-local where possible
      What's your preference?

      A. Let's revisit when we're building iOS. For now, let's use what makes most sense for the next.js app. I believe that would be context and the db that we're using.

25. **Individual History from Groups**: For the new requirement where group decisions affect individual history but not vice versa, should:

    - Individual history be completely separate from group weighting?
    - Group decisions show up in individual history with a "group" label?
    - Individual history affect personal collection decisions but not group decisions?
    - We track both "personal" and "group" decision history separately?

    A. Yes, restaurant weight should be specific to the group. Yeah, I think a "group" label would be a nice way to signify that.Correct, thats exactlt how to think about the personal vs group. No, both can exist in the same plane.

# Information needed

## Required API Keys/Services

- **MongoDB**: Cluster connection string and database name
- **Clerk**: API keys for authentication
- **Google Places API**: For restaurant search and data
- **Google Address Validation API**: For address verification
- **Twilio**: Account SID, Auth Token, and phone number (if implementing SMS)

## MongoDB Collections Needed

- `users` (user profiles, preferences)
- `restaurants` (restaurant data and metadata)
- `buckets` (personal and group food lists)
- `groups` (group information and memberships)
- `decisions` (historical decision records)
- `friendships` (friend relationships)

## Environment Variables

- `MONGODB_URI`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- `GOOGLE_ADDRESS_VALIDATION_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
