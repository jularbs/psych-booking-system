export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtAccessTtl: Number(process.env.JWT_ACCESS_TTL ?? 3600),
  jwtRefreshTtl: Number(process.env.JWT_REFRESH_TTL ?? 604800),
});
