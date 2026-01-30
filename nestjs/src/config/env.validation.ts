export interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  SWAGGER_PATH: string;
  SWAGGER_TITLE: string;
  SWAGGER_DESCRIPTION: string;
  SWAGGER_VERSION: string;
}

const required = ['MONGODB_URI', 'JWT_SECRET'] as const;

/**
 * Validates env vars at startup. Throws if required vars are missing.
 * Use ConfigService.get('KEY') after bootstrap.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const missing = required.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(
      `Missing required env: ${missing.join(', ')}. Check your .env file.`,
    );
  }

  return {
    PORT: String(config['PORT'] ?? 3000),
    NODE_ENV: String(config['NODE_ENV'] ?? 'development'),
    MONGODB_URI: String(config['MONGODB_URI']),
    JWT_SECRET: String(config['JWT_SECRET'] ?? ''),
    JWT_ACCESS_EXPIRY: String(config['JWT_ACCESS_EXPIRY'] ?? '15m'),
    JWT_REFRESH_EXPIRY: String(config['JWT_REFRESH_EXPIRY'] ?? '7d'),
    SWAGGER_PATH: String(config['SWAGGER_PATH'] ?? 'docs'),
    SWAGGER_TITLE: String(config['SWAGGER_TITLE'] ?? 'API'),
    SWAGGER_DESCRIPTION: String(config['SWAGGER_DESCRIPTION'] ?? 'API documentation'),
    SWAGGER_VERSION: String(config['SWAGGER_VERSION'] ?? '1.0'),
  };
}
