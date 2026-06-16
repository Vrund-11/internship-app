# Graph Report - canovet  (2026-06-15)

## Corpus Check
- 188 files · ~126,206 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 577 nodes · 657 edges · 135 communities (124 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06fc55f0`
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
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `addBot()` - 33 edges
2. `addBot()` - 26 edges
3. `useAuth()` - 24 edges
4. `cn()` - 22 edges
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

## Communities (135 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (13): handleAddAddress(), toDisplayAddress(), RootLayout(), pad(), toDateOnly(), toDateOnly(), AppProviders(), AuthProvider() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (41): addBot(), askAddresses(), askBookingFaqs(), askBookingOptions(), askDates(), askFeedbackStars(), askNegativeCategories(), askPets() (+33 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (34): addBot(), askAddresses(), askBookingFaqs(), askBookingOptions(), askDates(), askPets(), askRescheduleDate(), askRescheduleSlots() (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (11): handlePhoneSubmit(), handleOtpSubmit(), handlePhoneSubmit(), cleanupTestBookings(), cleanupTestComplaints(), fail(), getTestBookingId(), login() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (17): handleNameSubmit(), handleAddAddress(), handleAddPet(), handleAdd(), BookingSuccess(), handleAddPet(), handleNameSubmit(), hasRepeatingChars() (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (7): loadBookings(), getServiceCategory(), getServiceCategoryName(), getServicesForType(), getServiceSlug(), resolveServiceType(), deriveFollowUps()

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (3): Navbar(), useAuth(), ProfilePage()

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (6): cleanup(), main(), makeClient(), makeClientWithCookie(), generateAccessToken(), generateRefreshToken()

### Community 10 - "Community 10"
Cohesion: 0.23
Nodes (6): ExternalLink(), MonoText(), Text(), useThemeColor(), View(), useColorScheme()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (10): classifyComplaint(), fallbackSentiment(), getBertSentiment(), regexScan(), fail(), login(), main(), ok() (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (4): main(), main(), main(), connectRedis()

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (3): isSlotAvailable(), getDistanceKm(), generateSlots()

### Community 16 - "Community 16"
Cohesion: 0.32
Nodes (4): fetchBookings(), formatSlotTime(), formatTime(), onRefresh()

### Community 22 - "Community 22"
Cohesion: 0.7
Nodes (4): fail(), login(), main(), ok()

### Community 23 - "Community 23"
Cohesion: 0.7
Nodes (4): fail(), login(), main(), ok()

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 8` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 13`, `Community 17`, `Community 19`, `Community 20`, `Community 27`, `Community 28`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `useCity()` connect `Community 13` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 17`, `Community 20`, `Community 24`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 3` to `Community 8`, `Community 1`, `Community 13`, `Community 6`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `ProtectedLayout()` and `Navbar()`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useCity()` (e.g. with `ProtectedLayout()` and `Navbar()`) actually correct?**
  _`useCity()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._