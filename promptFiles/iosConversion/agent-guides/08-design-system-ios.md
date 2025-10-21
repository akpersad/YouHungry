# Design System - iOS (Liquid Glass + Neumorphism)

Complete design system for Fork In The Road iOS app, blending iOS 26 Liquid Glass with your neumorphism brand.

---

## 🎯 Design Philosophy

**Hybrid Approach** (per your request):

- **System UI**: Use iOS 26 Liquid Glass (navigation, sheets, native controls)
- **Brand Identity**: Maintain neumorphism (cards, restaurant views, custom components)
- **Result**: Native iOS feel + recognizable cross-platform brand

**Key Principles**:

1. **Native First**: Use iOS patterns where they enhance UX
2. **Brand Consistency**: Maintain neumorphic depth for content
3. **Accessibility**: WCAG AA compliance, Dynamic Type support
4. **Performance**: Optimize shadows and effects for smooth 60 FPS

---

## 🌈 Color System

### Color Asset Catalog

```swift
// Resources/Assets.xcassets/Colors/
// Define all colors here for easy light/dark mode switching

// Primary Colors
AccentInfrared          #FF3366 (light) / #FF4477 (dark)
AccentInfraredLight     #FF6699
AccentInfraredDark      #CC1144

// Backgrounds
BackgroundPrimary       #fafafa (light) / #1a1a1a (dark)
BackgroundSecondary     #f5f5f5 (light) / #2d2d2d (dark)
CardBackground          #ffffff (light) / #2d2d2d (dark)

// Text
TextPrimary             #1a1a1a (light) / #ffffff (dark)
TextSecondary           #4a4a4a (light) / #d1d1d1 (dark)
TextTertiary            #8a8a8a (light) / #b8b8b8 (dark)

// Borders
BorderPrimary           #e5e5e5 (light) / #404040 (dark)
BorderSecondary         #d1d1d1 (light) / #ababab (dark)

// Semantic Colors
SuccessGreen            #10B981
WarningYellow           #F59E0B
ErrorRed                #EF4444
InfoBlue                #3B82F6
```

### SwiftUI Color Extensions

```swift
// Core/Design/Colors.swift
import SwiftUI

extension Color {
    // MARK: - Brand Colors

    static let accentInfrared = Color("AccentInfrared")
    static let accentInfraredLight = Color("AccentInfraredLight")
    static let accentInfraredDark = Color("AccentInfraredDark")

    // MARK: - Backgrounds

    static let backgroundPrimary = Color("BackgroundPrimary")
    static let backgroundSecondary = Color("BackgroundSecondary")
    static let cardBackground = Color("CardBackground")

    // MARK: - Text

    static let textPrimary = Color("TextPrimary")
    static let textSecondary = Color("TextSecondary")
    static let textTertiary = Color("TextTertiary")

    // MARK: - Borders

    static let borderPrimary = Color("BorderPrimary")
    static let borderSecondary = Color("BorderSecondary")

    // MARK: - Semantic

    static let successGreen = Color("SuccessGreen")
    static let warningYellow = Color("WarningYellow")
    static let errorRed = Color("ErrorRed")
    static let infoBlue = Color("InfoBlue")
}
```

---

## 📝 Typography

### Font System

```swift
// Core/Design/Typography.swift
import SwiftUI

extension Font {
    // MARK: - Display (Large Titles)

    static let displayLarge = Font.system(size: 36, weight: .bold)
    static let displayMedium = Font.system(size: 30, weight: .bold)
    static let displaySmall = Font.system(size: 24, weight: .semibold)

    // MARK: - Headings

    static let headingLarge = Font.system(size: 20, weight: .semibold)
    static let headingMedium = Font.system(size: 18, weight: .semibold)
    static let headingSmall = Font.system(size: 16, weight: .semibold)

    // MARK: - Body

    static let bodyLarge = Font.system(size: 18, weight: .regular)
    static let bodyMedium = Font.system(size: 16, weight: .regular)
    static let bodySmall = Font.system(size: 14, weight: .regular)

    // MARK: - Caption

    static let captionLarge = Font.system(size: 14, weight: .medium)
    static let captionMedium = Font.system(size: 12, weight: .regular)
    static let captionSmall = Font.system(size: 10, weight: .regular)
}

// Custom text styles with Dynamic Type support
extension Text {
    func displayLarge() -> Text {
        self.font(.largeTitle.weight(.bold))
    }

    func headingLarge() -> Text {
        self.font(.title2.weight(.semibold))
    }

    func bodyRegular() -> Text {
        self.font(.body)
    }

    func captionRegular() -> Text {
        self.font(.caption)
    }
}
```

---

## 🎨 Liquid Glass Components (iOS 26 Native)

### Navigation Bar (Liquid Glass)

```swift
// Use native SwiftUI NavigationStack with iOS 26 styling
struct SomeView: View {
    var body: some View {
        NavigationStack {
            Content()
                .navigationTitle("Collections")
                .navigationBarTitleDisplayMode(.large)
                .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
                .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }
}

// Large Title with Liquid Glass effect
.navigationTitle("Collections")
.navigationBarTitleDisplayMode(.large)

// Inline Title
.navigationBarTitleDisplayMode(.inline)
```

### Sheets & Modals (Liquid Glass)

```swift
// Native iOS 26 sheet with Liquid Glass background
.sheet(isPresented: $showSheet) {
    CreateCollectionView()
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(.ultraThinMaterial)
        .presentationCornerRadius(32)
}

// Full screen with Liquid Glass
.fullScreenCover(isPresented: $showCover) {
    DetailView()
        .background(.ultraThinMaterial)
}
```

### Buttons (Liquid Glass)

```swift
// Core/Design/Components/LiquidGlassButton.swift
struct LiquidGlassButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(
                    .ultraThinMaterial,
                    in: RoundedRectangle(cornerRadius: 16)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(.white.opacity(0.2), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

// Usage
LiquidGlassButton("Create Collection") {
    viewModel.createCollection()
}
```

---

## 🎴 Neumorphic Components (Brand Identity)

### Restaurant Card (Neumorphism)

```swift
// Core/Design/Components/NeuRestaurantCard.swift
struct NeuRestaurantCard: View {
    let restaurant: Restaurant

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image
            if let photoUrl = restaurant.photos.first {
                CachedAsyncImage(url: photoUrl)
                    .frame(height: 180)
                    .clipped()
            }

            // Content
            VStack(alignment: .leading, spacing: 8) {
                Text(restaurant.name)
                    .font(.headingMedium)
                    .foregroundColor(.textPrimary)

                Text(restaurant.cuisine)
                    .font(.bodySmall)
                    .foregroundColor(.textSecondary)

                HStack {
                    // Rating
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                        Text(restaurant.formattedRating)
                    }
                    .font(.captionMedium)

                    Spacer()

                    // Price
                    Text(restaurant.formattedPrice)
                        .font(.captionMedium)
                        .foregroundColor(.textSecondary)
                }
            }
            .padding()
        }
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .neuShadow()
    }
}

// Neumorphic shadow modifier
extension View {
    func neuShadow(intensity: CGFloat = 1.0) -> some View {
        self
            .shadow(
                color: Color.black.opacity(0.1 * intensity),
                radius: 8,
                x: 4,
                y: 4
            )
            .shadow(
                color: Color.white.opacity(0.7 * intensity),
                radius: 8,
                x: -4,
                y: -4
            )
    }
}
```

### Collection Card (Blend: Liquid Glass + Neumorphism)

```swift
// Core/Design/Components/CollectionCard.swift
struct CollectionCard: View {
    let collection: Collection

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with Liquid Glass effect
            HStack {
                Text(collection.name)
                    .font(.headingLarge)
                    .foregroundColor(.textPrimary)

                Spacer()

                // Restaurant count badge with Liquid Glass
                Text("\(collection.restaurantCount)")
                    .font(.captionLarge)
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        .ultraThinMaterial,
                        in: Capsule()
                    )
            }

            // Description
            if let description = collection.description {
                Text(description)
                    .font(.bodySmall)
                    .foregroundColor(.textSecondary)
                    .lineLimit(2)
            }

            // Restaurant preview (neumorphic)
            if let restaurants = collection.restaurants?.prefix(3) {
                HStack(spacing: -20) {
                    ForEach(Array(restaurants.enumerated()), id: \.element.id) { index, restaurant in
                        if let photo = restaurant.photos.first {
                            CachedAsyncImage(url: photo)
                                .frame(width: 60, height: 60)
                                .clipShape(Circle())
                                .overlay(
                                    Circle()
                                        .stroke(Color.cardBackground, lineWidth: 3)
                                )
                                .zIndex(Double(restaurants.count - index))
                        }
                    }
                }
            }
        }
        .padding(20)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .neuShadow()
    }
}
```

---

## 🎭 Tab Bar (Native iOS 26)

```swift
// Use native TabView with customization
struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            CollectionsView()
                .tabItem {
                    Label("Collections", systemImage: "square.grid.2x2")
                }
                .tag(0)

            GroupsView()
                .tabItem {
                    Label("Groups", systemImage: "person.3")
                }
                .tag(1)

            DecisionsView()
                .tabItem {
                    Label("Decisions", systemImage: "shuffle")
                }
                .tag(2)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
                .tag(3)
        }
        .tint(.accentInfrared)
    }
}
```

---

## ✨ iOS 26 Specific Features

### Liquid Glass Effects

```swift
// Material backgrounds
.background(.ultraThinMaterial)    // Most translucent
.background(.thinMaterial)         // Slightly more opaque
.background(.regularMaterial)      // Standard translucency
.background(.thickMaterial)        // More opaque
.background(.ultraThickMaterial)   // Least translucent

// Apply to views
VStack {
    // Content
}
.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))

// Vibrancy effects (Liquid Glass)
Text("Hello")
    .foregroundStyle(.primary)
    .background(.thinMaterial)
```

### Dynamic Island Integration

```swift
// For Live Activities (Epic 8)
import ActivityKit

struct DecisionAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let groupName: String
        let voteCount: Int
        let totalMembers: Int
        let timeRemaining: String
    }
}

// Dynamic Island will show compact view
```

---

## 🎨 Component Library

### Button Variants

```swift
// Core/Design/Components/Buttons.swift
import SwiftUI

// 1. Liquid Glass Button (System UI)
struct LGButton: View {
    let title: String
    let icon: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                if let icon = icon {
                    Image(systemName: icon)
                }
                Text(title)
            }
            .font(.headline)
            .foregroundColor(.white)
            .padding()
            .frame(maxWidth: .infinity)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(.white.opacity(0.2), lineWidth: 1)
            )
        }
    }
}

// 2. Neumorphic Button (Brand)
struct NeuButton: View {
    let title: String
    let variant: Variant
    let action: () -> Void

    enum Variant {
        case primary, secondary, destructive

        var backgroundColor: Color {
            switch self {
            case .primary: return .accentInfrared
            case .secondary: return .cardBackground
            case .destructive: return .errorRed
            }
        }

        var foregroundColor: Color {
            switch self {
            case .primary, .destructive: return .white
            case .secondary: return .textPrimary
            }
        }
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(variant.foregroundColor)
                .padding()
                .frame(maxWidth: .infinity)
                .background(variant.backgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(NeuButtonStyle())
    }
}

struct NeuButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .neuShadow(intensity: configuration.isPressed ? 0.5 : 1.0)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// 3. Context Menu Button (Long Press)
struct NeuContextButton: View {
    let title: String
    let action: () -> Void
    let contextActions: [ContextAction]

    struct ContextAction {
        let title: String
        let icon: String
        let role: ButtonRole?
        let action: () -> Void
    }

    var body: some View {
        Button(action: action) {
            Text(title)
        }
        .contextMenu {
            ForEach(contextActions, id: \.title) { contextAction in
                Button(role: contextAction.role) {
                    contextAction.action()
                } label: {
                    Label(contextAction.title, systemImage: contextAction.icon)
                }
            }
        }
    }
}
```

### Card Variants

```swift
// Core/Design/Components/Cards.swift
import SwiftUI

// 1. Liquid Glass Card (Minimal Content)
struct LGCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
    }
}

// 2. Neumorphic Card (Rich Content)
struct NeuCard<Content: View>: View {
    let content: Content
    let isPressed: Bool

    init(isPressed: Bool = false, @ViewBuilder content: () -> Content) {
        self.isPressed = isPressed
        self.content = content()
    }

    var body: some View {
        content
            .padding()
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .neuShadow(intensity: isPressed ? 0.3 : 1.0)
    }
}

// 3. Hybrid Card (Liquid Glass background + Neumorphic depth)
struct HybridCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding()
            .background(
                .regularMaterial,
                in: RoundedRectangle(cornerRadius: 24)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(.white.opacity(0.1), lineWidth: 1)
            )
            .neuShadow(intensity: 0.6)
    }
}
```

---

## 🌓 Dark Mode Support

### Adaptive Colors

```swift
// All colors automatically adapt based on color assets
// Use semantic colors, never hardcode

// ✅ Good
Text("Hello")
    .foregroundColor(.textPrimary)
    .background(.cardBackground)

// ❌ Bad
Text("Hello")
    .foregroundColor(Color(hex: "#1a1a1a"))
```

### Testing Dark Mode

```swift
// Force preview in dark mode
#Preview("Dark Mode") {
    RestaurantCard(restaurant: .mock)
        .preferredColorScheme(.dark)
}

// Test both modes
#Preview {
    VStack {
        RestaurantCard(restaurant: .mock)
            .preferredColorScheme(.light)

        RestaurantCard(restaurant: .mock)
            .preferredColorScheme(.dark)
    }
}
```

---

## 🎯 Component Examples

### Input Fields (Neumorphic)

```swift
// Core/Design/Components/NeuTextField.swift
struct NeuTextField: View {
    let label: String
    @Binding var text: String
    let placeholder: String
    let error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.captionLarge)
                .foregroundColor(.textSecondary)

            TextField(placeholder, text: $text)
                .padding()
                .background(Color.backgroundSecondary)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(
                            error != nil ? Color.errorRed : Color.borderPrimary,
                            lineWidth: 1
                        )
                )
                .shadow(
                    color: Color.black.opacity(0.05),
                    radius: 4,
                    x: 2,
                    y: 2
                )

            if let error = error {
                Text(error)
                    .font(.captionSmall)
                    .foregroundColor(.errorRed)
            }
        }
    }
}
```

### List Row (Hybrid)

```swift
// Core/Design/Components/NeuListRow.swift
struct NeuListRow<Content: View>: View {
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
                    rowContent
                }
                .buttonStyle(.plain)
            } else {
                rowContent
            }
        }
    }

    private var rowContent: some View {
        content
            .padding()
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}
```

---

## 📐 Spacing & Layout

### Spacing System

```swift
// Core/Design/Spacing.swift
enum Spacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}

// Usage
VStack(spacing: Spacing.md) {
    // Content
}
.padding(Spacing.lg)
```

### Corner Radius

```swift
enum CornerRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let full: CGFloat = 9999 // For pills/circles
}

// Usage
.clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg))
```

---

## 💫 Animations & Haptics

### Standard Animations

```swift
// Core/Design/Animations.swift
extension Animation {
    static let quick = Animation.easeInOut(duration: 0.2)
    static let standard = Animation.easeInOut(duration: 0.3)
    static let slow = Animation.easeInOut(duration: 0.5)
    static let spring = Animation.spring(response: 0.3, dampingFraction: 0.7)
}

// Usage
.animation(.quick, value: isExpanded)
```

### Haptic Feedback

```swift
// Core/Design/Haptics.swift
import UIKit

enum Haptics {
    static func light() {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }

    static func medium() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }

    static func heavy() {
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()
    }

    static func success() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    static func warning() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.warning)
    }

    static func error() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
    }

    static func selection() {
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
    }
}

// Usage
Button("Create") {
    Haptics.success()
    viewModel.create()
}
```

---

## 🎯 Usage Guidelines

### When to Use Liquid Glass

**Navigation Elements**:

- Navigation bars
- Tab bars
- Toolbars
- Sheets/modals background

**System Controls**:

- Native buttons (when system-style is appropriate)
- Segmented controls
- Switches and toggles
- Sliders

**Overlays**:

- Context menus
- Popovers
- Alerts

### When to Use Neumorphism

**Content Cards**:

- Restaurant cards
- Collection cards
- Decision cards
- Group cards

**Custom Components**:

- Restaurant search results
- Voting interface
- Decision result display
- Profile cards

**Forms**:

- Custom input fields
- Form containers
- Submit buttons

### When to Blend Both

**Complex Cards**:

- Restaurant detail view (Liquid Glass header + Neumorphic content)
- Collection detail (Liquid Glass toolbar + Neumorphic list)
- Group view (Liquid Glass navigation + Neumorphic cards)

---

## ✅ Design System Checklist

**Setup**:

- [ ] Color assets defined in Assets.xcassets
- [ ] Typography system implemented
- [ ] Spacing constants defined
- [ ] Shadow modifiers created
- [ ] Button components created
- [ ] Card components created
- [ ] Haptic feedback utilities

**Testing**:

- [ ] Test all components in light mode
- [ ] Test all components in dark mode
- [ ] Test with system font sizes (Dynamic Type)
- [ ] Test on different device sizes
- [ ] Verify WCAG AA contrast ratios
- [ ] Test haptic feedback on device

**Documentation**:

- [ ] Component usage examples
- [ ] Color palette documented
- [ ] Typography scales documented
- [ ] Animation guidelines
- [ ] Accessibility notes

---

**Next**: [Testing Strategy Guide](./09-testing-strategy.md)

**Design system is your brand on iOS! 🎨**
