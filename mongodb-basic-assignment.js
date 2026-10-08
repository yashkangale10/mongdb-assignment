// ============================================================
// Task 1: Local Setup and Data Creation
// ============================================================

// Step 1: Verify MongoDB connection
show dbs

// Step 2: Select/Create the 'company' database
use("company")

// Step 3: Insert the employee dataset
db.employees.insertMany([
  {
    _id: "EMP001",
    name: "John",
    department: "Engineering",
    experience: 4,
    skills: ["Java", "SpringBoot"],
    active: true,
    address: { city: "Pune", country: "India" }
  },
  {
    _id: "EMP002",
    name: "Alice",
    department: "HR",
    experience: 3,
    skills: ["Recruitment", "Communication"],
    active: true,
    address: { city: "Mumbai", country: "India" }
  },
  {
    _id: "EMP003",
    name: "David",
    department: "Engineering",
    experience: 6,
    skills: ["Java", "MongoDB"],
    active: true,
    address: { city: "Bengaluru", country: "India" }
  },
  {
    _id: "EMP004",
    name: "Emma",
    department: "Finance",
    experience: 2,
    skills: ["Accounting", "Excel"],
    active: false,
    address: { city: "Pune", country: "India" }
  },
  {
    _id: "EMP005",
    name: "Robert",
    department: "Engineering",
    experience: 5,
    skills: ["Java", "Docker"],
    active: true,
    address: { city: "Delhi", country: "India" }
  }
])

// Verification: Database exists
show dbs

// Verification: Collection exists
show collections

// Verification: Collection contains 5 documents
db.employees.countDocuments()


// ============================================================
// Task 2: Read and Query Operations
// ============================================================

// 2.1 Engineering Employees
// Retrieve Engineering employees with _id, name, experience; sorted by name ascending
db.employees.find(
  { department: "Engineering" },
  { _id: 1, name: 1, experience: 1 }
).sort({ name: 1 })

// 2.2 Employees with 5 or More Years of Experience
// Retrieve employees with experience >= 5; return name & experience (exclude _id); sort by experience descending
db.employees.find(
  { experience: { $gte: 5 } },
  { name: 1, experience: 1, _id: 0 }
).sort({ experience: -1 })

// 2.3 Nested Document Query
// Retrieve employees whose address city is Pune; return name and city; sort by name
db.employees.find(
  { "address.city": "Pune" },
  { _id: 0, name: 1, "address.city": 1 }
).sort({ name: 1 })

// 2.4 Array Query
// Using $in, retrieve employees whose skills contain MongoDB or SpringBoot; sort by name ascending
db.employees.find(
  { skills: { $in: ["MongoDB", "SpringBoot"] } }
).sort({ name: 1 })

// 2.5 Sorting and Limiting
// Top 2 employees with highest experience; return name & experience
db.employees.aggregate([
  { $sort: { experience: -1 } },
  { $limit: 2 },
  { $project: { _id: 0, name: 1, experience: 1 } }
])


// ============================================================
// Task 3: Update Operations
// ============================================================

// 3.1 $inc — Increase Alice's experience by 1 (3 → 4)
db.employees.updateOne(
  { name: "Alice" },
  { $inc: { experience: 1 } }
)

// Verification: Alice's experience should now be 4
db.employees.findOne({ name: "Alice" }, { name: 1, experience: 1 })

// 3.2 $set — Change Emma's active from false to true
db.employees.updateOne(
  { name: "Emma" },
  { $set: { active: true } }
)

// Verification: Emma's active should now be true
db.employees.findOne({ name: "Emma" }, { name: 1, active: 1 })

// 3.3 $addToSet — Add "MongoDB" to Robert's skills (no duplicates)
db.employees.updateOne(
  { name: "Robert" },
  { $addToSet: { skills: "MongoDB" } }
)

// Verification: Robert's skills should be ["Java", "Docker", "MongoDB"]
db.employees.findOne({ name: "Robert" }, { name: 1, skills: 1 })

// Running $addToSet again — MongoDB should NOT be duplicated
db.employees.updateOne(
  { name: "Robert" },
  { $addToSet: { skills: "MongoDB" } }
)

// Verification: Robert's skills should still be ["Java", "Docker", "MongoDB"]
db.employees.findOne({ name: "Robert" }, { name: 1, skills: 1 })


// ============================================================
// Task 4: Delete Operation
// ============================================================

// Insert a temporary document
db.employees.insertOne({
  _id: "EMP999",
  name: "Temporary Employee",
  department: "Training",
  experience: 0
})

// Delete only the temporary document
db.employees.deleteOne({ _id: "EMP999" })

// Verification: Should return null
db.employees.findOne({ _id: "EMP999" })

// Verification: Original 5 documents must remain
db.employees.countDocuments()


// ============================================================
// Task 5: Indexing
// ============================================================

// 5.1 Check existing indexes (only _id_ should exist)
db.employees.getIndexes()

// 5.2 Create an ascending index on department
db.employees.createIndex({ department: 1 })

// 5.3 Verify the index — should now show _id_ and department_1
db.employees.getIndexes()


// ============================================================
// Task 6: Aggregation
// ============================================================

// 6.1 Employees per Department
// Count employees in each department; sort by department name ascending
db.employees.aggregate([
  { $group: { _id: "$department", totalEmployees: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])

// 6.2 Average Experience per Department
// Calculate average experience per department; sort by department ascending
db.employees.aggregate([
  { $group: { _id: "$department", avgExperience: { $avg: "$experience" } } },
  { $sort: { _id: 1 } }
])

// 6.3 Top Engineering Employees
// Filter Engineering → project name & experience → sort desc → limit 2
db.employees.aggregate([
  { $match: { department: "Engineering" } },
  { $project: { _id: 0, name: 1, experience: 1 } },
  { $sort: { experience: -1 } },
  { $limit: 2 }
])
