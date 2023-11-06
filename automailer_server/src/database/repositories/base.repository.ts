import { ClassConstructor, plainToInstance } from 'class-transformer';
import {
  Model,
  Types,
  ProjectionType,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
} from 'mongoose';
import { GenericException } from 'src/shared/exceptions/generic.exception';

type EnforcementEmpty = unknown;

export class BaseRepository<
  T_DBModel,
  T_MappedEntity,
  T_Enforcement = EnforcementEmpty,
> {
  constructor(
    public Model: Model<T_DBModel>,
    protected entity: ClassConstructor<T_MappedEntity>,
  ) {}

  public static createObjectId() {
    return new Types.ObjectId().toString();
  }

  protected convertObjectIdToString(value: Types.ObjectId): string {
    return value.toString();
  }

  protected convertStringToObjectId(value: string): Types.ObjectId {
    return new Types.ObjectId(value);
  }

  async count(
    query: FilterQuery<T_DBModel> & T_Enforcement,
    limit?: number,
  ): Promise<number> {
    return this.Model.countDocuments(query, {
      limit,
    });
  }

  async aggregate(
    query: any[],
    options: { readPreference?: 'secondaryPreferred' | 'primary' } = {},
  ): Promise<any> {
    return await this.Model.aggregate(query).read(
      options.readPreference || 'primary',
    );
  }

  async findOne(
    query: FilterQuery<T_DBModel> & T_Enforcement,
    select?: ProjectionType<T_MappedEntity>,
    options: {
      readPreference?: 'secondaryPreferred' | 'primary';
      query?: QueryOptions<T_DBModel>;
    } = {},
  ): Promise<T_MappedEntity | null> {
    const data = await this.Model.findOne(query, select, options.query).read(
      options.readPreference || 'primary',
    );
    if (!data) return null;

    return this.mapEntity(data.toObject());
  }

  async delete(query: FilterQuery<T_DBModel> & T_Enforcement): Promise<{
    /** Indicates whether this writes result was acknowledged. If not, then all other members of this result will be undefined. */
    acknowledged: boolean;
    /** The number of documents that were deleted */
    deletedCount: number;
  }> {
    return await this.Model.deleteMany(query);
  }

  async find(
    query: FilterQuery<T_DBModel> & T_Enforcement,
    select: ProjectionType<T_MappedEntity> = '',
    options: { limit?: number; sort?: any; skip?: number } = {},
  ): Promise<T_MappedEntity[]> {
    const data = await this.Model.find(query, select, {
      sort: options.sort || null,
    })
      .skip(options.skip as number)
      .limit(options.limit as number)
      .lean()
      .exec();

    return this.mapEntities(data);
  }

  async *findBatch(
    query: FilterQuery<T_DBModel> & T_Enforcement,
    select = '',
    options: { limit?: number; sort?: any; skip?: number } = {},
    batchSize = 500,
  ) {
    for await (const doc of this.Model.find(query, select, {
      sort: options.sort || null,
    })
      .batchSize(batchSize)
      .cursor()) {
      yield this.mapEntity(doc);
    }
  }

  async create(
    data: FilterQuery<T_DBModel> & T_Enforcement,
    options: IOptions = {},
  ): Promise<T_MappedEntity> {
    const newEntity = new this.Model(data);

    const saveOptions = options?.writeConcern
      ? { w: options?.writeConcern }
      : {};

    const saved = await newEntity.save(saveOptions);

    return this.mapEntity(saved);
  }

  async insertMany(
    data: FilterQuery<T_DBModel> & T_Enforcement[],
    ordered = false,
  ): Promise<{
    acknowledged: boolean;
    insertedCount: number;
    insertedIds: Types.ObjectId[];
  }> {
    let result;
    try {
      result = await this.Model.insertMany(data, { ordered });
    } catch (e) {
      throw new GenericException(e.message);
    }

    const insertedIds = result.map((inserted) => inserted._id);

    return {
      acknowledged: true,
      insertedCount: result.length,
      insertedIds,
    };
  }

  async update(
    query: FilterQuery<T_DBModel> & T_Enforcement,
    updateBody: UpdateQuery<T_DBModel>,
  ): Promise<{
    matched: number;
    modified: number;
  }> {
    const saved = await this.Model.updateMany(query, updateBody, {
      multi: true,
    });

    return {
      matched: saved.matchedCount,
      modified: saved.modifiedCount,
    };
  }

  async upsert(
    query: FilterQuery<T_DBModel> & T_Enforcement,
    data: UpdateQuery<T_DBModel>,
  ) {
    const saved = await this.Model.findOneAndUpdate(query, data, {
      upsert: true,
      new: true,
    });

    return this.mapEntity(saved);
  }

  async findOneAndUpdate(
    query: FilterQuery<T_DBModel> & T_Enforcement,
    updateBody: UpdateQuery<T_DBModel>,
    options?: QueryOptions<T_DBModel>,
  ) {
    const saved = await this.Model.findOneAndUpdate(query, updateBody, {
      new: true,
      ...options,
    });

    return saved;
  }

  async upsertMany(data: (FilterQuery<T_DBModel> & T_Enforcement)[]) {
    const promises = data.map((entry) =>
      this.Model.findOneAndUpdate(entry, entry, { upsert: true }),
    );

    return await Promise.all(promises);
  }

  async bulkWrite(bulkOperations: any, ordered = false): Promise<any> {
    return await this.Model.bulkWrite(bulkOperations, { ordered });
  }

  public mapEntity<TData>(
    data: TData,
  ): TData extends null ? null : T_MappedEntity {
    return plainToInstance(
      this.entity,
      JSON.parse(JSON.stringify(data)),
    ) as any;
  }

  public mapEntities(data: any): T_MappedEntity[] {
    return plainToInstance<T_MappedEntity, T_MappedEntity[]>(
      this.entity,
      JSON.parse(JSON.stringify(data)),
    );
  }
}

interface IOptions {
  writeConcern?: number | 'majority';
}
