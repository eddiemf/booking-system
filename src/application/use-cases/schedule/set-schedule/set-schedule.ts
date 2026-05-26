import {
  type ResourceRepository,
  ScheduleEntity,
  type ScheduleRepository,
} from '@app/domain/entities';
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
  entries: EntryInput[];
}

type SetScheduleError = ValidationError | StorageError | NotFoundError;

export class SetSchedule {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly scheduleRepository: ScheduleRepository
  ) {}

  async execute({ resourceCode, entries }: Input): PromiseResult<ScheduleDTO[], SetScheduleError> {
    const findResult = await this.resourceRepository.findByCode(resourceCode);
    if (!findResult.isOk) return findResult;
    if (!findResult.data) return fail(new NotFoundError('Resource', resourceCode));

    const resource = findResult.data;
    const fullSchedule: ScheduleEntity[] = [];
    for (const entry of entries) {
      const scheduleResult = ScheduleEntity.create({ ...entry, resourceId: resource.id });
      if (!scheduleResult.isOk) return scheduleResult;

      fullSchedule.push(scheduleResult.data);
    }

    const replaceResult = await this.scheduleRepository.replaceAll(resource.id, fullSchedule);
    if (!replaceResult.isOk) return replaceResult;

    return ok(replaceResult.data.map(ScheduleMapper.toDTO));
  }
}
