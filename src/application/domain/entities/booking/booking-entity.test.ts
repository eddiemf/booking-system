import { ValidationError } from '@app/domain/errors';
import { describe, expect, it } from 'vitest';
import { BookingEntity } from './booking-entity';

const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const futureStartsAt = new Date(Date.now() + 86400000).toISOString(); // tomorrow
const futureEndsAt = new Date(Date.now() + 90000000).toISOString(); // tomorrow + 1h

const validProps = {
  customerId: 'uuid-customer',
  customerCode: 'usr123',
  customerName: 'Alice',
  establishmentId: 'uuid-est',
  establishmentCode: 'est123',
  serviceId: 'uuid-svc',
  serviceCode: 'svc123',
  serviceName: 'Haircut',
  resourceId: 'uuid-res',
  resourceCode: 'res123',
  resourceName: 'Bob',
  startsAt: futureStartsAt,
  endsAt: futureEndsAt,
  servicePrice: 0,
  serviceDuration: 60,
};

describe('BookingEntity', () => {
  describe('create()', () => {
    it('fails with invalid startsAt format', () => {
      const error = BookingEntity.create({ ...validProps, startsAt: 'not-a-date' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startsAt');
    });

    it('fails with invalid endsAt format', () => {
      const error = BookingEntity.create({ ...validProps, endsAt: 'bad' }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endsAt');
    });

    it('fails when endsAt is before startsAt', () => {
      const error = BookingEntity.create({
        ...validProps,
        startsAt: futureEndsAt,
        endsAt: futureStartsAt,
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endsAt');
    });

    it('fails when endsAt equals startsAt', () => {
      const error = BookingEntity.create({
        ...validProps,
        startsAt: futureStartsAt,
        endsAt: futureStartsAt,
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('endsAt');
    });

    it('fails when startsAt is in the past', () => {
      const error = BookingEntity.create({
        ...validProps,
        startsAt: new Date('2020-01-01').toISOString(),
        endsAt: new Date('2020-01-01T01:00:00Z').toISOString(),
      }).getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('startsAt');
    });

    it('creates a valid booking', () => {
      const booking = BookingEntity.create(validProps).getData();

      expect(booking).toBeInstanceOf(BookingEntity);
      expect(booking.customerCode).toBe('usr123');
      expect(booking.serviceCode).toBe('svc123');
      expect(booking.resourceCode).toBe('res123');
      expect(booking.establishmentCode).toBe('est123');
      expect(booking.status).toBe('confirmed');
    });

    it('generates a UUIDv7 id', () => {
      const booking = BookingEntity.create(validProps).getData();

      expect(booking.id).toMatch(UUID_V7_REGEX);
    });

    it('generates a code', () => {
      const booking = BookingEntity.create(validProps).getData();

      expect(booking.code).toBeDefined();
      expect(booking.code.length).toBe(10);
    });
  });

  describe('cancel()', () => {
    it('fails when booking is already cancelled', () => {
      const booking = BookingEntity.reconstruct({
        id: 'uuid-1',
        code: 'bkg1',
        ...validProps,
        status: 'cancelled',
      });

      const error = booking.cancel().getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('already cancelled');
    });

    it('fails when booking is in the past', () => {
      const booking = BookingEntity.reconstruct({
        id: 'uuid-1',
        code: 'bkg1',
        ...validProps,
        startsAt: new Date('2020-01-01').toISOString(),
        endsAt: new Date('2020-01-01T01:00:00Z').toISOString(),
        status: 'confirmed',
      });

      const error = booking.cancel().getError();

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('past');
    });

    it('sets status to cancelled', () => {
      const booking = BookingEntity.create(validProps).getData();

      const cancelled = booking.cancel().getData();

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.code).toBe(booking.code);
    });
  });

  describe('reconstruct()', () => {
    it('restores all properties from the given data', () => {
      const booking = BookingEntity.reconstruct({
        id: 'uuid-1',
        code: 'bkg1',
        ...validProps,
        status: 'confirmed',
      });

      expect(booking.id).toBe('uuid-1');
      expect(booking.code).toBe('bkg1');
      expect(booking.customerCode).toBe('usr123');
      expect(booking.status).toBe('confirmed');
    });

    it('reconstructs with cancelled status', () => {
      const booking = BookingEntity.reconstruct({
        id: 'uuid-1',
        code: 'bkg1',
        ...validProps,
        status: 'cancelled',
        servicePrice: 0,
        serviceDuration: 60,
      });

      expect(booking.status).toBe('cancelled');
    });
  });
});
