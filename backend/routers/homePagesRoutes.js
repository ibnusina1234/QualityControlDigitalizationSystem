const express = require("express");
const router = express.Router();
const homePagesController = require("../controllers/homePages");

// GET: Retrieve all editable home page data
router.get("/HomePages", homePagesController.getHomePagesData);
router.get("/stream/:fileId", homePagesController.streamImage);

// PUT: Update page content
router.put("/edit-home-pages/content", homePagesController.updatePageContent);

// Personnel routes
router.post("/edit-home-pages/personnel", homePagesController.addPersonnel);
router.put("/edit-home-pages/personnel/:id", homePagesController.updatePersonnel);
router.delete("/edit-home-pages/personnel/:id", homePagesController.deletePersonnel);

// Company images routes
router.post("/edit-home-pages/company-image", homePagesController.addCompanyImage);
router.put("/edit-home-pages/company-image/:id", homePagesController.updateCompanyImage);
router.delete("/edit-home-pages/company-image/:id", homePagesController.deleteCompanyImage);

// Division routes
router.post("/edit-home-pages/division", homePagesController.addDivision);
router.put("/edit-home-pages/division/:id", homePagesController.updateDivision);
router.delete("/edit-home-pages/division/:id", homePagesController.deleteDivision);

// Division member routes
router.post("/edit-home-pages/division-member", homePagesController.addMemberDivision);
router.put("/edit-home-pages/division-member/:id", homePagesController.updateMemberDivision);
router.delete("/edit-home-pages/division-member/:id", homePagesController.deleteMemberDivision);
router.get("/edit-home-pages/division-member/:divisionId", homePagesController.getDivisionMembers);

// routes/auth.js
router.get("/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "Backend working!" });
});

module.exports = router;