const express = require("express");
const router = express.Router();
const samplingCardController = require("../controllers/samplingCardControllers");
const upload = require("../utils/upload")
const confirmUser = require("../middleware/confirmUserToApproval");
const verifyToken = require("../middleware/auth");
const updateTokenExpiry =require("../middleware/updateTokenExpired");
const {dynamicRateLimiter} = require("../middleware/rateLimit");
const sanitizeInput = require("../middleware/validateInput");
const validate = require("../middleware/userValidation");
const  {
  samplingCardSchema,
  approvalSchema
} = require("../Validations/cardValidation");


// 🔹 Mendapatkan data Kartu Sampling
// 📸 [1] Upload foto ke Google Drive
router.post(
      "/sampling-cards/upload-image",
      upload.array("imageFiles", 20), 
      samplingCardController.uploadSamplingImagesHandler
    );
    
    // 📝 [2] Submit data Sampling Card (setelah upload gambar)
    router.post(
      "/sampling-cards",
      samplingCardController.createSamplingCardHandler
    );
    

// 🔹 Mendapatkan data list Kartu Sampling
router.get("/list-sampling-cards", samplingCardController.listSamplingCard);

// 🔹 Mendapatkan Approval Kartu Sampling
router.post("/approval-sampling-cards", samplingCardController.approveKS);

// 🔹 Mendapatkan Create Approval Kartu Sampling
router.get("/pending-approval-sampling-cards", samplingCardController.getUnapprovedSamplingCards);

// 🔹 Mendapatkan Get Approval Kartu Sampling
router.get("/get-approval-sampling-cards", samplingCardController.getApprovalKS);

// 🔹 Mendapatkan data rincian Kartu Sampling
router.get("/part-sampling-cards", samplingCardController.partSamplingCard);

// 🔹 Mendapatkan data rincian Kartu Sampling
router.get("/get-images/:fileId", samplingCardController.streamImage);

// 🔹 mengirimkan data history Kartu Sampling
router.post("/send-sampling-card-history", samplingCardController.insertSamplingHistory);

// 🔹 verifikasi user untuk approval
router.post("/verify-user", confirmUser.verifyUser);

// 🔹 delete material
router.delete("/delete-sampling-cards/:id",samplingCardController.deleteMaterialById);


//🔹 mendapatkan semua data kartu sampling
router.get("/sampling-cards-detail/:id",samplingCardController.getMaterialDetail);

//🔹 mendapatkan semua data kartu sampling hal 2
router.get("/sampling-card-history/:prefix", samplingCardController.getSamplingHistory);

router.get("/getMaterialDetailByCardNumber/:card_number",samplingCardController.getMaterialDetailByCardNumber);

//🔹 mendapatkan semua data kartu sampling hal 2
router.delete("/sampling-card-delete/:id", samplingCardController.deleteSamplingCard);

module.exports = router;