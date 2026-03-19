const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permit.middleware");
const {
  listPaymentsController,
  addPaymentController,
} = require("../controllers/casePayments.controller");

router.get(
  "/cases/:id/payments",
  authRequired,
  requirePermission("CASES_READ"),
  listPaymentsController
);

router.post(
  "/cases/:id/payments",
  authRequired,
  requirePermission("CASES_MANAGE"),
  addPaymentController
);

module.exports = router;