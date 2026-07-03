# Graph Report - canovet  (2026-07-03)

## Corpus Check
- 190 files · ~136,428 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 603 nodes · 695 edges · 129 communities (118 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0870d2a6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `addBot()` - 34 edges
2. `cn()` - 28 edges
3. `addBot()` - 26 edges
4. `useAuth()` - 25 edges
5. `useCity()` - 19 edges
6. `delay()` - 8 edges
7. `useBooking()` - 8 edges
8. `delay()` - 8 edges
9. `connectRedis()` - 8 edges
10. `lock()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handleNameSubmit()` --calls--> `validateName()`  [INFERRED]
  apps/mobile/app/login.tsx → packages/shared/src/validation.ts
- `handleNameSubmit()` --calls--> `validateName()`  [INFERRED]
  apps/user-app/src/app/(public)/login/page.tsx → packages/shared/src/validation.ts
- `handleAddAddress()` --calls--> `validateHouse()`  [INFERRED]
  apps/mobile/app/booking/address.tsx → packages/shared/src/validation.ts
- `handleAddAddress()` --calls--> `validateArea()`  [INFERRED]
  apps/mobile/app/booking/address.tsx → packages/shared/src/validation.ts
- `handleAddAddress()` --calls--> `validateCity()`  [INFERRED]
  apps/mobile/app/booking/address.tsx → packages/shared/src/validation.ts

## Communities (129 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (5): Navbar(), useAuth(), useCity(), ProfilePage(), ProtectedLayout()

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (42): addBot(), askAddresses(), askBookingFaqs(), askBookingOptions(), askDates(), askFeedbackStars(), askNegativeCategories(), askPets() (+34 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (34): addBot(), askAddresses(), askBookingFaqs(), askBookingOptions(), askDates(), askPets(), askRescheduleDate(), askRescheduleSlots() (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (10): loadBookings(), BookingSuccess(), getServiceCategory(), getServiceCategoryName(), getServicesForType(), getServiceSlug(), resolveServiceType(), deriveFollowUps() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (11): handlePhoneSubmit(), handleOtpSubmit(), handlePhoneSubmit(), cleanupTestBookings(), cleanupTestComplaints(), fail(), getTestBookingId(), login() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (17): handleAddAddress(), toDisplayAddress(), handleNameSubmit(), handleAddAddress(), handleAddPet(), handleAdd(), handleAddPet(), handleNameSubmit() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (10): handleAddAddress(), toDisplayAddress(), RootLayout(), AppProviders(), AuthProvider(), BookingProvider(), useBooking(), setAccessToken() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (3): pad(), toDateOnly(), toDateOnly()

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (6): cleanup(), main(), makeClient(), makeClientWithCookie(), generateAccessToken(), generateRefreshToken()

### Community 11 - "Community 11"
Cohesion: 0.23
Nodes (6): ExternalLink(), MonoText(), Text(), useThemeColor(), View(), useColorScheme()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (10): classifyComplaint(), fallbackSentiment(), getBertSentiment(), regexScan(), fail(), login(), main(), ok() (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (3): isSlotAvailable(), getDistanceKm(), generateSlots()

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (4): main(), main(), main(), connectRedis()

### Community 16 - "Community 16"
Cohesion: 0.32
Nodes (4): fetchBookings(), formatSlotTime(), formatTime(), onRefresh()

### Community 19 - "Community 19"
Cohesion: 0.7
Nodes (4): fail(), login(), main(), ok()

### Community 20 - "Community 20"
Cohesion: 0.7
Nodes (4): fail(), login(), main(), ok()

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `useCity()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 8`, `Community 9`, `Community 17`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 1` to `Community 0`, `Community 2`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `ProtectedLayout()` and `Navbar()`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useCity()` (e.g. with `ProtectedLayout()` and `Navbar()`) actually correct?**
  _`useCity()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._