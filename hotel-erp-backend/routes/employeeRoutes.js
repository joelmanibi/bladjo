'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');

router.use(protect);

// GET /api/employees          ← ?position=Receptionist&name=Ali
router.get('/',    getAllEmployees);
// GET /api/employees/:id      ← includes salary payment history
router.get('/:id', getEmployeeById);
// POST /api/employees
router.post('/',   createEmployee);
// PUT /api/employees/:id
router.put('/:id', updateEmployee);
// DELETE /api/employees/:id   ← blocked if payment records exist
router.delete('/:id', deleteEmployee);

module.exports = router;

