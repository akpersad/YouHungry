# Epic 11: App Store Submission

**Goal**: Prepare for and submit Fork In The Road to the Apple App Store

**Duration**: 1 week (aggressive: 4-5 days + Apple review time)
**Priority**: 🔴 Critical
**Dependencies**: All previous epics complete, beta testing done

---

## 📖 Stories

### Story 11.1: App Store Assets Preparation

**Estimated Time**: 6-8 hours

**Tasks**:

- [ ] Create App Icon (1024x1024)

  - Design neumorphic app icon
  - Test at various sizes (check in Xcode)
  - Export in all required sizes
  - Add to Assets.xcassets

- [ ] Take Screenshots (all required sizes)

  - iPhone 6.9" (16 Pro Max): 1320 x 2868
  - iPhone 6.7" (15 Pro Max): 1284 x 2778
  - iPhone 5.5" (8 Plus): 1242 x 2208
  - Minimum 3 screenshots, recommend 5-8

- [ ] Screenshot content

  - 1: Onboarding/Sign in with Apple
  - 2: Collections view with beautiful cards
  - 3: Restaurant search results
  - 4: Group decision voting interface
  - 5: Decision result screen
  - 6: Map view (if implemented)
  - 7: Widgets showcase (optional)

- [ ] Create App Preview Video (optional but recommended)
  - 15-30 seconds
  - Portrait orientation
  - Show key features
  - No audio needed
  - Same sizes as screenshots

**Deliverables**:

- ✅ App icon ready (all sizes)
- ✅ Screenshots for all device sizes
- ✅ Screenshots look professional
- ✅ Optional: App preview video
- ✅ All assets uploaded to App Store Connect

---

### Story 11.2: App Store Listing

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Write app description (4000 chars max)

  - Hook (why use this app?)
  - Key features
  - Benefits
  - Call to action
  - (See app-store-connect-setup.md for example)

- [ ] Write promotional text (170 chars)

  - Can update anytime without new version
  - Highlight current promotion or feature

- [ ] Choose keywords (100 chars)

  - Research competitors
  - restaurant,food,decide,group,friends,voting,random,collection,dining,eat

- [ ] Select categories

  - Primary: Food & Drink
  - Secondary: Social Networking

- [ ] Set pricing and availability
  - Price: Free (with IAP)
  - Availability: All countries (or select specific)

**Deliverables**:

- ✅ Compelling app description
- ✅ Optimized keywords
- ✅ Categories selected
- ✅ Pricing configured

---

### Story 11.3: Privacy & Compliance

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Update Privacy Policy for iOS

  - Add iOS-specific data collection
  - Sign in with Apple privacy notes
  - Push notification data usage
  - Location data usage
  - Add to web app (accessible URL)

- [ ] Complete App Privacy questionnaire

  - Data Collection survey in App Store Connect
  - Contact Info (Name, Email, Phone)
  - Location (Precise Location for search)
  - Usage Data (Analytics)

- [ ] Add privacy manifest to app

  - NSFaceIDUsageDescription
  - NSLocationWhenInUseUsageDescription
  - NSPhotoLibraryUsageDescription (if applicable)

- [ ] Review for GDPR/CCPA compliance
  - Data export functionality
  - Data deletion functionality
  - Cookie consent (if using web views)

**Deliverables**:

- ✅ Privacy Policy updated and accessible
- ✅ App Privacy completed in App Store Connect
- ✅ All privacy strings in Info.plist
- ✅ Compliant with GDPR/CCPA

---

### Story 11.4: Demo Account Setup

**Estimated Time**: 2-3 hours

**Tasks**:

- [ ] Create demo account for App Review

  - Email: appreview@forkintheroad.app
  - Password: [Strong password]
  - Premium subscription enabled

- [ ] Pre-populate demo account

  - 3-5 collections with restaurants
  - Member of 2 test groups
  - Active group decision (can vote)
  - Decision history

- [ ] Document demo account
  - Create testing instructions for Apple
  - List all features to test
  - Note premium features enabled

**Deliverables**:

- ✅ Demo account created
- ✅ Account fully populated with sample data
- ✅ Testing instructions documented
- ✅ Account credentials added to App Store Connect

---

### Story 11.5: Final Pre-Submission Review

**Estimated Time**: 4-6 hours

**Tasks**:

- [ ] Complete App Store Connect

  - All metadata fields filled
  - Screenshots uploaded
  - App Privacy completed
  - Build selected
  - Contact info added
  - Support URL set

- [ ] Review App Store Guidelines compliance

  - No private APIs used
  - No references to other platforms (Android)
  - No "Coming Soon" features in description
  - Sign in with Apple present
  - All features described are working

- [ ] Test demo account one more time

  - Sign in works
  - All features accessible
  - No crashes

- [ ] Create App Review Notes
  - Testing instructions
  - Feature highlights
  - Known issues (if any, minor only)

**Deliverables**:

- ✅ App Store Connect 100% complete
- ✅ Compliance verified
- ✅ Demo account tested
- ✅ Review notes prepared

---

### Story 11.6: Submit to App Store

**Estimated Time**: 1-2 hours (submission) + 1-3 days (Apple review)

**Tasks**:

- [ ] Create final build

  - Increment build number
  - Version: 1.0.0
  - Build in Release configuration
  - Archive (Product → Archive)

- [ ] Upload to App Store Connect

  - Validate archive
  - Distribute to App Store
  - Wait for processing (10-30 minutes)

- [ ] Add build to version

  - Select uploaded build
  - Complete export compliance
  - Final review of all information

- [ ] Submit for Review

  - Click "Add for Review"
  - Review summary
  - Click "Submit for Review"
  - Receive confirmation email

- [ ] Monitor review status
  - Check App Store Connect daily
  - Respond to any questions from Apple
  - Be prepared to fix issues if rejected

**Deliverables**:

- ✅ Build submitted to App Store
- ✅ Status: "Waiting for Review"
- ✅ Monitoring review progress

---

### Story 11.7: Handle App Review (If Needed)

**Estimated Time**: Variable (0 hours if approved, 4-8 hours if rejected)

**Tasks (if rejected)**:

- [ ] Read rejection carefully

  - Understand what Apple wants
  - Check screenshots if provided

- [ ] Fix issues

  - Make required changes
  - Test thoroughly

- [ ] Resubmit
  - Increment build number
  - Upload new build
  - Add to version
  - Submit for review again

**Common Rejection Reasons**:

- Broken demo account → Test it yourself
- Missing Sign in with Apple → Already implemented ✅
- Privacy Policy issues → Review and update
- Crashes → Fix and test thoroughly
- Features don't match description → Update description

**Deliverables** (if approved):

- ✅ Status: "Pending Developer Release" or "Ready for Sale"
- ✅ App live on App Store! 🎉

---

### Story 11.8: Launch Day!

**Estimated Time**: 4-6 hours (coordination)

**Tasks**:

- [ ] Release app (if manual release)

  - Click "Release This Version"
  - App goes live in 15-30 minutes

- [ ] Monitor initial metrics

  - Check for crashes
  - Monitor reviews
  - Watch download numbers
  - Check server load

- [ ] Share launch

  - Post on social media
  - Share with beta testers
  - Email marketing (if applicable)
  - Submit to launch sites (Product Hunt, etc.)

- [ ] Set up monitoring
  - Firebase Analytics tracking
  - Crashlytics monitoring
  - User feedback channels

**Deliverables**:

- ✅ App live on App Store
- ✅ No immediate critical issues
- ✅ Monitoring active
- ✅ Launch announced

---

## 🔄 Sequential Timeline

**Week 1** (Preparation):

- Day 1-2: Story 11.1 (Assets)
- Day 3: Story 11.2 (Listing)
- Day 4: Story 11.3 (Privacy)
- Day 5: Story 11.4 (Demo Account)

**Week 2** (Submission):

- Day 1: Story 11.5 (Final Review)
- Day 2: Story 11.6 (Submit)
- Day 3-5: Wait for Apple review (1-3 days typically)
- Day 6-7: Story 11.7 (Handle Review) OR Story 11.8 (Launch!)

---

## ✅ Epic Completion Checklist

**App Store Connect**:

- [ ] App created
- [ ] All metadata complete
- [ ] Screenshots uploaded (all sizes)
- [ ] App icon uploaded
- [ ] Privacy Policy URL set
- [ ] App Privacy questionnaire complete
- [ ] Support URL set
- [ ] Demo account documented

**Build**:

- [ ] Final build created (Release config)
- [ ] Build uploaded to App Store Connect
- [ ] Build processing complete
- [ ] Export compliance answered
- [ ] Build selected in version

**Compliance**:

- [ ] Privacy Policy updated
- [ ] All required Info.plist strings present
- [ ] Sign in with Apple working
- [ ] No App Store guideline violations
- [ ] Age rating appropriate (4+)

**Submission**:

- [ ] All fields complete
- [ ] Submitted for review
- [ ] Confirmation email received
- [ ] Status: "Waiting for Review"

**Post-Submission**:

- [ ] Monitoring review status
- [ ] Prepared for potential rejection
- [ ] Launch plan ready
- [ ] Support channels ready

---

## 🎉 Success Criteria

**Approval**:

- App approved on first submission (ideal)
- Or approved on second submission (realistic)

**Launch**:

- App live on App Store
- Crash-free rate > 99.5% in first 24 hours
- No critical bugs in first week
- Positive initial reviews (> 4.0 stars)

---

## 📞 Support Preparation

**Launch Day Support**:

- Email: nodemailer_persad@yahoo.com
- Response time: < 24 hours
- Prepared for common questions:
  - "How do I sign up?"
  - "How do I create a collection?"
  - "How do I invite friends?"
  - "What's the difference between free and premium?"

**Post-Launch**:

- Monitor reviews daily (respond within 48 hours)
- Track crash reports (fix critical bugs immediately)
- Gather user feedback (plan v1.1 updates)

---

## 🚀 Post-Launch Roadmap

**Week 1-2 After Launch**:

- Monitor closely
- Fix any critical bugs
- Respond to reviews
- Gather feedback

**Month 1**:

- Analyze usage data
- Identify most/least used features
- Plan version 1.1 updates

**Month 2**:

- Implement top user requests
- Fix reported bugs
- Optimize based on usage patterns

**Month 3**:

- Consider external TestFlight (wider audience)
- Marketing push
- Feature expansion

---

**YOU DID IT! App is on the App Store! 🎉🍾**

**Celebrate, then start planning v1.1! 🚀**
