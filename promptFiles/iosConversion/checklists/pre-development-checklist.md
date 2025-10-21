# Pre-Development Checklist

Complete this checklist BEFORE starting Epic 1.

---

## ✅ Web App Prerequisites

**Epic 11 Completion**:

- [ ] Sign in with Apple added to web app
- [ ] Clerk configured for Apple OAuth
- [ ] API endpoints documented
- [ ] Privacy Policy updated for iOS
- [ ] Business logic extracted for mobile API reuse

---

## ✅ Accounts & Services

**Apple**:

- [ ] Apple ID exists
- [ ] Apple Developer account (free tier OK for now)
- [ ] Enrolled in paid program ($99/year) OR plan to enroll before TestFlight

**Firebase**:

- [ ] Firebase account created
- [ ] Firebase project created ("you-hungry-ios")
- [ ] iOS app added to Firebase project
- [ ] GoogleService-Info.plist downloaded
- [ ] APNs key created in Apple Developer Portal
- [ ] APNs key uploaded to Firebase Console

**Hosting (Mobile API)**:

- [ ] Render account created
- [ ] GitHub account ready (for deployment)

**Development Tools**:

- [ ] GitHub repository created for iOS app
- [ ] Postman/Insomnia for API testing

---

## ✅ Development Environment

**Hardware**:

- [ ] Mac with macOS 15.2+ (you have: 15.7.1) ✅
- [ ] Minimum 50GB free disk space
- [ ] 16GB+ RAM

**Software**:

- [ ] Xcode 26.0.1 installed ✅
- [ ] Xcode Command Line Tools installed
- [ ] Git installed and configured
- [ ] iOS Simulators downloaded (iPhone 16 Pro, iPhone SE)

**Xcode Configuration**:

- [ ] Apple ID added to Xcode
- [ ] Development certificate created (automatic)
- [ ] Simulators installed (iOS 26, iOS 25)

---

## ✅ Documentation Review

**Read These First**:

- [ ] [Architecture Overview](../agent-guides/01-architecture-overview.md)
- [ ] [Getting Started Guide](../human-guide/getting-started.md)
- [ ] [Xcode Setup](../human-guide/xcode-setup.md)

**Understand These Concepts**:

- [ ] MVVM architecture pattern
- [ ] SwiftUI basics
- [ ] Async/await in Swift
- [ ] Core Data fundamentals
- [ ] Firebase integration basics

---

## ✅ Mobile API Preparation

**Backend Setup**:

- [ ] Reviewed web app API endpoints
- [ ] Understand data models (User, Collection, Restaurant, Group, Decision)
- [ ] Understand authentication flow (Clerk JWT)
- [ ] MongoDB connection string available
- [ ] Google Places API key available
- [ ] Twilio credentials available (for SMS)

---

## ✅ Design Assets

**Review Design System**:

- [ ] Web app design system reviewed
- [ ] Understand Liquid Glass (iOS 26)
- [ ] Understand neumorphism brand
- [ ] Prepared for blending both styles

**Have Ready** (for Epic 1):

- [ ] App icon concept (1024x1024)
- [ ] Color palette (from web app)
- [ ] Typography guidelines

---

## ✅ Project Planning

**Timeline Understanding**:

- [ ] 2-3 month aggressive timeline understood
- [ ] Daily commitment (2-3 hours minimum) committed
- [ ] Weekend sprints planned (4-6 hours Saturdays)

**Epic Flow**:

- [ ] Reviewed all 11 epics
- [ ] Understand dependencies
- [ ] Know which stories can be parallelized

**Support**:

- [ ] Know where to find help (agent guides)
- [ ] Understand AI will generate 80% of code
- [ ] Prepared for review and testing responsibilities

---

## ✅ Testing Preparation

**Test Accounts**:

- [ ] Personal test account planned (your email)
- [ ] Demo account credentials decided
- [ ] Beta tester list started (5-10 people)

**Testing Devices**:

- [ ] Have physical iPhone for testing (required for push notifications, biometrics)
- [ ] Know how to enable Developer Mode on iPhone

---

## ✅ Legal & Compliance

**Documents**:

- [ ] Privacy Policy reviewed
- [ ] Terms of Service reviewed
- [ ] Support email confirmed: nodemailer_persad@yahoo.com

**App Store**:

- [ ] Understand App Store review guidelines
- [ ] Know that Sign in with Apple is required ✅
- [ ] Prepared for 1-3 day review process

---

## ✅ Final Verification

**Before Starting Epic 1**:

- [ ] All checkboxes above completed
- [ ] Xcode can build and run (even just "Hello World")
- [ ] Firebase test event logged successfully
- [ ] Read [Epic 1: Foundation](../epic-breakdown/epic-01-foundation.md)

---

## 🚀 Ready to Start?

**If all boxes are checked, you're ready to begin!**

**Next Step**: Start [Epic 1: Foundation](../epic-breakdown/epic-01-foundation.md)

---

**Let's build this app! 🚀**
