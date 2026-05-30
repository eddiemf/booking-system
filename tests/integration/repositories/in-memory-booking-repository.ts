import type { Booking, BookingRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';

export class InMemoryBookingRepository implements BookingRepository {
  private bookings = new Map<string, Booking>();
  private _lastError?: StorageError;

  setError(error: StorageError) {
    this._lastError = error;
  }

  clearError() {
    this._lastError = undefined;
  }

  clear() {
    this.bookings.clear();
    this._lastError = undefined;
  }

  async save(booking: Booking): PromiseResult<void, StorageError> {
    if (this._lastError) return fail(this._lastError);
    this.bookings.set(booking.code, booking);
    return ok(undefined);
  }

  async findByCode(code: string): PromiseResult<Booking | null, StorageError> {
    if (this._lastError) return fail(this._lastError);
    const booking = this.bookings.get(code);
    return ok(booking ?? null);
  }

  async getByCustomer(customerId: string): PromiseResult<Booking[], StorageError> {
    if (this._lastError) return fail(this._lastError);
    const result = [...this.bookings.values()].filter((b) => b.customerId === customerId);
    return ok(result.sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
  }

  async getByEstablishment(establishmentCode: string): PromiseResult<Booking[], StorageError> {
    if (this._lastError) return fail(this._lastError);
    const result = [...this.bookings.values()].filter(
      (b) => b.establishmentCode === establishmentCode
    );
    return ok(result.sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
  }

  async getByResourcesAndDate(
    resourceIds: string[],
    date: string
  ): PromiseResult<Booking[], StorageError> {
    if (this._lastError) return fail(this._lastError);
    if (resourceIds.length === 0) return ok([]);

    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const result = [...this.bookings.values()].filter(
      (b) =>
        b.status === 'confirmed' &&
        resourceIds.includes(b.resourceId) &&
        b.startsAt < endOfDay &&
        b.endsAt > startOfDay
    );

    return ok(result);
  }

  async getOverlapping(
    resourceId: string,
    startsAt: string,
    endsAt: string
  ): PromiseResult<Booking[], StorageError> {
    if (this._lastError) return fail(this._lastError);
    const result = [...this.bookings.values()].filter(
      (b) =>
        b.resourceId === resourceId &&
        b.status === 'confirmed' &&
        b.startsAt < endsAt &&
        b.endsAt > startsAt
    );
    return ok(result);
  }

  async update(booking: Booking): PromiseResult<void, StorageError> {
    if (this._lastError) return fail(this._lastError);
    this.bookings.set(booking.code, booking);
    return ok(undefined);
  }
}
