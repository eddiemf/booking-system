# Bookler — Product Backlog

## Vision

Bookler is a booking platform that allows establishments (salons, clinics, studios, etc.) to manage and offer their services online. Customers can discover services, check availability, and make reservations. Establishments control their resources (employees, rooms), schedules, and services.

---

## Domain Model

### Core Entities

| Entity | Description |
|---|---|
| **User** | A person with an account. Can be an owner or a customer. |
| **Establishment** | A business that offers bookable services. Belongs to a User (owner). |
| **Service** | Something an establishment offers (e.g., "60-min massage"). Has a name, description, and fixed duration (in minutes). |
| **Resource** | A bookable asset required to deliver a service — either an **employee** or a **room/space**. Belongs to an establishment. |
| **ServiceOffering** | A n-to-n link between a Service and a Resource. Represents that a service can be delivered by a specific resource. |
| **Schedule** | Defines the regular working hours for a resource (days of week + time range). |
| **Booking** | A reservation made by a customer for a specific service, resource, and time slot. |
| **Customer** | A user who makes bookings. |

### Relationships

```
User (owner)
  └── Establishment
        ├── Service (offered by establishment)
        │     └── Resource (n-to-n: any service can be assigned any resource)
        └── Resource
              └── Schedule (regular availability)

User (customer) ──► Booking ──► Service + Resource + time slot
```

### Key Rules

- A service has a fixed duration. Bookings are duration-length slots.
- A resource can only be in one booking at a time (no overlaps).
- A resource's availability is derived from its schedule minus existing bookings.
- An establishment must have at least one resource and one service before accepting bookings.

---

## Architectural Decisions

These decisions are fixed for the current phase of development and inform how features are built.

| Decision | Choice | Rationale |
|---|---|---|
| **Entity IDs** | Two-field identity: internal UUID (`id`, UUIDv7 generated in domain) + short alphanumeric public code (`code`, nanoid(10) generated in domain). APIs expose only the `code` as the public `id`. | Keeps public IDs opaque and stable; internal UUIDs never surface in API responses. |
| **Scoping** | Services, Resources, and Schedules belong to an Establishment | All reads and writes must be scoped to an `establishmentId`. |
| **API route nesting** | `GET /establishments/:id/services`, not `GET /services` | Prevents cross-establishment data leakage and aligns with the ownership model. |
| **Domain ↔ DB mapping** | `ServiceEntity.create()` for new (unperisted) entities; `reconstruct()` for DB-sourced ones | Keeps UUIDs and DB IDs from ever getting mixed up. |
| **Auth strategy** | OAuth2 with Google + Apple (no email/password) | No secret management burden; users authenticate via trusted providers. |
| **Token format** | JWT signed by server after OAuth callback | Stateless auth; server issues short-lived JWT after successful OAuth exchange. |
| **Authorization model** | Owners own establishments. 403 on ownership violation | Explicit forbidden response (vs hiding existence). |
| **Public endpoints** | `GET /establishments/:code`, `GET /establishments/:code/resources`, `GET /establishments/:code/services` are public | Customers must discover establishments and services without logging in. |

---

## Development Sequence

Features must be built in this order because of data dependency: you cannot scope a Service to an Establishment that doesn't exist yet, and you cannot enforce ownership without auth.

```
0. Authentication & Authorization (Epic 0) — MVP prerequisite
1. Establishment CRUD (Epic 2)
2. Service CRUD — scoped to establishment (Epic 1, revised)
3. Resource CRUD — scoped to establishment (Epic 3)
4. Schedule / Availability (Epic 4)
5. Booking (Epic 5)
```

---

## MVP Scope

The MVP delivers a functional end-to-end flow: an owner sets up an establishment with services and resources, and a customer can book a service.

---

## Epics & Features

---

### Epic 0: Authentication & Authorization

> Must be built first. All subsequent mutations require an authenticated user. Ownership determines who can mutate.

#### Feature 0.1 — OAuth Login with Google `[done]`

- **Endpoint:** `POST /auth/google`
- **Notes:**
  - Accepts OAuth token from Google.
  - Creates user if first login.
  - Returns JWT + user profile.
- **Acceptance criteria:**
  - [x] Returns 200 with JWT + user DTO on valid Google token.
  - [x] Creates a new User if email doesn't exist.
  - [x] Returns existing User if email already registered.
  - [x] Returns 401 on invalid/expired Google token.

#### Feature 0.2 — OAuth Login with Apple `[done]`

- **Endpoint:** `POST /auth/apple`
- **Notes:**
  - Same flow as Google for Apple Sign-In.
- **Acceptance criteria:**
  - [x] Returns 200 with JWT + user DTO on valid Apple token.
  - [x] Creates a new User if email doesn't exist.
  - [x] Returns existing User if email already registered.
  - [x] Returns 401 on invalid/expired Apple token.

#### Feature 0.3 — Get Current User `[done]`

- **Endpoint:** `GET /auth/me`
- **Notes:**
  - Requires valid JWT.
  - Returns current user profile.
- **Acceptance criteria:**
  - [x] Returns 200 with user DTO.
  - [x] Returns 401 when no/expired token.

#### Feature 0.4 — Authorization Layer `[done]`

- **Notes:**
  - Middleware applies to all mutation endpoints.
  - Use cases accept `userId`, verify ownership.
  - 403 Forbidden on ownership violations.
- **Acceptance criteria:**
  - [x] All POST/PUT/DELETE endpoints require valid JWT → 401 if missing.
  - [x] Updating another's establishment returns 403.
  - [x] Deleting another's resource returns 403.
  - [x] Setting schedule on another's resource returns 403.
  - [x] Public GET endpoints return data without auth.
  - [x] Wire auth middleware to all POST/PUT/DELETE routes in `server.ts`.

---

### Epic 2: Establishment Management

> Must be built first. All other entities (Services, Resources) are scoped to an Establishment.

#### Feature 2.1 — Create an Establishment `[done]`

- **Endpoint:** `POST /establishments`
- **Acceptance criteria:**
  - [x] Requires a `name`.
  - [x] Returns `201` with the created establishment DTO (`id`, `name`).
  - [x] Returns `400` when `name` is missing.
  - [ ] Returns `401` when no auth token provided.

#### Feature 2.2 — Get Establishment by ID `[done]`

- **Endpoint:** `GET /establishments/:code`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns the establishment data.
  - [x] Returns `404` when not found.

#### Feature 2.3 — Update an Establishment `[done]`

- **Endpoint:** `PUT /establishments/:code`
- **Acceptance criteria:**
  - [x] Allows updating `name`.
  - [x] Returns the updated establishment DTO.
  - [x] Returns `404` when not found.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner.

#### Feature 2.4 — Delete an Establishment `[done]`

- **Endpoint:** `DELETE /establishments/:code`
- **Acceptance criteria:**
  - [x] Returns `204` on success.
  - [x] Returns `404` when not found.
  - [x] Returns `409` if the establishment has active services or future bookings.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner.

---

### Epic 1: Service Management

> Services belong to an Establishment.

#### Feature 1.1 — Create a Service `[done]`

- **Endpoint:** `POST /establishments/:establishmentCode/services`
- **Acceptance criteria:**
  - [x] A service requires a `name` and a positive `duration` (in minutes).
  - [x] `description` is optional.
  - [x] Returns `201` with the created service DTO.
  - [x] Returns `400` when `name` is missing or `duration` is ≤ 0.
  - [x] Requires a valid `establishmentCode` in the URL.
  - [x] Returns `404` when the establishment does not exist.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner of the establishment.

#### Feature 1.2 — List Services `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/services`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns a list of all services.
  - [x] Returns an empty array when no services exist.
  - [x] Each item includes `id`, `name`, `description`, and `duration`.
  - [x] Returns only services belonging to the given establishment.
  - [ ] Returns `404` when the establishment does not exist (currently returns empty array).

#### Feature 1.3 — Get Service by ID `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/services/:code`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns the service matching the given code.
  - [x] Returns `404` when no service with that code exists in the establishment.

#### Feature 1.4 — Update a Service `[done]`

- **Endpoint:** `PUT /establishments/:establishmentCode/services/:code`
- **Acceptance criteria:**
  - [x] Allows updating `name`, `description`, and `duration`.
  - [x] Returns the updated service DTO.
  - [x] Returns `404` when the service does not exist in the establishment.
  - [x] Returns `400` on invalid values (same rules as creation).
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner of the establishment.

#### Feature 1.5 — Delete a Service `[done]`

- **Endpoint:** `DELETE /establishments/:establishmentCode/services/:code`
- **Acceptance criteria:**
  - [x] Removes the service permanently.
  - [x] Returns `204` on success.
  - [x] Returns `404` when the service does not exist in the establishment.
  - [x] Returns `409` if the service has future bookings.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner of the establishment.

#### Feature 1.6 — Create Service Offering `[done]`

- **Endpoint:** `POST /establishments/:establishmentCode/services/:code/service-offerings`
- **Notes:** A Service Offering represents the combination of a service with a specific resource.
- **Acceptance criteria:**
  - [x] Requires `resourceCode` in the body.
  - [x] Returns `201` with the service offering DTO containing `id`, `serviceCode`, `resourceCode`, `resourceName`.
  - [x] Returns `404` when service or resource does not exist in the establishment.
  - [x] Returns `409` when resource is already associated with the service.
  - [x] Returns `403` when user is not the owner of the establishment.

#### Feature 1.7 — Delete Service Offering `[done]`

- **Endpoint:** `DELETE /establishments/:establishmentCode/services/:code/service-offerings/:resourceCode`
- **Acceptance criteria:**
  - [x] Returns `204` on success.
  - [x] Returns `404` when the service offering does not exist.
  - [x] Returns `403` when user is not the owner of the establishment.

---

### Epic 3: Resource Management

> Establishments define the people and spaces needed to deliver services.

#### Feature 3.1 — Create a Resource `[done]`

- **Endpoint:** `POST /establishments/:establishmentCode/resources`
- **Acceptance criteria:**
  - [x] A resource requires a `name`.
  - [x] Returns `201` with the created resource DTO.
  - [x] Returns `400` on missing or invalid fields.
  - [x] Returns `404` when the establishment does not exist.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner of the establishment.

#### Feature 3.2 — List Resources for an Establishment `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/resources`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns all resources for the establishment.

#### Feature 3.3 — Update a Resource `[done]`

- **Endpoint:** `PUT /establishments/:establishmentCode/resources/:code`
- **Acceptance criteria:**
  - [x] Allows updating `name`.
  - [x] Returns the updated resource DTO.
  - [x] Returns `404` when not found.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner of the establishment.

#### Feature 3.4 — Delete a Resource `[done]`

- **Endpoint:** `DELETE /establishments/:establishmentCode/resources/:code`
- **Acceptance criteria:**
  - [x] Returns `204` on success.
  - [x] Returns `404` when not found.
  - [x] Returns `409` if the resource has future bookings.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner of the establishment.

---

### Epic 4: Schedule / Availability

> Resources publish their regular working hours.

#### Feature 4.1 — Set Schedule for a Resource `[done]`

- **Endpoint:** `PUT /establishments/:establishmentCode/resources/:resourceCode/schedule`
- **Acceptance criteria:**
  - [x] Accepts an array of schedule entries, each with `dayOfWeek` (0–6), `startTime` (HH:MM), and `endTime` (HH:MM).
  - [x] Replaces the existing schedule entirely.
  - [x] Returns `400` when time ranges are invalid (end ≤ start, invalid format).
  - [x] Returns `404` when the resource does not exist.
  - [ ] Returns `401` when no auth token provided.
  - [ ] Returns `403` when user is not the owner of the establishment.

#### Feature 4.2 — Get Available Slots `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/services/:serviceCode/availability?date=YYYY-MM-DD`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns a list of available time slots for the given service and date.
  - [x] Slots are derived from resource schedules minus existing bookings.
  - [x] Slot duration matches the service duration.
  - [x] Returns an empty list when no resources are assigned to the service.
  - [x] Returns `400` when `date` is missing or in the past.
  - [x] Returns `404` when the service does not exist.
  - [x] Each slot includes `startTime`, `endTime`, `resourceCode`, and `resourceName`.
  - [x] Only resources linked to the service via Service-Resource assignments are considered.

---

### Epic 5: Booking

> Customers reserve a service at a specific time.

#### Feature 5.1 — Create a Booking `[done]`

- **Endpoint:** `POST /bookings`
- **Acceptance criteria:**
  - [x] Requires `serviceId`, `resourceId`, and `startsAt` (ISO 8601 datetime).
  - [x] `startsAt` must be in the future.
  - [x] The selected resource must be available at `startsAt` for the service duration.
  - [x] Returns `201` with the booking DTO (`id`, `serviceId`, `resourceId`, `startsAt`, `endsAt`, `status`).
  - [x] Returns `400` on missing or invalid fields.
  - [x] Returns `409` when the resource is already booked for the overlapping time.
  - [x] Returns `401` when no auth token provided.

#### Feature 5.2 — Get a Booking `[done]`

- **Endpoint:** `GET /bookings/:code`
- **Acceptance criteria:**
  - [x] Returns the booking details.
  - [x] Returns `404` when not found.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when the booking belongs to another user.

#### Feature 5.3 — List Bookings `[done]`

- **Endpoint:** `GET /bookings`
- **Acceptance criteria:**
  - [x] Supports optional filtering by `establishmentCode`.
  - [x] Returns bookings ordered by `startsAt` ascending.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns only the current user's bookings (customers) or establishment bookings (owners).

#### Feature 5.4 — Cancel a Booking `[done]`

- **Endpoint:** `DELETE /bookings/:code`
- **Acceptance criteria:**
  - [x] Sets booking status to `cancelled`.
  - [x] Returns `200` with the cancelled booking DTO.
  - [x] Returns `404` when not found.
  - [x] Returns `400` when the booking is already cancelled.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when the booking belongs to another user.

---

## Post-MVP Ideas

These are out of scope for the MVP but can be prioritized in future iterations.

- **Customer profiles** — Dedicated customer entity with booking history.
- **Notifications** — Email/SMS reminders for upcoming bookings.
- **Recurring schedules** — Block recurring time off for resources.
- **Multi-resource services** — Services that require more than one resource simultaneously (e.g., room + employee).
- **Pricing** — Services have a price; bookings generate an invoice.
- **Waitlist** — Customers can join a waitlist when no slots are available.
- **Ratings & Reviews** — Customers rate completed bookings.

---

## Feature Status Legend

| Status | Meaning |
|---|---|
| `[done]` | Implemented and tested |
| `[in-progress]` | Currently being built |
| `[planned]` | Scoped for MVP, not yet started |
| `[post-mvp]` | Intentionally deferred |