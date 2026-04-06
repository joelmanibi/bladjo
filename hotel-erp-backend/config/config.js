'use strict';

require('dotenv').config();

/**
 * Sequelize CLI configuration.
 * Used by sequelize-cli for migrations and seeders.
 *
 * The three environments must be present; only the active one is used at runtime.
 */
module.exports = {
  development: {
    username: process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME     || 'hotel_erp_dev',
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  'mysql',
    logging:  console.log,
  },
  test: {
    username: process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME     || 'hotel_erp_test',
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  'mysql',
    logging:  false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  'mysql',
    logging:  false,
    pool: {
      max:     20,
      min:     5,
      acquire: 60000,
      idle:    10000,
    },
  },
};

