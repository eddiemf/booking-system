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
| **ServiceOffering** | An n-to-n link between a Service and a Resource. Configures how the service is delivered by a resource — duration, slot interval, price, and max capacity. |
| **Schedule** | Defines the regular working hours for a resource (days of week + time range). |
| **Booking** | A reservation made by a customer for a specific service, resource, and time slot. |
| **Customer** | A user who makes bookings. |

### Relationships

```
User (owner)
  └── Establishment
        ├── Service (offered by establishment)
        │     └── Resource (n-to-n via ServiceOffering)
        └── Resource
              └── Schedule (regular availability)

User (customer) ──► Booking ──► Service + Resource + time slot
```

### Key Rules

- A service has a fixed duration. Bookings are duration-length slots.
- A resource can only be in one booking at a time (no overlaps).
- A resource's availability is derived from its schedule minus existing bookings.
- An establishment must have at least one resource and one service before accepting bookings.
- A ServiceOffering configures duration, slot interval, price, and capacity per service-resource pair — these can differ from the base Service duration.

---

## Architectural Decisions

These decisions are fixed for the current phase of development and inform how features are built.

| Decision | Choice | Rationale |
|---|---|---|
| **Entity IDs** | Two-field identity: internal UUID (`id`, UUIDv7 generated in domain) + short alphanumeric public code (`code`, nanoid(10) generated in domain). APIs expose only the `code` as the public `id`. | Keeps public IDs opaque and stable; internal UUIDs never surface in API responses. |
| **Scoping** | Services, Resources, and Schedules belong to an Establishment | All reads and writes must be scoped to an `establishmentCode`. |
| **API route nesting** | `GET /establishments/:establishmentCode/services`, not `GET /services` | Prevents cross-establishment data leakage and aligns with the ownership model. |
| **Domain ↔ DB mapping** | `Entity.create()` for new (unpersisted) entities; `reconstruct()` for DB-sourced ones | Keeps UUIDs and DB IDs from ever getting mixed up. |
| **Auth strategy** | OAuth2 with Google + Apple (no email/password) | No secret management burden; users authenticate via trusted providers. |
| **Token format** | JWT signed by server after OAuth callback | Stateless auth; server issues short-lived JWT after successful OAuth exchange. |
| **Authorization model** | Owners own establishments. 403 on ownership violation | Explicit forbidden response (vs hiding existence). |
| **Public endpoints** | `GET /establishments`, `GET /establishments/:code`, `GET /establishments/:code/resources`, `GET /establishments/:code/services`, `GET /establishments/:code/services/:code`, `GET /establishments/:code/services/:serviceCode/availability` are public | Customers must discover establishments and services without logging in. |
| **Resource schedules** | Schedule is set on a resource via `PUT /establishments/:code/resources/:resourceCode/schedule`. Replaces all entries atomically. | Simplifies the write model — no partial updates. |

---

## Development Sequence

Features must be built in this order because of data dependency.

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

The MVP delivers a functional end-to-end flow: an owner sets up an establishment with services and resources, assigns resources to services with specific pricing and duration, configures schedules, and a customer can book a service.

---

## Epics & Features

---

### Epic 0: Authentication & Authorization

> Must be built first. All subsequent mutations require an authenticated user. Ownership determines who can mutate.

#### Feature 0.1 — OAuth Login with Google `[done]`

- **Endpoint:** `POST /auth/google`
- **Request body:**
  ```json
  { "token": "google-oauth-id-token" }
  ```
- **Response (200):** `AuthDTO`
  ```json
  {
    "token": "signed-jwt",
    "user": { "id": "usr123", "email": "alice@example.com", "name": "Alice" }
  }
  ```
- **Notes:**
  - Accepts OAuth ID token from Google.
  - Verifies token via `google-auth-library` using configured `GOOGLE_CLIENT_ID`.
  - Creates user if first login.
  - Returns JWT + user profile.
  - JWT payload: `{ userId, userCode, email }`, expires in 24h.
- **Acceptance criteria:**
  - [x] Returns 200 with JWT + user DTO on valid Google token.
  - [x] Creates a new User if email doesn't exist.
  - [x] Returns existing User if email already registered.
  - [x] Returns 401 on invalid/expired Google token.
  - [x] Returns 400 when token is missing from body.

#### Feature 0.2 — OAuth Login with Apple `[done]`

- **Endpoint:** `POST /auth/apple`
- **Request body:**
  ```json
  { "token": "apple-identity-token" }
  ```
- **Response (200):** `AuthDTO` (same shape as Google login)
- **Notes:**
  - Same flow as Google for Apple Sign-In via `apple-signin-auth` library.
  - Uses configured `APPLE_CLIENT_ID`.
- **Acceptance criteria:**
  - [x] Returns 200 with JWT + user DTO on valid Apple token.
  - [x] Creates a new User if email doesn't exist.
  - [x] Returns existing User if email already registered.
  - [x] Returns 401 on invalid/expired Apple token.
  - [x] Returns 400 when token is missing from body.

#### Feature 0.3 — Get Current User `[done]`

- **Endpoint:** `GET /auth/me`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response (200):** `UserDTO`
  ```json
  { "id": "usr123", "email": "alice@example.com", "name": "Alice" }
  ```
- **Notes:**
  - Requires valid JWT in Authorization header.
  - Returns current user profile from DB.
- **Acceptance criteria:**
  - [x] Returns 200 with user DTO.
  - [x] Returns 401 when no/expired token.
  - [x] Returns 404 when user does not exist.

#### Feature 0.4 — Authorization Layer `[done]`

- **Notes:**
  - JWT auth middleware applies to all mutation endpoints (POST/PUT/DELETE).
  - Use cases accept `userId`, verify establishment ownership.
  - 403 Forbidden on ownership violations.
- **Acceptance criteria:**
  - [x] All POST/PUT/DELETE endpoints require valid JWT → 401 if missing/expired.
  - [x] Updating another's establishment returns 403.
  - [x] Deleting another's resource returns 403.
  - [x] Setting schedule on another's resource returns 403.
  - [x] Creating/deleting service offerings on another's establishment returns 403.
  - [x] Public GET endpoints return data without auth.
  - [x] Wire auth middleware to all POST/PUT/DELETE routes in `server.ts`.

---

### Epic 2: Establishment Management

> Must be built first. All other entities (Services, Resources) are scoped to an Establishment.

#### Feature 2.1 — Create an Establishment `[done]`

- **Endpoint:** `POST /establishments`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  { "name": "My Salon" }
  ```
- **Response (201):** `EstablishmentDTO`
  ```json
  { "id": "est123", "name": "My Salon" }
  ```
- **Acceptance criteria:**
  - [x] Requires a `name`.
  - [x] Returns `201` with the created establishment DTO (`id`, `name`).
  - [x] Returns `400` when `name` is missing.
  - [x] Returns `401` when no auth token provided.

#### Feature 2.2 — List Establishments `[done]`

- **Endpoint:** `GET /establishments`
- **Query params:** `?limit=20&offset=0` (optional, defaults: limit=20, offset=0)
- **Response (200):** `EstablishmentDTO[]`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns a list of all establishments.
  - [x] Returns an empty array when no establishments exist.
  - [x] Each item includes `id` and `name`.
  - [x] Supports `?limit=` and `?offset=` query params for pagination.
  - [x] Returns 400 when limit is not a positive integer or offset is negative.

#### Feature 2.3 — Get Establishment by ID `[done]`

- **Endpoint:** `GET /establishments/:code`
- **Response (200):** `EstablishmentDTO`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns `200` with the establishment DTO.
  - [x] Returns `404` when not found.

#### Feature 2.4 — Update an Establishment `[done]`

- **Endpoint:** `PUT /establishments/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  { "name": "New Name" }
  ```
- **Response (200):** `EstablishmentDTO`
- **Acceptance criteria:**
  - [x] Allows updating `name`.
  - [x] Returns the updated establishment DTO.
  - [x] Returns `404` when not found.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner.
  - [x] Returns `400` when name is empty.

#### Feature 2.5 — Delete an Establishment `[done]`

- **Endpoint:** `DELETE /establishments/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response:** `204 No Content`
- **Acceptance criteria:**
  - [x] Returns `204` on success.
  - [x] Returns `404` when not found.
  - [x] Returns `409` if the establishment has associated resources, services, or future bookings (FK constraint).
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner.

---

### Epic 1: Service Management

> Services belong to an Establishment.

#### Feature 1.1 — Create a Service `[done]`

- **Endpoint:** `POST /establishments/:establishmentCode/services`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  {
    "name": "Haircut",
    "description": "A basic haircut",
    "duration": 30
  }
  ```
- **Response (201):** `ServiceDTO`
  ```json
  {
    "id": "svc123",
    "name": "Haircut",
    "description": "A basic haircut",
    "duration": 30,
    "establishmentCode": "est123"
  }
  ```
- **Acceptance criteria:**
  - [x] A service requires a `name` and a positive `duration` (in minutes).
  - [x] `description` is optional (defaults to empty string).
  - [x] Returns `201` with the created service DTO.
  - [x] Returns `400` when `name` is missing or `duration` is ≤ 0.
  - [x] Requires a valid `establishmentCode` in the URL.
  - [x] Returns `404` when the establishment does not exist.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner of the establishment.

#### Feature 1.2 — List Services `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/services`
- **Response (200):** `ServiceDTO[]`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns a list of all services for the establishment.
  - [x] Returns an empty array when no services exist.
  - [x] Each item includes `id`, `name`, `description`, `duration`, and `establishmentCode`.
  - [x] Returns only services belonging to the given establishment.
  - [ ] Returns `404` when the establishment does not exist (currently returns empty array).

#### Feature 1.3 — Get Service by ID `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/services/:code`
- **Response (200):** `ServiceDTO`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns the service matching the given code.
  - [x] Returns `404` when no service with that code exists in the establishment.

#### Feature 1.4 — Update a Service `[done]`

- **Endpoint:** `PUT /establishments/:establishmentCode/services/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  {
    "name": "Haircut",
    "description": "Premium haircut",
    "duration": 45
  }
  ```
- **Response (200):** `ServiceDTO`
- **Acceptance criteria:**
  - [x] Allows updating `name`, `description`, and `duration`.
  - [x] Returns the updated service DTO.
  - [x] Returns `404` when the service does not exist.
  - [x] Returns `400` on invalid values (same rules as creation).
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner of the establishment.

#### Feature 1.5 — Delete a Service `[done]`

- **Endpoint:** `DELETE /establishments/:establishmentCode/services/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response:** `204 No Content`
- **Acceptance criteria:**
  - [x] Removes the service permanently.
  - [x] Returns `204` on success.
  - [x] Returns `404` when the service does not exist.
  - [x] Returns `409` if the service has future bookings (FK constraint).
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner of the establishment.

#### Feature 1.6 — Create Service Offering `[done]`

- **Endpoint:** `POST /establishments/:establishmentCode/services/:code/service-offerings`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  {
    "resourceCode": "res123",
    "durationMinutes": 60,
    "slotIntervalMinutes": 30,
    "maxCapacity": 1,
    "price": 5000
  }
  ```
- **Response (201):** `ServiceOfferingDTO`
  ```json
  {
    "id": "off1",
    "serviceCode": "svc123",
    "resourceCode": "res123",
    "resourceName": "Alice",
    "maxCapacity": 1,
    "durationMinutes": 60,
    "slotIntervalMinutes": 30,
    "price": 5000
  }
  ```
- **Notes:**
  - Links a service to a resource with delivery-specific configuration (duration, interval, price, capacity).
  - `maxCapacity` and `price` are optional (defaults: maxCapacity=1, price=0).
  - `durationMinutes` and `slotIntervalMinutes` are required positive integers.
  - Price is in cents (integer).
- **Acceptance criteria:**
  - [x] Requires `resourceCode`, `durationMinutes`, `slotIntervalMinutes` in the body.
  - [x] Returns `201` with the service offering DTO.
  - [x] Returns `404` when service or resource does not exist.
  - [x] Returns `404` when resource belongs to another establishment.
  - [x] Returns `409` when resource is already assigned to this service.
  - [x] Returns `403` when user is not the owner of the establishment.
  - [x] Returns `400` when `durationMinutes` or `slotIntervalMinutes` are not positive integers.

#### Feature 1.7 — Delete Service Offering `[done]`

- **Endpoint:** `DELETE /establishments/:establishmentCode/services/:code/service-offerings/:resourceCode`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response:** `204 No Content`
- **Acceptance criteria:**
  - [x] Returns `204` on success.
  - [x] Returns `404` when the service offering does not exist.
  - [x] Returns `404` when service or resource does not exist.
  - [x] Returns `403` when user is not the owner of the establishment.
  - [x] Returns `401` when no auth token provided.

---

### Epic 3: Resource Management

> Establishments define the people and spaces needed to deliver services.

#### Feature 3.1 — Create a Resource `[done]`

- **Endpoint:** `POST /establishments/:establishmentCode/resources`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  { "name": "Alice" }
  ```
- **Response (201):** `ResourceDTO`
  ```json
  {
    "id": "res123",
    "name": "Alice",
    "establishmentCode": "est123"
  }
  ```
- **Acceptance criteria:**
  - [x] A resource requires a `name`.
  - [x] Returns `201` with the created resource DTO.
  - [x] Returns `400` on missing or invalid fields.
  - [x] Returns `404` when the establishment does not exist.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner of the establishment.

#### Feature 3.2 — List Resources for an Establishment `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/resources`
- **Response (200):** `ResourceDTO[]`
- **Notes:** Public endpoint. No auth required.
- **Acceptance criteria:**
  - [x] Returns all resources for the establishment.
  - [x] Returns an empty array when no resources exist.
  - [x] Each resource includes `id`, `name`, and `establishmentCode`.

#### Feature 3.3 — Update a Resource `[done]`

- **Endpoint:** `PUT /establishments/:establishmentCode/resources/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  { "name": "New Name" }
  ```
- **Response (200):** `ResourceDTO`
- **Acceptance criteria:**
  - [x] Allows updating `name`.
  - [x] Returns the updated resource DTO.
  - [x] Returns `404` when not found.
  - [x] Returns `404` when resource belongs to another establishment.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner of the establishment.

#### Feature 3.4 — Delete a Resource `[done]`

- **Endpoint:** `DELETE /establishments/:establishmentCode/resources/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response:** `204 No Content`
- **Acceptance criteria:**
  - [x] Returns `204` on success.
  - [x] Returns `404` when not found.
  - [x] Returns `409` if the resource has future bookings (FK constraint).
  - [x] Returns `404` when resource belongs to another establishment.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner of the establishment.

---

### Epic 4: Schedule / Availability

> Resources publish their regular working hours.

#### Feature 4.1 — Set Schedule for a Resource `[done]`

- **Endpoint:** `PUT /establishments/:establishmentCode/resources/:resourceCode/schedule`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  {
    "entries": [
      { "dayOfWeek": 1, "startTime": "09:00", "endTime": "12:00" },
      { "dayOfWeek": 1, "startTime": "13:00", "endTime": "17:00" },
      { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00" }
    ]
  }
  ```
- **Response (200):** `ScheduleDTO[]`
  ```json
  [
    {
      "id": "sch123",
      "resourceId": "uuid-res",
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ]
  ```
- **Notes:**
  - Accepts an array of schedule entries.
  - Replaces the existing schedule entirely (delete-all + insert).
  - `dayOfWeek`: 0 (Sunday) through 6 (Saturday).
  - `startTime` / `endTime`: HH:MM format (24h), zero-padded.
- **Acceptance criteria:**
  - [x] Accepts an array of schedule entries, each with `dayOfWeek` (0–6), `startTime` (HH:MM), and `endTime` (HH:MM).
  - [x] Replaces the existing schedule entirely.
  - [x] Returns `200` with the schedule DTOs on success.
  - [x] Returns `200` with empty array when entries is empty (clears schedule).
  - [x] Returns `400` when `dayOfWeek` is out of range (not 0–6).
  - [x] Returns `400` when time ranges are invalid (end ≤ start, invalid HH:MM format).
  - [x] Returns `404` when the resource does not exist.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when user is not the owner of the establishment.

#### Feature 4.2 — Get Available Slots `[done]`

- **Endpoint:** `GET /establishments/:establishmentCode/services/:serviceCode/availability?date=YYYY-MM-DD`
- **Response (200):** `AvailabilitySlotDTO[]`
  ```json
  [
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "resourceCode": "res123",
      "resourceName": "Alice",
      "price": 5000
    }
  ]
  ```
- **Notes:** Public endpoint. No auth required.
- **How it works:**
  1. Looks up the service and its service offerings (resource assignments).
  2. For each assigned resource, loads its schedules for the given day of week.
  3. Generates slots at `slotInterval` granularity with `duration` length.
  4. Slots that would exceed the schedule window are excluded.
  - Slot `price` comes from the ServiceOffering, not the Service.
- **Acceptance criteria:**
  - [x] Returns a list of available time slots for the given service and date.
  - [x] Slots are derived from resource schedules (no existing booking overlap check yet — that happens at booking creation).
  - [x] Slot duration matches the service offering's `durationMinutes`.
  - [x] Slot interval matches the service offering's `slotIntervalMinutes`.
  - [x] Returns an empty list when no resources are assigned to the service.
  - [x] Returns an empty list when no schedules match the day of week.
  - [x] Returns `400` when `date` is missing.
  - [x] Returns `400` when `date` format is not YYYY-MM-DD.
  - [x] Returns `400` when `date` is in the past.
  - [x] Returns `404` when the service does not exist.
  - [x] Each slot includes `startTime`, `endTime`, `resourceCode`, `resourceName`, and `price`.
  - [x] Only resources linked to the service via ServiceOfferings are considered.

---

### Epic 5: Booking

> Customers reserve a service at a specific time.

#### Feature 5.1 — Create a Booking `[done]`

- **Endpoint:** `POST /bookings`
- **Headers:** `Authorization: Bearer <jwt>`
- **Request body:**
  ```json
  {
    "serviceCode": "svc123",
    "resourceCode": "res123",
    "establishmentCode": "est123",
    "startsAt": "2026-06-15T09:00:00Z"
  }
  ```
- **Response (201):** `BookingDTO`
  ```json
  {
    "id": "bkg123",
    "customerCode": "usr123",
    "customerName": "Alice",
    "serviceCode": "svc123",
    "serviceName": "Haircut",
    "resourceCode": "res123",
    "resourceName": "Bob",
    "establishmentCode": "est123",
    "startsAt": "2026-06-15T09:00:00Z",
    "endsAt": "2026-06-15T10:00:00Z",
    "status": "confirmed",
    "servicePrice": 5000,
    "serviceDuration": 60
  }
  ```
- **Notes:**
  - `startsAt` must be a future ISO 8601 datetime.
  - `endsAt` is computed as `startsAt + offering.durationMinutes`.
  - Overlap detection checks existing confirmed bookings for the resource.
  - Booking `status` starts as `confirmed`.
- **Acceptance criteria:**
  - [x] Requires `serviceCode`, `resourceCode`, `establishmentCode`, and `startsAt` (ISO 8601 datetime).
  - [x] `startsAt` must be in the future.
  - [x] The selected resource must be linked to the service via a ServiceOffering.
  - [x] Returns `201` with the booking DTO.
  - [x] Returns `400` on missing or invalid fields.
  - [x] Returns `404` when service or resource does not exist.
  - [x] Returns `404` when resource is not assigned to the service.
  - [x] Returns `409` when the resource is already booked for the overlapping time.
  - [x] Returns `401` when no auth token provided.

#### Feature 5.2 — Get a Booking `[done]`

- **Endpoint:** `GET /bookings/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response (200):** `BookingDTO`
- **Acceptance criteria:**
  - [x] Returns the booking details.
  - [x] Returns `404` when not found.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when the booking belongs to another user.

#### Feature 5.3 — List Bookings `[done]`

- **Endpoint:** `GET /bookings`
- **Headers:** `Authorization: Bearer <jwt>`
- **Query params:** `?establishmentCode=est123` (optional)
- **Response (200):** `BookingDTO[]`
- **Notes:**
  - If `establishmentCode` is provided and user owns the establishment, returns establishment bookings.
  - Otherwise returns the current user's own bookings (as customer).
- **Acceptance criteria:**
  - [x] Supports optional filtering by `establishmentCode`.
  - [x] Returns bookings ordered by `startsAt` ascending.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns only the current user's bookings (customers) or establishment bookings (owners).
  - [x] Returns empty array when no bookings match.

#### Feature 5.4 — Cancel a Booking `[done]`

- **Endpoint:** `DELETE /bookings/:code`
- **Headers:** `Authorization: Bearer <jwt>`
- **Response (200):** `BookingDTO` (with `status: "cancelled"`)
- **Notes:**
  - Sets booking status to `cancelled`.
  - Only the booking owner can cancel.
  - Cannot cancel a past booking.
  - Cannot cancel an already-cancelled booking.
- **Acceptance criteria:**
  - [x] Sets booking status to `cancelled`.
  - [x] Returns `200` with the cancelled booking DTO.
  - [x] Returns `404` when not found.
  - [x] Returns `400` when the booking is already cancelled.
  - [x] Returns `400` when the booking is in the past.
  - [x] Returns `401` when no auth token provided.
  - [x] Returns `403` when the booking belongs to another user.

---

## DTO Schemas

Reference for all DTOs used across the API.

### AuthDTO
```typescript
interface AuthDTO {
  token: string;
  user: UserDTO;
}
```

### UserDTO
```typescript
interface UserDTO {
  id: string;        // user.code (nanoid)
  email: string;
  name: string;
}
```

### EstablishmentDTO
```typescript
interface EstablishmentDTO {
  id: string;        // establishment.code (nanoid)
  name: string;
}
```

### ServiceDTO
```typescript
interface ServiceDTO {
  id: string;              // service.code (nanoid)
  name: string;
  description: string;
  duration: number;        // minutes
  establishmentCode: string;
}
```

### ResourceDTO
```typescript
interface ResourceDTO {
  id: string;              // resource.code (nanoid)
  name: string;
  establishmentCode: string;
}
```

### ServiceOfferingDTO
```typescript
interface ServiceOfferingDTO {
  id: string;                    // offering.code (nanoid)
  serviceCode: string;
  resourceCode: string;
  resourceName: string;
  maxCapacity: number;
  durationMinutes: number;
  slotIntervalMinutes: number;
  price: number;                 // cents
}
```

### ScheduleDTO
```typescript
interface ScheduleDTO {
  id: string;              // schedule.code (nanoid)
  resourceId: string;      // internal UUID
  dayOfWeek: number;       // 0=Sunday, 6=Saturday
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
}
```

### AvailabilitySlotDTO
```typescript
interface AvailabilitySlotDTO {
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  resourceCode: string;
  resourceName: string;
  price: number;           // cents, from the ServiceOffering
}
```

### BookingDTO
```typescript
interface BookingDTO {
  id: string;                    // booking.code (nanoid)
  customerCode: string;
  customerName: string;
  serviceCode: string;
  serviceName: string;
  resourceCode: string;
  resourceName: string;
  establishmentCode: string;
  startsAt: string;              // ISO 8601
  endsAt: string;                // ISO 8601
  status: 'confirmed' | 'cancelled';
  servicePrice: number;          // cents
  serviceDuration: number;       // minutes
}
```

---

## Post-MVP Ideas

These are out of scope for the MVP but can be prioritized in future iterations.

- **Customer profiles** — Dedicated customer entity with booking history.
- **Notifications** — Email/SMS reminders for upcoming bookings.
- **Recurring schedules** — Block recurring time off for resources.
- **Multi-resource services** — Services that require more than one resource simultaneously (e.g., room + employee).
- **Waitlist** — Customers can join a waitlist when no slots are available.
- **Ratings & Reviews** — Customers rate completed bookings.
- **Full text search** — Search establishments and services by name/description.
- **Admin panel** — Dashboard for establishment owners to manage everything.
- **Multi-owner establishments** — Multiple users can manage the same establishment.
- **Booking confirmation email** — Send confirmation after booking is created.

---

## Feature Status Legend

| Status | Meaning |
|---|---|
| `[done]` | Implemented and tested |
| `[in-progress]` | Currently being built |
| `[planned]` | Scoped for MVP, not yet started |
| `[post-mvp]` | Intentionally deferred |