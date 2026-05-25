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
| **Schedule** | Defines the regular working hours for a resource (days of week + time range). |
| **Booking** | A reservation made by a customer for a specific service, resource, and time slot. |
| **Customer** | A user who makes bookings. |

### Relationships

```
User (owner)
  └── Establishment
        ├── Service (offered by establishment)
        │     └── Resource (required to deliver it)
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
| **Entity IDs** | DB-assigned integer, returned as string in APIs | Keeps the ID source of truth in one place. No UUID generation in the domain layer. |
| **Scoping** | Services, Resources, and Schedules belong to an Establishment | All reads and writes must be scoped to an `establishmentId`. |
| **API route nesting** | `GET /establishments/:id/services`, not `GET /services` | Prevents cross-establishment data leakage and aligns with the ownership model. |
| **Domain ↔ DB mapping** | `ServiceEntity.create()` for new (unperisted) entities; `reconstruct()` for DB-sourced ones | Keeps UUIDs and DB IDs from ever getting mixed up. |

---

## Development Sequence

Features must be built in this order because of data dependency: you cannot scope a Service to an Establishment that doesn't exist yet.

```
1. Establishment CRUD (Epic 2)
2. Service CRUD — scoped to establishment (Epic 1, revised)
3. Resource CRUD — scoped to establishment (Epic 3)
4. Schedule / Availability (Epic 4)
5. Booking (Epic 5)
```

> Features 1.1 and 1.2 were bootstrapped without establishment scope as a foundation exercise. They will be refactored to establishment-scoped endpoints after Epic 2 is complete.

---

## MVP Scope

The MVP delivers a functional end-to-end flow: an owner sets up an establishment with services and resources, and a customer can book a service.

---

## Epics & Features

---

### Epic 2: Establishment Management

> Must be built first. All other entities (Services, Resources) are scoped to an Establishment.

#### Feature 2.1 — Create an Establishment `[planned]`

- **Endpoint:** `POST /establishments`
- **Acceptance criteria:**
  - [ ] Requires a `name`.
  - [ ] Returns `201` with the created establishment DTO (`id`, `name`).
  - [ ] Returns `400` when `name` is missing.

#### Feature 2.2 — Get Establishment by ID `[planned]`

- **Endpoint:** `GET /establishments/:id`
- **Acceptance criteria:**
  - [ ] Returns the establishment data.
  - [ ] Returns `404` when not found.

#### Feature 2.3 — Update an Establishment `[planned]`

- **Endpoint:** `PUT /establishments/:id`
- **Acceptance criteria:**
  - [ ] Allows updating `name`.
  - [ ] Returns the updated establishment DTO.
  - [ ] Returns `404` when not found.

#### Feature 2.4 — Delete an Establishment `[planned]`

- **Endpoint:** `DELETE /establishments/:id`
- **Acceptance criteria:**
  - [ ] Returns `204` on success.
  - [ ] Returns `404` when not found.
  - [ ] Returns `409` if the establishment has active services or future bookings.

---

### Epic 1: Service Management

> Services belong to an Establishment. Features 1.1 and 1.2 were bootstrapped globally and must be refactored to establishment-scoped endpoints after Epic 2 is done.

#### Feature 1.1 — Create a Service `[done]` ⚠️ needs establishment scope

- **Current endpoint:** `POST /services` *(temporary — will become `POST /establishments/:id/services`)*
- **Acceptance criteria:**
  - [x] A service requires a `name` and a positive `duration` (in minutes).
  - [x] `description` is optional.
  - [x] Returns `201` with the created service DTO.
  - [x] Returns `400` when `name` is missing or `duration` is ≤ 0.
  - [ ] *(post-Epic 2)* Requires a valid `establishmentId` in the URL.
  - [ ] *(post-Epic 2)* Returns `404` when the establishment does not exist.

#### Feature 1.2 — List Services `[done]` ⚠️ needs establishment scope

- **Current endpoint:** `GET /services` *(temporary — will become `GET /establishments/:id/services`)*
- **Acceptance criteria:**
  - [x] Returns a list of all services.
  - [x] Returns an empty array when no services exist.
  - [x] Each item includes `id`, `name`, `description`, and `duration`.
  - [ ] *(post-Epic 2)* Returns only services belonging to the given establishment.
  - [ ] *(post-Epic 2)* Returns `404` when the establishment does not exist.

#### Feature 1.3 — Get Service by ID `[planned]`

- **Endpoint:** `GET /establishments/:establishmentId/services/:id`
- **Acceptance criteria:**
  - [ ] Returns the service matching the given ID.
  - [ ] Returns `404` when no service with that ID exists in the establishment.

#### Feature 1.4 — Update a Service `[planned]`

- **Endpoint:** `PUT /establishments/:establishmentId/services/:id`
- **Acceptance criteria:**
  - [ ] Allows updating `name`, `description`, and `duration`.
  - [ ] Returns the updated service DTO.
  - [ ] Returns `404` when the service does not exist in the establishment.
  - [ ] Returns `400` on invalid values (same rules as creation).

#### Feature 1.5 — Delete a Service `[planned]`

- **Endpoint:** `DELETE /establishments/:establishmentId/services/:id`
- **Acceptance criteria:**
  - [ ] Removes the service permanently.
  - [ ] Returns `204` on success.
  - [ ] Returns `404` when the service does not exist in the establishment.
  - [ ] Returns `409` if the service has future bookings.

---

### Epic 3: Resource Management

> Establishments define the people and spaces needed to deliver services.

#### Feature 3.1 — Create a Resource `[planned]`

- **Endpoint:** `POST /establishments/:establishmentId/resources`
- **Acceptance criteria:**
  - [ ] A resource requires a `name` and a `type` (`employee` | `room`).
  - [ ] Returns `201` with the created resource DTO.
  - [ ] Returns `400` on missing or invalid fields.
  - [ ] Returns `404` when the establishment does not exist.

#### Feature 3.2 — List Resources for an Establishment `[planned]`

- **Endpoint:** `GET /establishments/:establishmentId/resources`
- **Acceptance criteria:**
  - [ ] Returns all resources for the establishment.
  - [ ] Supports optional filtering by `type`.

#### Feature 3.3 — Update a Resource `[planned]`

- **Endpoint:** `PUT /resources/:id`
- **Acceptance criteria:**
  - [ ] Allows updating `name` and `type`.
  - [ ] Returns the updated resource DTO.
  - [ ] Returns `404` when not found.

#### Feature 3.4 — Delete a Resource `[planned]`

- **Endpoint:** `DELETE /resources/:id`
- **Acceptance criteria:**
  - [ ] Returns `204` on success.
  - [ ] Returns `404` when not found.
  - [ ] Returns `409` if the resource has future bookings.

---

### Epic 4: Schedule / Availability

> Resources publish their regular working hours.

#### Feature 4.1 — Set Schedule for a Resource `[planned]`

- **Endpoint:** `PUT /resources/:resourceId/schedule`
- **Acceptance criteria:**
  - [ ] Accepts an array of schedule entries, each with `dayOfWeek` (0–6), `startTime` (HH:MM), and `endTime` (HH:MM).
  - [ ] Replaces the existing schedule entirely.
  - [ ] Returns `400` when time ranges are invalid (end ≤ start, invalid format).
  - [ ] Returns `404` when the resource does not exist.

#### Feature 4.2 — Get Available Slots `[planned]`

- **Endpoint:** `GET /services/:serviceId/availability?date=YYYY-MM-DD`
- **Acceptance criteria:**
  - [ ] Returns a list of available time slots for the given service and date.
  - [ ] Slots are derived from resource schedules minus existing bookings.
  - [ ] Slot duration matches the service duration.
  - [ ] Returns an empty list when no resources are available.
  - [ ] Returns `400` when `date` is missing or in the past.

---

### Epic 5: Booking

> Customers reserve a service at a specific time.

#### Feature 5.1 — Create a Booking `[planned]`

- **Endpoint:** `POST /bookings`
- **Acceptance criteria:**
  - [ ] Requires `serviceId`, `resourceId`, and `startsAt` (ISO 8601 datetime).
  - [ ] `startsAt` must be in the future.
  - [ ] The selected resource must be available at `startsAt` for the service duration.
  - [ ] Returns `201` with the booking DTO (`id`, `serviceId`, `resourceId`, `startsAt`, `endsAt`, `status`).
  - [ ] Returns `400` on missing or invalid fields.
  - [ ] Returns `409` when the resource is already booked for the overlapping time.

#### Feature 5.2 — Get a Booking `[planned]`

- **Endpoint:** `GET /bookings/:id`
- **Acceptance criteria:**
  - [ ] Returns the booking details.
  - [ ] Returns `404` when not found.

#### Feature 5.3 — List Bookings `[planned]`

- **Endpoint:** `GET /bookings`
- **Acceptance criteria:**
  - [ ] Supports optional filtering by `resourceId`, `serviceId`, `date`.
  - [ ] Returns bookings ordered by `startsAt` ascending.

#### Feature 5.4 — Cancel a Booking `[planned]`

- **Endpoint:** `DELETE /bookings/:id`
- **Acceptance criteria:**
  - [ ] Sets booking status to `cancelled`.
  - [ ] Returns `204` on success.
  - [ ] Returns `404` when not found.
  - [ ] Returns `400` when the booking is already cancelled or in the past.

---

## Post-MVP Ideas

These are out of scope for the MVP but can be prioritized in future iterations.

- **Authentication & Authorization** — JWT-based auth; owners can only manage their own establishments; customers can only manage their own bookings.
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
