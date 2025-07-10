// middleware/userValidation.js
const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  if (!schema || typeof schema.validate !== "function") {
    return res
      .status(500)
      .json({ error: "Schema Joi tidak valid atau undefined." });
  }

  const data = {
    ...req.body,
    ...req.params,
    ...req.query,
  };

  const { error } = schema.validate(data, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      error: "Validation error",
      details: error.details.map((d) => d.message),
    });
  }

  next();
};

module.exports = validate;
