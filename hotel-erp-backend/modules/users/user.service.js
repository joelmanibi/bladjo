'use strict';

const { Op }      = require('sequelize');
const { User }    = require('../../models');
const ApiError    = require('../../utils/ApiError');

const SAFE_ATTRS = ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'];

// ── findAll ───────────────────────────────────────────────────────────────────
/** Liste tous les utilisateurs. Filtre optionnel : ?name=&email=&role= */
const findAll = async (filters = {}) => {
  const where = {};
  if (filters.name)  where.name  = { [Op.like]: `%${filters.name}%` };
  if (filters.email) where.email = { [Op.like]: `%${filters.email}%` };
  if (filters.role)  where.role  = filters.role;

  return User.findAll({ where, attributes: SAFE_ATTRS, order: [['createdAt', 'DESC']] });
};

// ── findById ──────────────────────────────────────────────────────────────────
const findById = async (id) => {
  const user = await User.findByPk(id, { attributes: SAFE_ATTRS });
  if (!user) throw ApiError.notFound(`Utilisateur #${id} introuvable`);
  return user;
};

// ── create ────────────────────────────────────────────────────────────────────
/** Crée un utilisateur. Le hachage du mot de passe est géré par le hook du modèle. */
const create = async (payload) => {
  const { name, email, password, role } = payload;

  if (!name || !email || !password) {
    throw ApiError.badRequest('name, email et password sont obligatoires');
  }

  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw ApiError.conflict('Cet email est déjà utilisé');

  const user = await User.create({ name, email, password, role: role || 'RECEPTIONIST' });
  return user.toSafeObject();
};

// ── update ────────────────────────────────────────────────────────────────────
/** Mise à jour partielle : name, email, role et/ou password. */
const update = async (id, payload) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound(`Utilisateur #${id} introuvable`);

  const { name, email, role, password } = payload;

  // Vérifie unicité email si changement
  if (email && email.toLowerCase().trim() !== user.email) {
    const taken = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (taken) throw ApiError.conflict('Cet email est déjà utilisé');
  }

  await user.update({
    ...(name     !== undefined && { name     }),
    ...(email    !== undefined && { email    }),
    ...(role     !== undefined && { role     }),
    ...(password !== undefined && password !== '' && { password }),
  });

  return user.toSafeObject();
};

// ── remove ────────────────────────────────────────────────────────────────────
/** Supprime un utilisateur. Empêche la suppression du dernier ADMIN. */
const remove = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound(`Utilisateur #${id} introuvable`);

  if (user.role === 'ADMIN') {
    const adminCount = await User.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw ApiError.badRequest('Impossible de supprimer le dernier administrateur');
    }
  }

  await user.destroy();
};

module.exports = { findAll, findById, create, update, remove };

