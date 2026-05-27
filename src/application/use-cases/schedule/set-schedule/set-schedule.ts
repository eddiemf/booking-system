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
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishmentResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const findResult = await this.resourceRepository.findByCode(resourceCode);
    if (!findResult.isOk) return findResult;
    if (!findResult.data) return fail(new NotFoundError('Resource', resourceCode));
    if (findResult.data.establishmentCode !== establishmentCode)
      return fail(new NotFoundError('Resource', resourceCode));

    const resource = findResult.data;
    const scheduleResult = resource.setSchedule(entries);
    if (!scheduleResult.isOk) return scheduleResult;

    const replaceResult = await this.scheduleRepository.replaceAll(resource.id, resource.schedules);
    if (!replaceResult.isOk) return replaceResult;

    return ok(replaceResult.data.map(ScheduleMapper.toDTO));
  }
}
