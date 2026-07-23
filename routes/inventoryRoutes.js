const router = require("express").Router();

const tools = require("../controllers/inventory/toolController");
const consumables = require("../controllers/inventory/consumableController");
const spareParts = require("../controllers/inventory/sparePartController");
const projects = require("../controllers/inventory/projectController");
const records = require("../controllers/inventory/recordController");
const forms = require("../controllers/inventory/consumableFormController");
const employees = require("../controllers/inventory/inventoryEmployeeController");

// ---- Tools ----
router.post("/tools/list", tools.listTools);
router.get("/tools/total-tools", tools.totalTools);
router.post("/tools/search-options", tools.searchOptions);
router.get("/tools/search-options-st", tools.availableOptions);
router.get("/tools/brand-options", tools.brandOptions);
router.get("/tools/list-of-all-tools", tools.listOfAllTools);
router.post("/tools", tools.createTool);
router.put("/tools/:id", tools.updateTool);
router.delete("/tools/:id", tools.deleteTool);

// ---- Consumables ----
router.post("/consumables/list", consumables.listConsumables);
router.get("/consumables/total-item", consumables.totalItem);
router.get("/consumables/search-options", consumables.searchOptions);
router.get("/consumables/list-of-all-consumables", consumables.listOfAllConsumables);
router.post("/consumables", consumables.createConsumable);
router.put("/consumables/:id", consumables.updateConsumable);
router.delete("/consumables/:id", consumables.deleteConsumable);

// ---- Spare Parts ----
router.post("/spare-parts/list", spareParts.listSpareParts);
router.post("/spare-parts/search-options", spareParts.searchOptions);
router.post("/spare-parts/total", spareParts.total);
router.post("/spare-parts", spareParts.createSparePart);
router.put("/spare-parts/:id", spareParts.updateSparePart);
router.delete("/spare-parts/:id", spareParts.deleteSparePart);

// ---- Projects (Tool Forms) ----
router.post("/projects/list", projects.listProjects);
router.get("/projects/total-form", projects.totalForm);
router.get("/projects/search-options", projects.searchOptions);
router.post("/projects", projects.createProject);
router.put("/projects/:id", projects.updateProject);
router.delete("/projects/:id", projects.deleteProject);

// ---- Records (borrow / return) ----
router.post("/records/list-borrowed", records.listBorrowed);
router.post("/records/list-returned", records.listReturned);
router.get("/records/total-borrowed", records.totalBorrowed);
router.get("/records/total-returned", records.totalReturned);
router.post("/records", records.createRecord);
router.put("/records/edit-item/:id", records.editItem);
router.put("/records/:id", records.returnRecord);
router.delete("/records/:id", records.deleteRecord);

// ---- Consumable Forms ----
router.post("/consumable-forms/list", forms.listForms);
router.get("/consumable-forms/total-form", forms.totalForm);
router.get("/consumable-forms/search-options", forms.searchOptions);
router.post("/consumable-forms/add-form", forms.addForm);
router.post("/consumable-forms/add-item", forms.addItem);
router.put("/consumable-forms/add-quantity/:id", forms.addQuantity);
router.put("/consumable-forms/subtract-quantity/:id", forms.subtractQuantity);
router.put("/consumable-forms/edit-item/:id", forms.editItem);
router.put("/consumable-forms/:id", forms.updateForm);
router.delete("/consumable-forms/item/:id", forms.deleteItem);
router.delete("/consumable-forms/:id", forms.deleteForm);

// ---- Employees (tools view of the shared employees) ----
router.post("/employees/list", employees.listEmployees);
router.get("/employees/total-employees", employees.totalEmployees);
router.get("/employees/search-options", employees.searchOptions);
router.post("/employees", employees.createEmployee);
router.put("/employees/:id", employees.updateEmployee);
router.delete("/employees/:id", employees.deleteEmployee);

module.exports = router;
