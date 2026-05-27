import sql from 'mssql';

export interface DbClient {
  executeQuery<T = Record<string, unknown>>(
    queryFn: (request: sql.Request) => Promise<sql.IResult<T>>,
  ): Promise<sql.IResult<T>>;
}

let pool: sql.ConnectionPool | null = null;

export async function createDbClient(): Promise<DbClient> {
  if (!pool) {
    pool = await new sql.ConnectionPool({
      server: process.env['DB_SERVER']!,
      database: process.env['DB_DATABASE']!,
      user: process.env['DB_USER']!,
      password: process.env['DB_PASSWORD']!,
      port: parseInt(process.env['DB_PORT'] ?? '1433', 10),
      options: {
        encrypt: true,
        trustServerCertificate: process.env['NODE_ENV'] !== 'production',
      },
      pool: { min: 2, max: 10 },
    }).connect();
  }

  return {
    async executeQuery<T = Record<string, unknown>>(
      queryFn: (request: sql.Request) => Promise<sql.IResult<T>>,
    ) {
      const request = pool!.request();
      return queryFn(request);
    },
  };
}
