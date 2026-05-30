# Bookler — Integration Test Roadmap

## Overview

Integration tests run against an Express server with **in-memory repositories** and **mocked OAuth adapters**. No database. No external API calls. Fast, deterministic, complete end-to-end coverage.

- **Test framework:** Vitest + Supertest
- **Test location:** `tests/integration/`
- **Run with:** `npx vitest --project integration`
- **Command for all tests:** `npx vitest run --project integration`

## Architecture

```
supertest → Express (real) → Controllers (real) → Use Cases (real) → In-Memory Repos (fake)
                                                                    → Mock Auth Adapters (fake)
                                                                    → Real JWT (test secret)
```

## Legend

| Status | Meaning |
|--------|---------|
| `[ ]` | Not implemented |
| `[x]` | Passing |
| `[!]` | Failing (expected bug) |

---

## Feature: Authentication (auth.feature.ts)

### Google Login

- [ ] `POST /auth/google` — returns 200 + JWT + user DTO for valid token (new user)
- [ ] `POST /auth/google` — returns 200 + JWT for existing user (no duplicate)
- [ ] `POST /auth/google` — returns 401 for invalid/expired token
- [ ] `POST /auth/google` — returns 400 when token is missing

### Apple Login

- [ ] `POST /auth/apple` — returns 200 + JWT + user DTO for valid token (new user)
- [ ] `POST /auth/apple` — returns 200 + JWT for existing user (no duplicate)
- [ ] `POST /auth/apple` — returns 401 for invalid/expired token
- [ ] `POST /auth/apple` — returns 400 when token is missing

### Get Current User

- [ ] `GET /auth/me` — returns 200 with user DTO for valid JWT
- [ ] `GET /auth/me` — returns 401 without auth header
- [ ] `GET /auth/me` — returns 401 with expired/invalid JWT
- [ ] `GET /auth/me` — returns 404 when user does not exist in DB

### Authorization Layer

- [ ] Mutation endpoint returns 401 without auth token
- [ ] Mutation endpoint returns 401 with expired token
- [ ] Non-owner updating establishment returns 403
- [ ] Non-owner deleting establishment returns 403
- [ ] Non-owner creating resource in another's establishment returns 403
- [ ] Non-owner setting schedule on another's resource returns 403
- [ ] Public GET endpoints return data without auth
- [ ] All POST/PUT/DELETE routes require auth

---

## Feature: Establishments (establishments.feature.ts)

### Create Establishment

- [ ] `POST /establishments` — returns 201 with DTO for valid name
- [ ] `POST /establishments` — returns 400 when name is missing
- [ ] `POST /establishments` — returns 400 for invalid timezone
- [ ] `POST /establishments` — returns 201 with specified timezone
- [ ] `POST /establishments` — returns 401 without auth token

### List Establishments

- [ ] `GET /establishments` — returns list of all establishments
- [ ] `GET /establishments` — returns empty array when none exist
- [ ] `GET /establishments?limit=10&offset=0` — paginates correctly
- [ ] `GET /establishments?limit=-5` — returns 400
- [ ] `GET /establishments?limit=abc` — returns 400
- [ ] `GET /establishments?offset=-1` — returns 400

### Get Establishment by Code

- [ ] `GET /establishments/:code` — returns 200 with DTO
- [ ] `GET /establishments/:code` — returns 404 when not found
- [ ] `GET /establishments/:code` — public, no auth required

### Update Establishment

- [ ] `PUT /establishments/:code` — updates name, returns 200
- [ ] `PUT /establishments/:code` — updates timezone
- [ ] `PUT /establishments/:code` — returns 400 for empty name
- [ ] `PUT /establishments/:code` — returns 403 when not owner
- [ ] `PUT /establishments/:code` — returns 404 when not found

### Delete Establishment

- [ ] `DELETE /establishments/:code` — returns 204 on success
- [ ] `DELETE /establishments/:code` — returns 403 when not owner
- [ ] `DELETE /establishments/:code` — returns 404 when not found
- [!] `DELETE /establishments/:code` — returns 409 when has associated resources (FK constraint)

---

## Feature: Services (services.feature.ts)

### Create Service

- [ ] `POST /establishments/:estCode/services` — returns 201 with DTO
- [ ] `POST /establishments/:estCode/services` — defaults description to ""
- [ ] `POST /establishments/:estCode/services` — returns 400 for missing name
- [ ] `POST /establishments/:estCode/services` — returns 400 for zero duration
- [ ] `POST /establishments/:estCode/services` — returns 400 for negative duration
- [ ] `POST /establishments/:estCode/services` — returns 404 for non-existent establishment
- [ ] `POST /establishments/:estCode/services` — returns 403 when not owner

### List Services

- [ ] `GET /establishments/:estCode/services` — returns list for establishment
- [ ] `GET /establishments/:estCode/services` — returns empty array when none
- [ ] `GET /establishments/:estCode/services` — only returns services for that establishment
- [!] `GET /establishments/:estCode/services` — returns empty array for non-existent est (bug #4)

### Get Service by Code

- [ ] `GET /establishments/:estCode/services/:code` — returns 200
- [ ] `GET /establishments/:estCode/services/:code` — returns 404 when not found
- [ ] `GET /establishments/:estCode/services/:code` — returns 404 for wrong establishment

### Update Service

- [ ] `PUT /establishments/:estCode/services/:code` — updates name, desc, duration
- [ ] `PUT /establishments/:estCode/services/:code` — returns 400 for empty name
- [ ] `PUT /establishments/:estCode/services/:code` — returns 400 for zero duration
- [ ] `PUT /establishments/:estCode/services/:code` — returns 404 when not found
- [ ] `PUT /establishments/:estCode/services/:code` — returns 403 when not owner
- [!] `PUT /establishments/:estCode/services/:code` — description persisted after update (bug #2)

### Delete Service

- [ ] `DELETE /establishments/:estCode/services/:code` — returns 204
- [ ] `DELETE /establishments/:estCode/services/:code` — returns 404 when not found
- [ ] `DELETE /establishments/:estCode/services/:code` — returns 403 when not owner
- [!] `DELETE /establishments/:estCode/services/:code` — returns 409 when has future bookings

### Create Service Offering

- [ ] `POST .../service-offerings` — returns 201 with DTO (all fields)
- [ ] `POST .../service-offerings` — returns 201 with defaults (maxCapacity=1, price=0)
- [ ] `POST .../service-offerings` — returns 404 for non-existent service
- [ ] `POST .../service-offerings` — returns 404 for non-existent resource
- [ ] `POST .../service-offerings` — returns 409 when already assigned
- [ ] `POST .../service-offerings` — returns 404 for resource in another establishment
- [ ] `POST .../service-offerings` — returns 400 for non-positive duration
- [ ] `POST .../service-offerings` — returns 403 when not owner

### Delete Service Offering

- [ ] `DELETE .../service-offerings/:resCode` — returns 204
- [ ] `DELETE .../service-offerings/:resCode` — returns 404 when not found
- [ ] `DELETE .../service-offerings/:resCode` — returns 403 when not owner

---

## Feature: Resources (resources.feature.ts)

### Create Resource

- [ ] `POST /establishments/:estCode/resources` — returns 201 with DTO
- [ ] `POST /establishments/:estCode/resources` — returns 400 for missing name
- [ ] `POST /establishments/:estCode/resources` — returns 404 for non-existent est
- [ ] `POST /establishments/:estCode/resources` — returns 403 when not owner

### List Resources

- [ ] `GET /establishments/:estCode/resources` — returns list
- [ ] `GET /establishments/:estCode/resources` — returns empty array

### Update Resource

- [ ] `PUT /establishments/:estCode/resources/:code` — updates name
- [ ] `PUT /establishments/:estCode/resources/:code` — returns 400 for empty name
- [ ] `PUT /establishments/:estCode/resources/:code` — returns 404 when not found
- [ ] `PUT /establishments/:estCode/resources/:code` — returns 404 for wrong est
- [ ] `PUT /establishments/:estCode/resources/:code` — returns 403 when not owner
- [!] `PUT /establishments/:estCode/resources/:code` — schedules preserved after update (bug #3)

### Delete Resource

- [ ] `DELETE /establishments/:estCode/resources/:code` — returns 204
- [ ] `DELETE /establishments/:estCode/resources/:code` — returns 404 when not found
- [ ] `DELETE /establishments/:estCode/resources/:code` — returns 404 for wrong est
- [ ] `DELETE /establishments/:estCode/resources/:code` — returns 403 when not owner
- [!] `DELETE /establishments/:estCode/resources/:code` — returns 409 when has future bookings

---

## Feature: Schedules (schedules.feature.ts)

### Set Schedule for a Resource

- [ ] `PUT .../resources/:resCode/schedule` — sets schedule with valid entry
- [ ] `PUT .../resources/:resCode/schedule` — multiple entries for different days
- [ ] `PUT .../resources/:resCode/schedule` — multiple windows on same day
- [ ] `PUT .../resources/:resCode/schedule` — clears schedule with empty array
- [ ] `PUT .../resources/:resCode/schedule` — replaces existing schedule entirely
- [ ] `PUT .../resources/:resCode/schedule` — returns 400 for invalid dayOfWeek
- [ ] `PUT .../resources/:resCode/schedule` — returns 400 for invalid time format
- [ ] `PUT .../resources/:resCode/schedule` — returns 400 when end equals start
- [ ] `PUT .../resources/:resCode/schedule` — returns 400 when end before start
- [ ] `PUT .../resources/:resCode/schedule` — returns 404 for non-existent resource
- [ ] `PUT .../resources/:resCode/schedule` — returns 403 when not owner

---

## Feature: Availability (availability.feature.ts)

### Get Available Slots

- [ ] `GET .../availability?date=YYYY-MM-DD` — returns slots from schedule
- [ ] `GET .../availability?date=YYYY-MM-DD` — empty when no resources assigned
- [ ] `GET .../availability?date=YYYY-MM-DD` — empty when no schedule matches day
- [ ] `GET .../availability?date=YYYY-MM-DD` — uses slotInterval != duration
- [ ] `GET .../availability?date=YYYY-MM-DD` — excludes slots exceeding window
- [ ] `GET .../availability?date=YYYY-MM-DD` — returns slots from multiple resources
- [ ] `GET .../availability` — returns 400 when date missing
- [ ] `GET .../availability?date=not-a-date` — returns 400
- [ ] `GET .../availability?date=2020-01-01` — returns 400 for past date
- [!] `GET .../availability?date=YYYY-MM-DD` — excludes slots overlapping confirmed bookings (bug #1)

---

## Feature: Bookings (bookings.feature.ts)

### Create Booking

- [ ] `POST /bookings` — returns 201 with DTO for valid data
- [ ] `POST /bookings` — returns 404 for non-existent service
- [ ] `POST /bookings` — returns 404 for non-existent resource
- [ ] `POST /bookings` — returns 404 for resource not assigned to service
- [ ] `POST /bookings` — returns 404 for resource in another establishment
- [ ] `POST /bookings` — returns 409 when resource already booked (same time)
- [ ] `POST /bookings` — returns 409 when resource booked (overlapping time)
- [ ] `POST /bookings` — returns 201 when owner books their own establishment

### Get Booking

- [ ] `GET /bookings/:code` — returns 200 with DTO
- [ ] `GET /bookings/:code` — returns 403 when not owner
- [ ] `GET /bookings/:code` — returns 404 when not found

### List Bookings

- [ ] `GET /bookings` — returns own bookings as customer
- [ ] `GET /bookings?establishmentCode=est123` — returns establishment bookings as owner
- [ ] `GET /bookings?establishmentCode=est123` — returns own bookings as non-owner customer
- [ ] `GET /bookings` — returns empty array when none
- [ ] `GET /bookings?establishmentCode=nonexistent` — returns empty array

### Cancel Booking

- [ ] `DELETE /bookings/:code` — cancels future booking, returns 200
- [ ] `DELETE /bookings/:code` — returns 403 when not owner
- [ ] `DELETE /bookings/:code` — returns 400 when already cancelled
- [ ] `DELETE /bookings/:code` — returns 400 when in the past
- [ ] `DELETE /bookings/:code` — returns 404 when not found

---

## Bug Markers

| # | Bug | Marker | Test File |
|---|-----|--------|-----------|
| 1 | Availability shows booked slots | `[!]` | availability.feature.ts |
| 2 | Service description not persisted on update | `[!]` | services.feature.ts |
| 3 | Resource update returns entity with empty schedules | `[!]` | resources.feature.ts |
| 4 | ListServices doesn't 404 on missing establishment | `[!]` | services.feature.ts |
| 5 | SetSchedule doesn't validate overlapping entries | Not in scope yet | schedules.feature.ts |

---

## Progress Summary

| Feature | Total | Passing | Failing (Bug) | Not Implemented |
|---------|-------|---------|---------------|-----------------|
| Auth | 16 | 0 | 0 | 16 |
| Establishments | 17 | 0 | 1 | 16 |
| Services | 20 | 0 | 3 | 17 |
| Resources | 13 | 0 | 1 | 12 |
| Schedules | 11 | 0 | 0 | 11 |
| Availability | 10 | 0 | 1 | 9 |
| Bookings | 15 | 0 | 0 | 15 |
| **Total** | **102** | **0** | **6** | **96** |