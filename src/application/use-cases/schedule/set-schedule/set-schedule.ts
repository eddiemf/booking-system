import type {
  EstablishmentRepository,
  ResourceRepository,
  ScheduleRepository,
} from '@app/domain/entities';
import {
  ForbiddenError,
  NotFoundError,
  type StorageError,
  type ValidationError,
} from '@app/domain/errors';
import type { ScheduleDTO } from '@app/dtos';
import { ScheduleMapper } from '@app/mappers';
import { fail, ok, type PromiseResult } from '@shared/result';

interface EntryInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Input {
  resourceCode: string;
  establishmentCode: string;
  entries: EntryInput[];
  userId: string;
}

type SetScheduleError = ValidationError | StorageError | NotFoundError | ForbiddenError;

export class SetSchedule {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    resourceCode,
    establishmentCode,
    entries,
    userId,
  }: Input): PromiseResult<ScheduleDTO[], SetScheduleError> {
    const [establishmentResult, resourceResult] = await Promise.all([
      this.establishmentRepository.findByCode(establishmentCode),
      this.resourceRepository.findByCode(resourceCode),
    ]);

    if (!establishmentResult.isOk) return establishmentResult;
    if (!resourceResult.isOk) return resourceResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', resourceCode));
    if (resource.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', resourceCode));

    const scheduleResult = resource.setSchedule(entries);
    if (!scheduleResult.isOk) return scheduleResult;

    const replaceResult = await this.scheduleRepository.replaceAll(resource.id, resource.schedules);
    if (!replaceResult.isOk) return replaceResult;

    const schedules = replaceResult.data;

    return ok(schedules.map(ScheduleMapper.toDTO));
  }
}
