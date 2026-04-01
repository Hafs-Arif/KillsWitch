"use strict";

require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: requireEnv("DB_PASSWORD"),
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST  ,
    port:     Number(process.env.DB_PORT),
    dialect:  process.env.DB_DIALECT,
    logging:  false,
  },
  test: {
    username: process.env.DB_USER,
    password: requireEnv("DB_PASSWORD"),
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    dialect:  process.env.DB_DIALECT,
    logging:  false,
  },
  production: {
    username: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    host:     requireEnv("DB_HOST"),
    port:     Number(requireEnv("DB_PORT")),
    dialect:  "postgres",
    logging:  false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: true },
    },
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
  },
};