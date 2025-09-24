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

- Place to put all of the questions that I will answer inline

# Information needed

- Place to put all of the necessary values I need to collect and the names they should be called.
