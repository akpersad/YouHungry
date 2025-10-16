# Screenshots & Demo Assets

## Required Assets

### 1. Demo Walkthrough GIF

**Filename:** `demo-walkthrough.gif`  
**Purpose:** Show complete user flow for README showcase  
**Duration:** 30-45 seconds  
**Quality:** 1280x720px @ 15fps, < 5MB file size

**Flow to Capture:**

1. Landing page → Sign in (2s)
2. Restaurant search with location (3s)
3. Filter by cuisine/rating (2s)
4. Add restaurant to collection (2s)
5. Create group decision (3s)
6. Drag & drop tiered voting (4s)
7. Submit vote + see results (3s)
8. Show winner notification (2s)

**Tools to Create:**

- **LICEcap** (Mac/Win) - Simple, free, good quality
- **Kap** (Mac) - Modern, beautiful UI, < 5MB exports
- **ScreenToGif** (Windows) - Feature-rich, free
- **Gifski** (CLI) - Highest quality, converts video to GIF

**Recording Tips:**

- Use incognito/private window (no extensions)
- 1280x720 browser window
- Smooth, deliberate mouse movements
- 2-second pause between actions
- Dark mode looks more professional

---

### 2. Feature Screenshots

**Purpose:** Visual documentation for case study

Required screenshots:

- [ ] `01-authentication.png` - Sign-up with phone verification
- [ ] `02-restaurant-search.png` - Search interface with filters
- [ ] `03-collections.png` - Personal collections view
- [ ] `04-group-decision.png` - Group collaboration interface
- [ ] `05-tiered-voting.png` - Drag-and-drop ranking
- [ ] `06-decision-results.png` - Results with winner
- [ ] `07-notifications.png` - Notification center
- [ ] `08-dark-mode.png` - Dark mode showcase

**Dimensions:** 1920x1080px (Full HD)  
**Format:** PNG with transparency where applicable  
**Quality:** High quality, < 500KB per file

---

## Quick GIF Creation Script

```bash
# Using Kap (Mac)
brew install --cask kap

# Using Gifski (CLI - highest quality)
brew install gifski

# Record video with QuickTime, then convert:
gifski video.mov -o demo-walkthrough.gif --width 1280 --fps 15 --quality 90

# Optimize file size:
gifsicle -O3 --colors 256 demo-walkthrough.gif -o demo-walkthrough-optimized.gif
```

---

## Current Assets

✅ `app-icon.png` - PWA icon  
✅ `desktop-dark.png` - Dark mode screenshot  
✅ `mobile-light.png` - Mobile screenshot  
❌ `demo-walkthrough.gif` - **NEEDED FOR README**

---

## After Creating the GIF

1. Place `demo-walkthrough.gif` in this directory
2. Verify file size < 5MB
3. Test in README.md (should load in < 2 seconds)
4. Commit with message: "Add demo walkthrough GIF for README"
