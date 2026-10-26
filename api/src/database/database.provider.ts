import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sql from 'mssql';

@Injectable()
export class DatabaseProvider implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseProvider.name);
  private pool!: sql.ConnectionPool;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const server = this.config.getOrThrow<string>('DB_SERVER');
    const port = Number(this.config.get<string>('DB_PORT') ?? 1433);
    const user = this.config.getOrThrow<string>('DB_USER');
    const password = this.config.getOrThrow<string>('DB_PASSWORD');
    const database = this.config.getOrThrow<string>('DB_DATABASE');
    const encrypt = this.config.get<string>('DB_ENCRYPT') === 'true';
    const trustServerCertificate =
      this.config.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true';

    try {
      this.pool = await new sql.ConnectionPool({
        server,
        port,
        user,
        password,
        database,
        options: {
          encrypt,
          trustServerCertificate,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      }).connect();

      this.logger.log(
        `Connected to SQL Server database "${database}" on ${server}:${port}`,
      );
    } catch (error) {
      this.logger.error('Failed to connect to SQL Server database', error);
      throw error;
    }
  }

  get connection(): sql.ConnectionPool {
    if (!this.pool?.connected) {
      throw new Error('La connexion SQL Server n’est pas prête.');
    }

    return this.pool;
  }

  /**
   * Runs `work` inside a single transaction: commit on success, rollback on any error.
   * The original error is always rethrown, even if the rollback itself fails
   * (SQL Server may already have aborted the transaction, e.g. after a deadlock).
   */
  async withTransaction<T>(
    work: (transaction: sql.Transaction) => Promise<T>,
    isolationLevel: number = sql.ISOLATION_LEVEL.READ_COMMITTED,
  ): Promise<T> {
    const transaction = new sql.Transaction(this.connection);
    await transaction.begin(isolationLevel);

    try {
      const result = await work(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        this.logger.warn(`Rollback failed: ${(rollbackError as Error).message}`);
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool?.connected) {
      await this.pool.close();
      this.logger.log('SQL Server connection closed');
    }
  }
}
