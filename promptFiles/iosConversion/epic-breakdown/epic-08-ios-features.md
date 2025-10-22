# Epic 8: iOS-Specific Features

**Goal**: Implement iOS-exclusive features: Widgets, Siri Shortcuts, Spotlight Search, Live Activities

**Duration**: 1-2 weeks (aggressive: 5-7 days)
**Priority**: 🟢 Nice to Have (but impressive for App Store!)
**Dependencies**: Epic 3 (Collections), Epic 5 (Decisions)

---

## 📖 Stories

### Story 8.1: Home Screen Widgets

**Estimated Time**: 8-10 hours

**Tasks**:

- [ ] Create Widget Extension target

  - File → New → Target → Widget Extension
  - Name: ForkInTheRoadWidget
  - Include Configuration Intent: Yes

- [ ] Implement Collection Widget

  - Shows favorite collection
  - Displays 3 random restaurants from collection
  - "Pick Random" button (deep links to app)
  - Refreshes every hour

- [ ] Implement Decision Widget

  - Shows next upcoming group decision
  - Time remaining
  - Vote status ("You've voted" or "Tap to vote")
  - Deep links to voting screen

- [ ] Create widget previews
  - Small, Medium, Large sizes
  - Test in light/dark mode

**Deliverables**:

- ✅ Collection widget showing restaurants
- ✅ Decision widget showing active decisions
- ✅ Widgets update automatically
- ✅ Tap actions open correct screens
- ✅ All sizes (Small, Medium, Large) look good

**Code Example**:

```swift
// ForkInTheRoadWidget/CollectionWidget.swift
import WidgetKit
import SwiftUI

struct CollectionWidgetEntry: TimelineEntry {
    let date: Date
    let collection: Collection?
    let restaurants: [Restaurant]
}

struct CollectionWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> CollectionWidgetEntry {
        CollectionWidgetEntry(date: Date(), collection: .mock, restaurants: [.mock1, .mock2])
    }

    func getSnapshot(in context: Context, completion: @escaping (CollectionWidgetEntry) -> Void) {
        // Return snapshot for widget gallery
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CollectionWidgetEntry>) -> Void) {
        Task {
            // Fetch data
            let collections = try? await CollectionService().fetchCollections()
            let collection = collections?.first
            let restaurants = collection?.restaurants?.prefix(3).map { $0 } ?? []

            let entry = CollectionWidgetEntry(
                date: Date(),
                collection: collection,
                restaurants: Array(restaurants)
            )

            // Update every hour
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

            completion(timeline)
        }
    }
}

struct CollectionWidgetView: View {
    let entry: CollectionWidgetEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(entry.collection?.name ?? "No Collection")
                .font(.headline)

            ForEach(entry.restaurants.prefix(3)) { restaurant in
                HStack {
                    if let photo = restaurant.photos.first {
                        AsyncImage(url: photo)
                            .frame(width: 40, height: 40)
                            .clipShape(Circle())
                    }
                    Text(restaurant.name)
                        .font(.caption)
                }
            }
        }
        .padding()
    }
}
```

---

### Story 8.2: Siri Shortcuts Integration

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Define App Shortcuts

  - "Pick random from [collection]"
  - "Show my collections"
  - "Start group decision"

- [ ] Implement AppIntent protocol

  - RandomSelectionIntent
  - ViewCollectionsIntent
  - StartDecisionIntent

- [ ] Create Siri responses

  - Success: "I found [Restaurant Name] for you!"
  - Error: "Sorry, couldn't find restaurants"

- [ ] Test with Siri
  - "Hey Siri, pick random from Favorites"
  - "Hey Siri, show Fork In The Road collections"

**Deliverables**:

- ✅ Siri commands working
- ✅ App Shortcuts appear in Shortcuts app
- ✅ Can customize shortcuts
- ✅ Responses are natural

**Code Example**:

```swift
// Features/Shortcuts/RandomSelectionIntent.swift
import AppIntents

struct RandomSelectionIntent: AppIntent {
    static var title: LocalizedStringResource = "Pick Random Restaurant"
    static var description = IntentDescription("Picks a random restaurant from your collection")

    @Parameter(title: "Collection")
    var collection: CollectionEntity?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let collection = collection else {
            return .result(dialog: "Please specify a collection")
        }

        // Fetch restaurants
        let service = DecisionService()
        let decision = try await service.createPersonalDecision(
            collectionId: collection.id,
            method: .random,
            visitDate: Date()
        )

        guard let restaurantName = decision.result?.restaurant?.name else {
            return .result(dialog: "Couldn't pick a restaurant")
        }

        return .result(dialog: "How about \(restaurantName)?")
    }
}

// Register shortcuts
struct ForkInTheRoadShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: RandomSelectionIntent(),
            phrases: [
                "Pick a random restaurant in \(.applicationName)",
                "Choose where to eat with \(.applicationName)"
            ],
            shortTitle: "Random Pick",
            systemImageName: "shuffle"
        )
    }
}
```

---

### Story 8.3: Spotlight Search Integration

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Index collections for Spotlight

  - Use Core Spotlight framework
  - Index collection names
  - Index restaurant names
  - Add search keywords

- [ ] Handle Spotlight search results

  - User searches "Pizza" in iOS search
  - Shows Fork In The Road collections/restaurants
  - Tapping opens app to that item

- [ ] Update index when data changes
  - Add/remove collections
  - Add/remove restaurants

**Deliverables**:

- ✅ Collections searchable in Spotlight
- ✅ Restaurants searchable in Spotlight
- ✅ Tapping result opens correct screen
- ✅ Index stays up-to-date

**Code Example**:

```swift
// Services/SpotlightIndexer.swift
import CoreSpotlight
import MobileCoreServices

class SpotlightIndexer {
    static let shared = SpotlightIndexer()

    func indexCollection(_ collection: Collection) {
        let attributeSet = CSSearchableItemAttributeSet(contentType: .content)
        attributeSet.title = collection.name
        attributeSet.contentDescription = collection.description
        attributeSet.keywords = ["restaurant", "food", "collection"]

        let item = CSSearchableItem(
            uniqueIdentifier: "collection_\(collection.id)",
            domainIdentifier: "com.youhungry.collection",
            attributeSet: attributeSet
        )

        CSSearchableIndex.default().indexSearchableItems([item]) { error in
            if let error = error {
                print("Indexing error: \(error)")
            }
        }
    }

    func removeCollection(id: String) {
        CSSearchableIndex.default().deleteSearchableItems(
            withIdentifiers: ["collection_\(id)"]
        ) { error in
            if let error = error {
                print("Delete index error: \(error)")
            }
        }
    }
}
```

---

### Story 8.4: Live Activities (Dynamic Island)

**Estimated Time**: 8-10 hours
**Complex but Impressive!**

**Tasks**:

- [ ] Create Activity Attributes

  - DecisionActivityAttributes
  - Track voting progress

- [ ] Implement Live Activity

  - Compact view (Dynamic Island)
  - Expanded view
  - Lock screen view

- [ ] Start Live Activity when decision created

  - Shows group name
  - Vote count (X of Y voted)
  - Time remaining

- [ ] Update Live Activity
  - When members vote
  - When decision completes
  - Remove when 24 hours old

**Deliverables**:

- ✅ Live Activity shows in Dynamic Island
- ✅ Updates in real-time as votes come in
- ✅ Tapping opens app to decision
- ✅ Looks beautiful on iPhone 15 Pro+ (Dynamic Island devices)

**Code Example**:

```swift
// Features/Decisions/LiveActivity/DecisionActivityAttributes.swift
import ActivityKit

struct DecisionActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var groupName: String
        var voteCount: Int
        var totalMembers: Int
        var timeRemaining: String
    }

    var decisionId: String
    var collectionName: String
}

// Start Live Activity
func startLiveActivity(decision: Decision) {
    let attributes = DecisionActivityAttributes(
        decisionId: decision.id,
        collectionName: decision.collectionName
    )

    let contentState = DecisionActivityAttributes.ContentState(
        groupName: decision.groupName,
        voteCount: decision.votes?.count ?? 0,
        totalMembers: decision.participants.count,
        timeRemaining: decision.timeRemaining
    )

    do {
        let activity = try Activity.request(
            attributes: attributes,
            contentState: contentState,
            pushType: nil
        )
        print("Live Activity started: \(activity.id)")
    } catch {
        print("Live Activity error: \(error)")
    }
}
```

---

### Story 8.5: Share Sheet Integration

**Estimated Time**: 3-4 hours

**Tasks**:

- [ ] Add Share functionality

  - Share restaurant (link + photo)
  - Share collection
  - Share decision result

- [ ] Implement custom share items
  - Include app link
  - Include restaurant details
  - Include photo if available

**Deliverables**:

- ✅ Can share restaurants with friends
- ✅ Can share collections
- ✅ Share includes link back to app
- ✅ Looks good in Messages/WhatsApp

---

### Story 8.6: Contact Integration

**Estimated Time**: 4-5 hours
**Optional - Can defer if timeline is tight**

**Tasks**:

- [ ] Request Contacts permission
- [ ] Import contacts for friend invitations
- [ ] Match contacts with app users
- [ ] Show "In Fork In The Road" badge on contacts

**Deliverables**:

- ✅ Can add friends from Contacts
- ✅ Shows which contacts use the app
- ✅ One-tap friend request

---

## 🔄 Parallel Work Groups

**Week 1** (Build Foundation):

- Day 1-4: Story 8.1 (Widgets) - Sequential first
- Day 5-7: Story 8.2 (Siri Shortcuts) - After widgets

**Week 2** (Advanced Features - PARALLEL):

- Day 1-4: Stories 8.3 + 8.4 + 8.5 all in parallel!
  - Story 8.3: Spotlight (simpler)
  - Story 8.4: Live Activities (complex)
  - Story 8.5: Share Sheet (simple)
- Day 5-7: Story 8.6 (Contacts) if time permits

---

## ✅ Epic Completion Checklist

**Widgets**:

- [ ] Collection widget working (all sizes)
- [ ] Decision widget working
- [ ] Widgets update automatically
- [ ] Tap actions work

**Siri**:

- [ ] "Pick random" command works
- [ ] "Show collections" works
- [ ] Commands appear in Shortcuts app
- [ ] Responses natural

**Spotlight**:

- [ ] Collections indexed
- [ ] Restaurants indexed
- [ ] Search results open app correctly
- [ ] Index stays updated

**Live Activities**:

- [ ] Shows in Dynamic Island (iPhone 15 Pro+)
- [ ] Shows on Lock Screen (all devices)
- [ ] Updates in real-time
- [ ] Tapping opens app

**Share**:

- [ ] Can share restaurants
- [ ] Can share collections
- [ ] Shared content looks good
- [ ] Links work

**Testing**:

- [ ] All features tested on device
- [ ] Widgets tested in all sizes
- [ ] Siri tested with voice commands
- [ ] Live Activities tested on iPhone 15 Pro
- [ ] Spotlight tested with various queries

---

## 🐛 Common Issues

**Issue**: "Widget not updating"

- **Solution**: Check timeline policy, verify background refresh enabled.

**Issue**: "Siri says 'I can't do that'"

- **Solution**: Verify App Intents configured, check intent parameters.

**Issue**: "Live Activity not starting"

- **Solution**: Must request on iOS 16.1+, check ActivityKit import.

---

**Next**: [Epic 9: Monetization & IAP](./epic-09-monetization.md)

**iOS features make the app stand out! 🌟**
