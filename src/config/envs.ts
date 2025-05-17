import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVERS: string[];
  JWT_SECRET: string;
  JWT_REFRESH_TOKEN: string;
}

const envsSchema = joi
  .object({
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    JWT_SECRET: joi.string().required(),
    JWT_REFRESH_TOKEN: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(';'),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  natsServers: envVars.NATS_SERVERS,
  jwtSecret: envVars.JWT_SECRET,
  jwtRefreshToken: envVars.JWT_REFRESH_TOKEN,
};
