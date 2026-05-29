import type { ResourceRepository, ScheduleRepository } from '@app/domain/entities';
import type {
  ForbiddenError,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@app/domain/errors';
import type { ScheduleDTO } from '@app/dtos';
import type { EstablishmentLoader, ResourceLoader } from '@app/loaders';
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
    private readonly establishmentLoader: EstablishmentLoader,
    private readonly resourceLoader: ResourceLoader
  ) {}

  async execute({
    resourceCode,
    establishmentCode,
    entries,
    userId,
  }: Input): PromiseResult<ScheduleDTO[], SetScheduleError> {
    const [establishmentResult, resourceResult] = await Promise.all([
      this.establishmentLoader.loadOwnedByUser(establishmentCode, userId),
      this.resourceLoader.load(resourceCode, establishmentCode),
    ]);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!resourceResult.isOk) return resourceResult;

    const resource = resourceResult.data;
    const scheduleResult = resource.setSchedule(entries);
    if (!scheduleResult.isOk) return scheduleResult;

    const replaceResult = await this.scheduleRepository.replaceAll(resource.id, resource.schedules);
    if (!replaceResult.isOk) return replaceResult;

    return ok(resource.schedules.map(ScheduleMapper.toDTO));
  }
}
