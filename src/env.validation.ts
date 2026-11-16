import Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  PORT: Joi.number().default(10000),
  CORS_ORIGIN: Joi.string().optional(),
  SEED_ADMIN_EMAIL: Joi.string().email().optional(),
  SEED_ADMIN_PASSWORD: Joi.string().min(6).optional(),
  SEED_CLIENT_EMAIL: Joi.string().email().optional(),
  SEED_CLIENT_PASSWORD: Joi.string().min(6).optional(),
  MOCKPAY_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  MOCKPAY_API_KEY: Joi.string().optional(),
  MOCKPAY_SECRET_KEY: Joi.string().optional(),
  MOCKPAY_WEBHOOK_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  MOCKPAY_WEBHOOK_SECRET: Joi.string().min(32).optional(),
});
