# Epic 3: Collections & Restaurant Search

**Goal**: Implement personal collections, restaurant search, and restaurant management

**Duration**: 2-3 weeks (aggressive: 1.5-2 weeks)
**Priority**: 🔴 Critical
**Dependencies**: Epic 1 (Foundation), Epic 2 (Authentication)

---

## 📋 Prerequisites

- [ ] Epic 1 complete (design system, services ready)
- [ ] Epic 2 complete (user authenticated)
- [ ] Google Places API key configured in mobile API
- [ ] Mobile API collections endpoints working

---

## 📖 Stories

### Story 3.1: Collections List View

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Create Collection model (already in agent guide)
- [ ] Implement CollectionService

  - fetchCollections()
  - fetchCollection(id:)
  - createCollection()
  - updateCollection()
  - deleteCollection()

- [ ] Implement CollectionsViewModel

  - @Published collections array
  - Load collections from API
  - Optimistic updates
  - Error handling
  - Offline fallback

- [ ] Create CollectionsListView

  - List of collections
  - Empty state ("No collections yet")
  - Pull-to-refresh
  - Search bar (filter collections)
  - Add button (toolbar)

- [ ] Create CollectionRow component
  - Collection name
  - Restaurant count badge
  - Preview of first 3 restaurant photos
  - Last updated time
  - Swipe actions (edit, delete)

**Deliverables**:

- ✅ Collections list displaying
- ✅ Can create new collection
- ✅ Can delete collection (swipe)
- ✅ Empty state shows properly
- ✅ Pull-to-refresh working
- ✅ Offline mode shows cached collections

**Code Example**:

```swift
// Features/Collections/Views/CollectionsListView.swift
struct CollectionsListView: View {
    @StateObject private var viewModel = CollectionsViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.collections.isEmpty {
                LoadingView()
            } else if viewModel.collections.isEmpty {
                EmptyStateView(
                    icon: "folder",
                    title: "No Collections",
                    message: "Create your first collection to get started!",
                    actionTitle: "Create Collection",
                    action: { showCreateSheet = true }
                )
            } else {
                List {
                    ForEach(viewModel.collections) { collection in
                        NavigationLink(value: collection) {
                            CollectionRow(collection: collection)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                Task {
                                    await viewModel.deleteCollection(id: collection.id)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
        .navigationTitle("Collections")
        .navigationDestination(for: Collection.self) { collection in
            CollectionDetailView(collection: collection)
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: { showCreateSheet = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            CreateCollectionView()
        }
        .task {
            await viewModel.loadCollections()
        }
    }
}
```

---

### Story 3.2: Create/Edit Collection

**Estimated Time**: 4-5 hours

**Tasks**:

- [ ] Create CreateCollectionView

  - Name field (required)
  - Description field (optional)
  - Form validation
  - Create button
  - Cancel button

- [ ] Implement create logic in ViewModel

  - Validate input
  - Call API
  - Optimistic update
  - Error handling

- [ ] Create EditCollectionView (similar to Create)

  - Pre-populate fields
  - Update button
  - Delete option

- [ ] Add haptic feedback
  - Success haptic on create
  - Error haptic on validation failure

**Deliverables**:

- ✅ Can create collection
- ✅ Can edit collection name/description
- ✅ Validation working (name required)
- ✅ Smooth animations and haptics
- ✅ Works offline (queues for sync)

---

### Story 3.3: Restaurant Search Integration

**Estimated Time**: 10-12 hours
**Complex Story - Core Feature**

**Tasks**:

- [ ] Create Restaurant model
- [ ] Implement RestaurantService

  - searchRestaurants(query, location, coordinates)
  - Uses mobile API → Google Places

- [ ] Implement RestaurantSearchViewModel

  - Search query state
  - Location state (use device location or manual entry)
  - Results array
  - Loading/error states
  - Pagination (load more)

- [ ] Create RestaurantSearchView

  - Search bar (query)
  - Location selector (current location or manual)
  - Filters (cuisine, price, rating)
  - Results list
  - Map view toggle (optional for Epic 3, required in Epic 7)

- [ ] Request location permission

  - Add NSLocationWhenInUseUsageDescription to Info.plist
  - "Fork In The Road uses your location to find nearby restaurants. You can also search by entering an address manually."
  - Handle permission states (authorized, denied, not determined)

- [ ] Implement LocationManager
  - Request permission
  - Get current location
  - Handle errors

**Deliverables**:

- ✅ Can search restaurants by query
- ✅ Can use current location
- ✅ Can enter manual location
- ✅ Results display with photos, ratings, price
- ✅ Location permission handled properly
- ✅ Error states for no results

**Code Example**:

```swift
// Features/Restaurants/Views/RestaurantSearchView.swift
struct RestaurantSearchView: View {
    @StateObject private var viewModel = RestaurantSearchViewModel()
    @State private var searchQuery = ""

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            SearchBar(text: $searchQuery, placeholder: "Search restaurants...")
                .onChange(of: searchQuery) { _, newValue in
                    Task {
                        await viewModel.search(query: newValue)
                    }
                }

            // Location selector
            HStack {
                Button(action: { viewModel.useCurrentLocation() }) {
                    HStack {
                        Image(systemName: "location.fill")
                        Text("Current Location")
                    }
                }

                Divider()

                Button(action: { viewModel.showLocationPicker = true }) {
                    Text(viewModel.selectedLocation ?? "Enter Location")
                }
            }
            .padding()

            // Results
            if viewModel.isLoading {
                LoadingView()
            } else if viewModel.restaurants.isEmpty {
                EmptyStateView(
                    icon: "magnifyingglass",
                    title: "No Results",
                    message: "Try a different search term or location"
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.restaurants) { restaurant in
                            RestaurantCard(restaurant: restaurant)
                                .onTapGesture {
                                    viewModel.selectedRestaurant = restaurant
                                }
                                .onAppear {
                                    if restaurant == viewModel.restaurants.last {
                                        Task {
                                            await viewModel.loadMore()
                                        }
                                    }
                                }
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Search Restaurants")
    }
}
```

---

### Story 3.4: Restaurant Detail View

**Estimated Time**: 6-8 hours
**🔄 Can work in parallel with Story 3.5**

**Tasks**:

- [ ] Create RestaurantDetailView

  - Large photo carousel
  - Restaurant name, cuisine
  - Rating, price range
  - Address with map preview
  - Phone number (tap to call)
  - Website link
  - Hours of operation
  - "Add to Collection" button
  - "Directions" button (opens Apple Maps)

- [ ] Implement actions

  - Open in Apple Maps
  - Call restaurant
  - Open website
  - Add to collection (show picker)

- [ ] Add context menu (long press)
  - Share restaurant
  - Copy address
  - Copy phone number

**Deliverables**:

- ✅ Restaurant details displaying beautifully
- ✅ Photo carousel working
- ✅ Can open in Apple Maps
- ✅ Can call restaurant
- ✅ Can add to collection
- ✅ Share functionality working

**Code Example**:

```swift
struct RestaurantDetailView: View {
    let restaurant: Restaurant
    @State private var showCollectionPicker = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Photo carousel
                TabView {
                    ForEach(restaurant.photos, id: \.self) { photoUrl in
                        CachedAsyncImage(url: photoUrl)
                            .aspectRatio(contentMode: .fill)
                            .frame(height: 300)
                            .clipped()
                    }
                }
                .tabViewStyle(.page)
                .frame(height: 300)

                // Info
                VStack(alignment: .leading, spacing: 16) {
                    // Name + cuisine
                    // Rating + price
                    // Address + directions button
                    // Phone + call button
                    // Hours
                }
                .padding()

                // Add to Collection button
                NeuButton("Add to Collection") {
                    showCollectionPicker = true
                }
                .padding()
            }
        }
        .navigationTitle(restaurant.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

---

### Story 3.5: Collection Detail View

**Estimated Time**: 8-10 hours
**🔄 Can work in parallel with Story 3.4**

**Tasks**:

- [ ] Create CollectionDetailView

  - Collection name (editable)
  - Restaurant count
  - List of restaurants in collection
  - Empty state ("No restaurants yet")
  - Add restaurant button
  - Decision button ("Pick a restaurant")

- [ ] Implement CollectionDetailViewModel

  - Load collection with restaurants
  - Add restaurant to collection
  - Remove restaurant from collection
  - Update collection name/description
  - Start decision (random selection)

- [ ] Create restaurant management

  - Swipe to remove from collection
  - Reorder restaurants (drag and drop)
  - Long press for quick actions

- [ ] Implement random decision
  - "Pick Random" button
  - Shows animated selection
  - Result modal with selected restaurant
  - Save to decision history

**Deliverables**:

- ✅ Collection detail showing all restaurants
- ✅ Can add restaurants to collection
- ✅ Can remove restaurants
- ✅ Can pick random restaurant
- ✅ Decision saved to history
- ✅ Works offline (cached data)

**Code Example**:

```swift
struct CollectionDetailView: View {
    let collection: Collection
    @StateObject private var viewModel: CollectionDetailViewModel
    @State private var showAddRestaurant = false
    @State private var showDecisionResult = false

    init(collection: Collection) {
        self.collection = collection
        _viewModel = StateObject(wrappedValue: CollectionDetailViewModel(collection: collection))
    }

    var body: some View {
        List {
            ForEach(viewModel.restaurants) { restaurant in
                NavigationLink(value: restaurant) {
                    RestaurantRow(restaurant: restaurant)
                }
                .swipeActions {
                    Button(role: .destructive) {
                        Task {
                            await viewModel.removeRestaurant(id: restaurant.id)
                        }
                    } label: {
                        Label("Remove", systemImage: "trash")
                    }
                }
            }
        }
        .navigationTitle(collection.name)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Add") {
                    showAddRestaurant = true
                }
            }

            ToolbarItem(placement: .bottomBar) {
                NeuButton("Pick Random Restaurant") {
                    Task {
                        await viewModel.pickRandom()
                        showDecisionResult = true
                    }
                }
                .disabled(viewModel.restaurants.isEmpty)
            }
        }
        .sheet(isPresented: $showAddRestaurant) {
            RestaurantSearchView(collectionId: collection.id)
        }
        .sheet(isPresented: $showDecisionResult) {
            DecisionResultView(decision: viewModel.latestDecision)
        }
    }
}
```

---

## 🔄 Parallel Work Groups

**Week 1** (Foundation):

- Day 1-3: Story 3.1 (Collections List) - Must be first
- Day 4-5: Story 3.2 (Create/Edit) - Depends on 3.1

**Week 2** (Core Features - PARALLEL):

- Day 1-4: Stories 3.3 + 3.4 in parallel
  - Story 3.3: Restaurant Search
  - Story 3.4: Restaurant Detail
- Day 5-7: Story 3.5 (Collection Detail)

**Week 3** (Polish):

- Testing, bug fixes, offline optimization

---

## ✅ Epic Completion Checklist

**Collections**:

- [ ] View all personal collections
- [ ] Create new collection
- [ ] Edit collection name/description
- [ ] Delete collection
- [ ] Collections work offline

**Restaurant Search**:

- [ ] Search by query (name, cuisine)
- [ ] Search by location (current or manual)
- [ ] Location permission handled
- [ ] Results display with all info
- [ ] Can view restaurant details
- [ ] Search results cached

**Restaurant Management**:

- [ ] Add restaurant to collection
- [ ] Remove restaurant from collection
- [ ] View restaurant details
- [ ] Open in Apple Maps
- [ ] Call restaurant
- [ ] Share restaurant

**Decision Making**:

- [ ] Pick random restaurant from collection
- [ ] Decision result displayed
- [ ] Decision saved to history
- [ ] Weighting system (30-day rolling)

**Testing**:

- [ ] Unit tests for ViewModels
- [ ] Integration tests for search flow
- [ ] UI tests for collections CRUD
- [ ] Offline testing
- [ ] Physical device testing

---

## 🐛 Common Issues

**Issue**: "Google Places API returns no results"

- **Solution**: Check API key in mobile API, verify billing enabled.

**Issue**: "Location permission denied"

- **Solution**: Gracefully fallback to manual entry, show helpful message.

**Issue**: "Images not loading"

- **Solution**: Check photo URLs, implement retry logic, use placeholders.

---

**Next**: [Epic 4: Groups & Friend Management](./epic-04-groups.md)

**Collections are the heart of the app! 🍽️**
