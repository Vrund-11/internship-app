# Graph Report - canovet  (2026-05-25)

## Corpus Check
- 135 files · ~61,248 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 302 nodes · 333 edges · 82 communities (74 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40957eda`
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `addBot()` - 29 edges
2. `cn()` - 20 edges
3. `useAuth()` - 12 edges
4. `useCity()` - 9 edges
5. `resolveServiceType()` - 7 edges
6. `main()` - 7 edges
7. `runTests()` - 7 edges
8. `lock()` - 6 edges
9. `delay()` - 6 edges
10. `getServiceSlug()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `handleOtpSubmit()` --calls--> `login()`  [INFERRED]
  apps/user-app/src/app/(public)/login/page.tsx → backend/src/test-support.ts
- `ProfilePage()` --calls--> `useAuth()`  [INFERRED]
  apps/user-app/src/app/(protected)/profile/page.tsx → apps/user-app/src/context/AuthContext.tsx
- `isSlotAvailable()` --calls--> `getDistanceKm()`  [INFERRED]
  backend/src/services/slot.service.ts → backend/src/utils/geo.ts
- `ProtectedLayout()` --calls--> `useAuth()`  [INFERRED]
  apps/user-app/src/app/(protected)/layout.tsx → apps/user-app/src/context/AuthContext.tsx
- `ProtectedLayout()` --calls--> `useCity()`  [INFERRED]
  apps/user-app/src/app/(protected)/layout.tsx → apps/user-app/src/context/CityContext.tsx

## Communities (82 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (37): addBot(), askAddresses(), askDates(), askFeedbackStars(), askNegativeCategories(), askPets(), askPositiveAttributes(), askRescheduleDate() (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (5): handleAddAddress(), toDisplayAddress(), useBooking(), handleAddPet(), toDisplayPet()

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (5): getServiceCategory(), getServiceCategoryName(), getServicesForType(), getServiceSlug(), resolveServiceType()

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (5): Navbar(), useAuth(), useCity(), ProfilePage(), ProtectedLayout()

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (8): handleOtpSubmit(), cleanupTestBookings(), cleanupTestComplaints(), fail(), getTestBookingId(), login(), ok(), runTests()

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (5): handleAdd(), BookingSuccess(), handleAddPet(), calcTotal(), generateId()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (10): classifyComplaint(), fallbackSentiment(), getBertSentiment(), regexScan(), fail(), login(), main(), ok() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (6): cleanup(), main(), makeClient(), makeClientWithCookie(), generateAccessToken(), generateRefreshToken()

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (5): RootLayout(), AppProviders(), AuthProvider(), BookingProvider(), setAccessToken()

### Community 10 - "Community 10"
Cohesion: 0.25
Nodes (3): isSlotAvailable(), getDistanceKm(), generateSlots()

### Community 12 - "Community 12"
Cohesion: 0.7
Nodes (4): fail(), login(), main(), ok()

### Community 13 - "Community 13"
Cohesion: 0.7
Nodes (4): fail(), login(), main(), ok()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`, `Community 6`, `Community 11`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 4` to `Community 0`, `Community 9`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `useCity()` connect `Community 4` to `Community 0`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `ProtectedLayout()` and `Navbar()`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useCity()` (e.g. with `ProtectedLayout()` and `Navbar()`) actually correct?**
  _`useCity()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._