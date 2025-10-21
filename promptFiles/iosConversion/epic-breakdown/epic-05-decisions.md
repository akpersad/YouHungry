# Epic 5: Decision Making & Voting

**Goal**: Implement personal random selection and group decision voting system

**Duration**: 2-3 weeks (aggressive: 1.5-2 weeks)
**Priority**: 🟠 High
**Dependencies**: Epic 3 (Collections), Epic 4 (Groups)

---

## 📖 Stories

### Story 5.1: Personal Random Selection

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Create Decision model
- [ ] Implement DecisionService

  - createPersonalDecision()
  - getDecisionHistory()
  - Uses 30-day rolling weight algorithm (same as web)

- [ ] Implement random selection algorithm

  - Fetch restaurants from collection
  - Calculate weights based on last 30 days
  - Weighted random selection
  - Save decision to history

- [ ] Create DecisionResultView

  - Animated reveal of selected restaurant
  - Restaurant details
  - "Navigate" button (Apple Maps)
  - "Try Again" button
  - Save to decision history

- [ ] Add to CollectionDetailView
  - "Pick Random" button
  - Show result modal

**Deliverables**:

- ✅ Random selection working
- ✅ Weighting system prevents repeat selections
- ✅ Decision history tracked
- ✅ Animated result reveal
- ✅ Works offline (from cached collections)

**Code Example**:

```swift
// Features/Decisions/ViewModels/DecisionViewModel.swift
@MainActor
class DecisionViewModel: ObservableObject {
    @Published var selectedRestaurant: Restaurant?
    @Published var isAnimating = false

    private let service = DecisionService()

    func pickRandom(from collection: Collection) async {
        isAnimating = true

        do {
            // Get restaurants with weights
            let decision: Decision = try await service.createPersonalDecision(
                collectionId: collection.id,
                method: .random,
                visitDate: Date()
            )

            // Animate for 2 seconds
            try await Task.sleep(nanoseconds: 2_000_000_000)

            // Show result
            if let resultId = decision.result?.restaurantId,
               let restaurant = collection.restaurants?.first(where: { $0.id == resultId }) {
                selectedRestaurant = restaurant
                Haptics.success()
            }
        } catch {
            print("Random selection error: \(error)")
        }

        isAnimating = false
    }
}
```

---

### Story 5.2: Group Decision Creation

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Add decision creation to GroupDetailView

  - "Start Decision" button (admin only)
  - Choose method (Random or Tiered Voting)
  - Set visit date
  - Set deadline (for voting)

- [ ] Create CreateGroupDecisionView

  - Select collection
  - Choose decision method
  - Date picker (visit date)
  - Duration picker (voting deadline: 1-336 hours)
  - Create button

- [ ] Implement group decision creation in API
  - POST /api/decisions/group
  - Notifies all members

**Deliverables**:

- ✅ Admin can start group decision
- ✅ Choose random or tiered voting
- ✅ Set visit date and deadline
- ✅ All members notified
- ✅ Decision appears in group view

---

### Story 5.3: Tiered Voting Interface

**Estimated Time**: 10-14 hours
**Complex Story - Core Feature**
**🔄 Can work in parallel with Story 5.4**

**Tasks**:

- [ ] Create Group DecisionView

  - Shows active decision
  - List of restaurants to rank
  - Drag-and-drop ranking interface
  - Submit vote button
  - Vote status ("You've voted" / "Waiting for you")

- [ ] Implement drag-and-drop

  - Long press to start drag
  - Reorder restaurants
  - Haptic feedback on reorder
  - Visual feedback (selected restaurant highlights)

- [ ] Implement vote submission

  - Rankings array (restaurant IDs in order)
  - POST to API
  - Optimistic update (show "Voted" immediately)
  - Error rollback

- [ ] Show voting progress
  - Who has voted
  - Who hasn't voted
  - Time remaining
  - Auto-refresh when votes come in

**Deliverables**:

- ✅ Drag-and-drop ranking working smoothly
- ✅ Can submit vote
- ✅ Vote status updates in real-time
- ✅ Haptic feedback on interactions
- ✅ Beautiful, intuitive UI

**Code Example**:

```swift
struct TieredVotingView: View {
    @StateObject private var viewModel: DecisionViewModel
    @State private var rankedRestaurants: [Restaurant] = []
    @State private var draggedRestaurant: Restaurant?

    var body: some View {
        VStack {
            Text("Drag to Rank (1st = Most Wanted)")
                .font(.caption)
                .foregroundColor(.secondary)

            List {
                ForEach(rankedRestaurants) { restaurant in
                    RestaurantRankRow(
                        restaurant: restaurant,
                        rank: (rankedRestaurants.firstIndex(of: restaurant) ?? 0) + 1
                    )
                    .onDrag {
                        draggedRestaurant = restaurant
                        return NSItemProvider(object: restaurant.id as NSString)
                    }
                    .onDrop(of: [.text], delegate: RestaurantDropDelegate(
                        restaurant: restaurant,
                        restaurants: $rankedRestaurants,
                        draggedRestaurant: $draggedRestaurant
                    ))
                }
            }

            NeuButton("Submit Vote") {
                Task {
                    await viewModel.submitVote(rankings: rankedRestaurants.map { $0.id })
                }
            }
            .disabled(viewModel.hasVoted)
        }
        .onAppear {
            rankedRestaurants = viewModel.decision.restaurants ?? []
        }
    }
}

struct RestaurantDropDelegate: DropDelegate {
    let restaurant: Restaurant
    @Binding var restaurants: [Restaurant]
    @Binding var draggedRestaurant: Restaurant?

    func performDrop(info: DropInfo) -> Bool {
        draggedRestaurant = nil
        return true
    }

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }

    func dropEntered(info: DropInfo) {
        guard let draggedRestaurant = draggedRestaurant,
              draggedRestaurant != restaurant else {
            return
        }

        if let fromIndex = restaurants.firstIndex(of: draggedRestaurant),
           let toIndex = restaurants.firstIndex(of: restaurant) {
            withAnimation {
                restaurants.move(fromOffsets: IndexSet(integer: fromIndex), toOffset: toIndex > fromIndex ? toIndex + 1 : toIndex)
            }
            Haptics.selection()
        }
    }
}
```

---

### Story 5.4: Group Random Selection

**Estimated Time**: 4-5 hours
**🔄 Can work in parallel with Story 5.3**

**Tasks**:

- [ ] Add "Random Select" option to group decisions
- [ ] Implement group random selection

  - Admin triggers random selection
  - Weighted algorithm (30-day rolling, same as personal)
  - Result announced to all members

- [ ] Create result notification
  - Push notification to all members
  - In-app notification
  - Email notification (if enabled)

**Deliverables**:

- ✅ Admin can trigger random selection for group
- ✅ Result displayed to all members
- ✅ Notifications sent
- ✅ Decision saved to history

---

### Story 5.5: Decision Results & History

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Create DecisionResultView

  - Large restaurant photo
  - Restaurant details
  - "Get Directions" button
  - "Call Restaurant" button
  - Decision metadata (date, method, votes)

- [ ] Create DecisionHistoryView

  - List of past decisions
  - Filter by collection/group
  - Filter by date range
  - Search history

- [ ] Implement decision statistics
  - Most picked restaurant
  - Favorite cuisines
  - Decision frequency

**Deliverables**:

- ✅ Decision result displayed beautifully
- ✅ Decision history accessible
- ✅ Can filter and search history
- ✅ Statistics showing trends

---

## 🔄 Parallel Work Groups

**Week 1**:

- Day 1-3: Story 5.1 (Personal Random) - Sequential, must be first
- Day 4-5: Story 5.2 (Group Decision Creation) - After 5.1

**Week 2** (PARALLEL):

- Day 1-5: Stories 5.3 + 5.4 in parallel
  - Story 5.3: Tiered Voting (complex drag-drop)
  - Story 5.4: Group Random (simpler)

**Week 3** (Polish):

- Day 1-3: Story 5.5 (History & Results)
- Day 4-7: Testing, bug fixes

---

## ✅ Epic Completion Checklist

**Personal Decisions**:

- [ ] Pick random from personal collection
- [ ] 30-day weighting working
- [ ] Decision saved to history
- [ ] Result displayed with animation

**Group Decisions**:

- [ ] Admin can start decision
- [ ] Choose random or tiered voting
- [ ] Set visit date and deadline
- [ ] All members notified

**Tiered Voting**:

- [ ] Drag-and-drop ranking working
- [ ] Can submit vote
- [ ] See who voted
- [ ] See time remaining
- [ ] Decision completes when all voted OR deadline passed

**Random Selection**:

- [ ] Admin can trigger random
- [ ] Weighted algorithm working
- [ ] Result announced to all

**History**:

- [ ] View decision history
- [ ] Filter by date/collection/group
- [ ] Decision statistics
- [ ] Can view past results

**Testing**:

- [ ] Unit tests for decision algorithms
- [ ] Integration tests for voting flow
- [ ] UI tests for drag-drop voting
- [ ] Test weighting algorithm accuracy

---

## 🐛 Common Issues

**Issue**: "Drag-and-drop not working in simulator"

- **Solution**: Test on physical device, use mouse drag carefully in simulator.

**Issue**: "Weights not updating"

- **Solution**: Check mobile API decision history endpoint, verify 30-day calculation.

**Issue**: "Notifications not received"

- **Solution**: Check FCM token registration, verify backend sending notifications.

---

**Next**: [Epic 6: Notifications & Communication](./epic-06-notifications.md)

**Decisions make the app magical! 🎲**
