import type { ResourceRepository, ScheduleRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError, type ValidationError } from '@app/domain/errors';
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
}

type SetScheduleError = ValidationError | StorageError | NotFoundError;

export class SetSchedule {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly scheduleRepository: ScheduleRepository
  ) {}

  async execute({
    resourceCode,
    establishmentCode,
    entries,
  }: Input): PromiseResult<ScheduleDTO[], SetScheduleError> {
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
