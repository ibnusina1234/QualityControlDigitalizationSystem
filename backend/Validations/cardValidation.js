const Joi = require('joi');

// Schema for nested samples object
const samplesSchema = Joi.object({
  reduce: Joi.string().max(20).allow('').label('Reduce'),
  non_reduce: Joi.string().max(20).allow('').label('Non Reduce'),
  lod: Joi.string().max(20).allow('').label('LOD'),
  pertinggal: Joi.string().max(20).allow('').label('Pertinggal'),
  mikro: Joi.string().max(20).allow('').label('Mikro'),
  uji_luar: Joi.string().max(20).allow('').label('Uji Luar'),
});

// Main validation schema
const samplingCardSchema = Joi.object({
  ref_card_number: Joi.string()
    .pattern(/^KS-QC/)
    .max(50)
    .allow('')
    .messages({
      'string.pattern.base': "Harus diawali dengan 'KS-QC'",
    }),

  nama_material: Joi.string()
    .max(100)
    .trim()
    .required()
    .messages({
      'string.empty': 'Nama material wajib diisi.',
      'string.max': 'Nama material maksimal 100 karakter.',
    }),

  kode_item: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages({
      'string.empty': 'Kode item wajib diisi.',
      'string.max': 'Kode item maksimal 50 karakter.',
    }),

  manufacture: Joi.string()
    .max(100)
    .trim()
    .allow('')
    .messages({
      'string.max': 'Manufacture maksimal 100 karakter.',
    }),

  card_number: Joi.string()
    .max(50)
    .trim()
    .required()
    .messages({
      'string.empty': 'Nomor kartu wajib diisi.',
      'string.max': 'Nomor kartu maksimal 50 karakter.',
    }),

  expired_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Format tanggal salah (YYYY-MM-DD).',
    }),

  storage_condition: Joi.string()
    .valid('', 'STORE BELOW 25°C', 'STORE BELOW 30°C')
    .required()
    .messages({
      'any.only': 'Storage condition tidak valid.',
      'string.empty': 'Suhu penyimpanan wajib dipilih.',
    }),

  manufacturer_status: Joi.string()
    .valid('', 'APPROVED', 'QUALIFIED', 'MLR', 'REDUCE TESTING', 'RELEASED BY CoA')
    .required()
    .messages({
      'any.only': 'Status pabrikan tidak valid.',
      'string.empty': 'Status pabrikan wajib dipilih.',
    }),

  condition_desc: Joi.string().max(500).allow(''),

  outer_packaging: Joi.string().max(500).allow(''),

  inner_packaging: Joi.string().max(500).allow(''),

  sampling_method: Joi.string().max(500).allow(''),

  tools_used: Joi.string().max(500).allow(''),

  sampling_process: Joi.string().max(1000).allow(''),

  cleaning_tools: Joi.string().max(500).allow(''),

  samples: samplesSchema,

  // Optional fields for approval, can be extended as needed
  

  gallery_photos: Joi.object().optional(),
  uploaded_links: Joi.array().items(Joi.string().uri()).optional(),

  created_by: Joi.string().max(50).allow(''),
});

const approvalSchema = Joi.object({
  qc_supervisor_approved: Joi.boolean().optional(),
  qc_supervisor_name: Joi.string().max(100).allow(''),
  qc_supervisor_approval_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(''),
  qc_manager_approved: Joi.boolean().optional(),
  qc_manager_name: Joi.string().max(100).allow(''),
  qc_manager_approval_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(''),
  qa_manager_approved: Joi.boolean().optional(),
  qa_manager_name: Joi.string().max(100).allow(''),
  qa_manager_approval_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(''),
  approval_notes: Joi.string().max(1000).allow('')
});

module.exports = {samplingCardSchema,approvalSchema}