# Component Mapping: Web → iOS

Complete guide to converting React/Next.js components to SwiftUI views.

---

## 🎯 Overview

This document maps every web app component to its iOS equivalent, providing code examples and conversion patterns.

**Key Differences**:

- React (hooks, JSX) → SwiftUI (property wrappers, declarative)
- TypeScript interfaces → Swift structs/classes
- CSS/Tailwind → SwiftUI modifiers
- React Context → @EnvironmentObject
- useState → @State
- useEffect → .task, .onAppear, .onChange

---

## 🏗️ Core UI Components

### Button Component

**Web (React + Tailwind)**:

```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  children
}: ButtonProps) {
  const baseClasses = "rounded-lg font-semibold transition-all";
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-secondary text-gray-900",
    ghost: "bg-transparent text-gray-700"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

**iOS (SwiftUI)**:

```swift
// Core/Design/Components/NeuButton.swift
enum ButtonVariant {
    case primary
    case secondary
    case ghost
}

enum ButtonSize {
    case sm, md, lg

    var padding: CGFloat {
        switch self {
        case .sm: return 8
        case .md: return 12
        case .lg: return 16
        }
    }
}

struct NeuButton: View {
    let title: String
    let variant: ButtonVariant
    let size: ButtonSize
    let action: () -> Void
    let disabled: Bool

    init(
        _ title: String,
        variant: ButtonVariant = .primary,
        size: ButtonSize = .md,
        disabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.variant = variant
        self.size = size
        self.disabled = disabled
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .padding(size.padding)
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(NeuButtonStyle(variant: variant))
        .disabled(disabled)
        .opacity(disabled ? 0.5 : 1.0)
    }
}

struct NeuButtonStyle: ButtonStyle {
    let variant: ButtonVariant

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }

    var backgroundColor: Color {
        switch variant {
        case .primary: return Color("AccentColor")
        case .secondary: return Color("SecondaryBackground")
        case .ghost: return Color.clear
        }
    }

    var foregroundColor: Color {
        switch variant {
        case .primary: return .white
        case .secondary: return .primary
        case .ghost: return .secondary
        }
    }
}

// Usage
NeuButton("Create Collection", variant: .primary) {
    viewModel.createCollection()
}
```

---

### Card Component

**Web (React)**:

```typescript
// src/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Card({ children, onClick, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-neumorphic ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

**iOS (SwiftUI)**:

```swift
// Core/Design/Components/NeuCard.swift
struct NeuCard<Content: View>: View {
    let content: Content
    let action: (() -> Void)?

    init(action: (() -> Void)? = nil, @ViewBuilder content: () -> Content) {
        self.action = action
        self.content = content()
    }

    var body: some View {
        Group {
            if let action = action {
                Button(action: action) {
                    cardContent
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                cardContent
            }
        }
    }

    private var cardContent: some View {
        content
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color("CardBackground"))
                    .shadow(
                        color: Color.black.opacity(0.1),
                        radius: 8,
                        x: 4,
                        y: 4
                    )
                    .shadow(
                        color: Color.white.opacity(0.7),
                        radius: 8,
                        x: -4,
                        y: -4
                    )
            )
    }
}

// Usage
NeuCard {
    VStack(alignment: .leading) {
        Text("Collection Name")
            .font(.headline)
        Text("5 restaurants")
            .font(.caption)
            .foregroundColor(.secondary)
    }
}
```

---

## 🍽️ Restaurant Components

### Restaurant Card

**Web (React)**:

```typescript
// src/components/features/RestaurantCard.tsx
interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  photoUrl?: string;
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="bg-white rounded-xl shadow-neumorphic overflow-hidden">
      {restaurant.photoUrl && (
        <img src={restaurant.photoUrl} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{restaurant.name}</h3>
        <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-yellow-500">★ {restaurant.rating}</span>
          <span className="text-gray-700">{restaurant.priceRange}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">{restaurant.address}</p>
      </div>
    </div>
  );
}
```

**iOS (SwiftUI)**:

```swift
// Features/Restaurants/Views/RestaurantCard.swift
struct Restaurant: Identifiable, Codable {
    let id: String
    let name: String
    let address: String
    let cuisine: String
    let rating: Double
    let priceRange: String
    let photoUrl: URL?
}

struct RestaurantCard: View {
    let restaurant: Restaurant

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Photo
            if let photoUrl = restaurant.photoUrl {
                AsyncImage(url: photoUrl) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .overlay(ProgressView())
                }
                .frame(height: 180)
                .clipped()
            }

            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(restaurant.name)
                    .font(.headline)

                Text(restaurant.cuisine)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                HStack {
                    HStack(spacing: 2) {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                        Text(String(format: "%.1f", restaurant.rating))
                    }
                    .font(.caption)

                    Spacer()

                    Text(restaurant.priceRange)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(restaurant.address)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            .padding()
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color("CardBackground"))
                .neuShadow()
        )
    }
}

// Custom shadow modifier for neumorphism
extension View {
    func neuShadow() -> some View {
        self
            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 4, y: 4)
            .shadow(color: Color.white.opacity(0.7), radius: 8, x: -4, y: -4)
    }
}
```

---

## 📝 Form Components

### Text Input

**Web (React)**:

```typescript
// src/components/ui/Input.tsx
interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  error?: string;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error
}: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
```

**iOS (SwiftUI)**:

```swift
// Core/Design/Components/NeuTextField.swift
struct NeuTextField: View {
    let label: String
    @Binding var text: String
    let placeholder: String
    let keyboardType: UIKeyboardType
    let isSecure: Bool
    let error: String?

    init(
        _ label: String,
        text: Binding<String>,
        placeholder: String = "",
        keyboardType: UIKeyboardType = .default,
        isSecure: Bool = false,
        error: String? = nil
    ) {
        self.label = label
        self._text = text
        self.placeholder = placeholder
        self.keyboardType = keyboardType
        self.isSecure = isSecure
        self.error = error
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)

            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .keyboardType(keyboardType)
            .textFieldStyle(NeuTextFieldStyle())
            .autocapitalization(.none)
            .disableAutocorrection(true)

            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
}

struct NeuTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color("InputBackground"))
                    .shadow(color: .black.opacity(0.05), radius: 4, x: 2, y: 2)
            )
    }
}

// Usage
@State private var collectionName = ""
@State private var nameError: String? = nil

NeuTextField(
    "Collection Name",
    text: $collectionName,
    placeholder: "Enter collection name",
    error: nameError
)
```

---

## 🧭 Navigation Components

### Navigation Structure

**Web (Next.js)**:

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Navbar />
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

// components/Navbar.tsx
export function Navbar() {
  return (
    <nav className="flex justify-between p-4">
      <Logo />
      <UserMenu />
    </nav>
  );
}
```

**iOS (SwiftUI)**:

```swift
// App/ForkInTheRoadApp.swift
@main
struct ForkInTheRoadApp: App {
    @StateObject private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            if authViewModel.isAuthenticated {
                MainTabView()
                    .environmentObject(authViewModel)
            } else {
                SignInView()
                    .environmentObject(authViewModel)
            }
        }
    }
}

// Main tab navigation
struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack {
                CollectionsListView()
            }
            .tabItem {
                Label("Collections", systemImage: "fork.knife")
            }

            NavigationStack {
                GroupsListView()
            }
            .tabItem {
                Label("Groups", systemImage: "person.3")
            }

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person.circle")
            }
        }
    }
}

// Navigation within stack
NavigationStack {
    List(collections) { collection in
        NavigationLink(value: collection) {
            CollectionRow(collection: collection)
        }
    }
    .navigationDestination(for: Collection.self) { collection in
        CollectionDetailView(collection: collection)
    }
    .navigationTitle("Collections")
}
```

---

## 🎨 List Components

### List View

**Web (React)**:

```typescript
// src/components/features/CollectionsList.tsx
export function CollectionsList() {
  const { collections, loading } = useCollections();

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {collections.map(collection => (
        <Link key={collection.id} href={`/collections/${collection.id}`}>
          <CollectionCard collection={collection} />
        </Link>
      ))}
    </div>
  );
}
```

**iOS (SwiftUI)**:

```swift
// Features/Collections/Views/CollectionsListView.swift
struct CollectionsListView: View {
    @StateObject private var viewModel = CollectionsViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if viewModel.collections.isEmpty {
                EmptyStateView(
                    title: "No Collections",
                    message: "Create your first collection!",
                    action: { viewModel.showCreateSheet = true }
                )
            } else {
                List(viewModel.collections) { collection in
                    NavigationLink(value: collection) {
                        CollectionRow(collection: collection)
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
                Button(action: { viewModel.showCreateSheet = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $viewModel.showCreateSheet) {
            CreateCollectionView()
        }
        .task {
            await viewModel.loadCollections()
        }
    }
}
```

---

## 🎭 Modal/Sheet Components

**Web (React)**:

```typescript
// src/components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Usage
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Collection">
  <CreateCollectionForm onSubmit={handleCreate} />
</Modal>
```

**iOS (SwiftUI)**:

```swift
// Use .sheet modifier (native iOS)
struct CollectionsListView: View {
    @State private var showCreateSheet = false

    var body: some View {
        List {
            // content
        }
        .toolbar {
            Button("Add") {
                showCreateSheet = true
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            NavigationStack {
                CreateCollectionView()
                    .navigationTitle("Create Collection")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Cancel") {
                                showCreateSheet = false
                            }
                        }
                    }
            }
            .presentationDetents([.medium, .large])
        }
    }
}

// For full-screen covers
.fullScreenCover(isPresented: $showFullScreen) {
    DetailView()
}
```

---

## 🔄 Loading & Error States

**Web (React)**:

```typescript
// src/components/ui/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

// src/components/ui/ErrorMessage.tsx
export function ErrorMessage({ message, onRetry }: { message: string, onRetry?: () => void }) {
  return (
    <div className="p-4 bg-red-50 rounded-lg">
      <p className="text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-red-600 underline">
          Try Again
        </button>
      )}
    </div>
  );
}
```

**iOS (SwiftUI)**:

```swift
// Core/Design/Components/LoadingView.swift
struct LoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// Core/Design/Components/ErrorView.swift
struct ErrorView: View {
    let message: String
    let retry: (() -> Void)?

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.red)

            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            if let retry = retry {
                Button("Try Again") {
                    retry()
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
    }
}

// Usage in ViewModel pattern
struct ContentView: View {
    @StateObject private var viewModel = ContentViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                LoadingView()
            } else if let error = viewModel.error {
                ErrorView(message: error.localizedDescription) {
                    Task {
                        await viewModel.retry()
                    }
                }
            } else {
                // Content
                MainContent(data: viewModel.data)
            }
        }
    }
}
```

---

## 📋 Quick Reference Table

| Web Component      | iOS Equivalent                | Notes                                |
| ------------------ | ----------------------------- | ------------------------------------ |
| `<div>`            | `VStack/HStack/ZStack`        | Flex direction determines stack type |
| `<button>`         | `Button`                      | Use buttonStyle for custom styling   |
| `<input>`          | `TextField`                   | Or `SecureField` for passwords       |
| `<img>`            | `AsyncImage`                  | Built-in caching and loading states  |
| `<a>` / `Link`     | `NavigationLink`              | For navigation within app            |
| `useState`         | `@State`                      | Local view state                     |
| `useEffect`        | `.task` / `.onAppear`         | Lifecycle methods                    |
| `useContext`       | `@EnvironmentObject`          | Shared state across views            |
| `map()`            | `ForEach`                     | Iterate over collections             |
| `onClick`          | `action: { }`                 | Closure for button actions           |
| `className`        | `.modifier()`                 | View modifiers chain together        |
| `style={{}}`       | `.frame().background()`       | Multiple modifiers                   |
| Conditional render | `if/else` in ViewBuilder      | SwiftUI handles efficiently          |
| Modal/Dialog       | `.sheet` / `.fullScreenCover` | Native presentations                 |
| Toast/Alert        | `.alert` / `.toast` (Sonner)  | Native + third-party                 |

---

## 🎯 Conversion Checklist

When converting a web component to iOS:

- [ ] Identify the component's purpose
- [ ] Map React hooks to SwiftUI property wrappers
- [ ] Convert JSX/HTML structure to SwiftUI ViewBuilder
- [ ] Replace CSS classes with SwiftUI modifiers
- [ ] Update event handlers (onClick → action closures)
- [ ] Replace fetch/axios with URLSession/async await
- [ ] Use @Published for reactive state updates
- [ ] Implement MVVM pattern (separate ViewModel if complex)
- [ ] Add iOS-specific features (haptics, context menus, etc.)
- [ ] Test on simulator and physical device

---

**Next**: [API Integration Guide](./03-api-integration.md)

**All web components have iOS equivalents - just different syntax! 🚀**
