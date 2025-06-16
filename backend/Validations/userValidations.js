const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  nama_lengkap: Joi.string().min(3).max(100).required(),
  inisial: Joi.string().max(10).required(),
  departement: Joi.string().required(),
  jabatan: Joi.string().required(),
  password: Joi.string().min(6).required(),
  // img TIDAK divalidasi karena ada di req.file, bukan req.body
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  nama_lengkap: Joi.string().min(3).required(),
  inisial: Joi.string().required(),
  departement: Joi.string().required(),
  jabatan: Joi.string().required(),
  userrole: Joi.string().valid("admin", "user","super admin").optional(),
});

const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid("Pending", "Accept", "Reject").required(),
  userrole: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updateUserStatusSchema,
};
