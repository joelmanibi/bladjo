'use strict';

const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const ROLES = ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'];

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Compare a plain-text password against the stored hash.
     * @param {string} candidatePassword
     * @returns {Promise<boolean>}
     */
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    /**
     * Return a plain object without the password field.
     * Safe to send in API responses.
     */
    toSafeObject() {
      const { password, ...safe } = this.toJSON();
      return safe;
    }
  }

  User.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
          len:      { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      email: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        unique:    true,
        set(value) {
          this.setDataValue('email', value ? value.toLowerCase().trim() : value);
        },
        validate: {
          isEmail:  { msg: 'Must be a valid email address' },
          notEmpty: { msg: 'Email is required' },
        },
      },
      password: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Password is required' },
          len:      { args: [6, 255], msg: 'Password must be at least 6 characters' },
        },
      },
      role: {
        type:         DataTypes.ENUM(...ROLES),
        allowNull:    false,
        defaultValue: 'RECEPTIONIST',
        validate: {
          isIn: { args: [ROLES], msg: 'Invalid role' },
        },
      },
    },
    {
      sequelize,
      modelName:  'User',
      tableName:  'Users',
      timestamps: true,
      hooks: {
        // Hash password before creating a new user
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        // Re-hash password only if it was changed
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
    }
  );

  return User;
};

// Export roles constant for reuse across the project
module.exports.ROLES = ROLES;

