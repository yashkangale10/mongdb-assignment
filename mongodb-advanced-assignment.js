// ============================================================
// Task 1: Schema Validation and Data Creation
// ============================================================

// Step 1: Select a fresh database
use company_advanced

// Verify current database
db

// Step 2: Create the employees collection with $jsonSchema validation
db.createCollection("employees", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "departmentId", "experience", "active"],
            properties: {
                name: {
                    bsonType: "string"
                },
                departmentId: {
                    bsonType: "int"
                },
                experience: {
                    bsonType: "int"
                },
                active: {
                    bsonType: "bool"
                }
            }
        }
    }
})

// Step 3: Insert the starting dataset (3 employee documents)
db.employees.insertMany([
    {
        _id: 1,
        name: "John",
        departmentId: 10,
        skills: ["Java", "MongoDB"],
        experience: 4,
        active: true,
        certifications: [
            {
                name: "MongoDB",
                status: "Expired",
                expiryYear: 2026
            }
        ]
    },
    {
        _id: 2,
        name: "Alice",
        departmentId: 10,
        skills: ["Python", "MongoDB"],
        experience: 6,
        active: true,
        certifications: [
            {
                name: "MongoDB",
                status: "Active",
                expiryYear: 2028
            }
        ]
    },
    {
        _id: 3,
        name: "David",
        departmentId: 20,
        skills: ["Communication"],
        experience: 3,
        active: false,
        certifications: [
            {
                name: "Communication",
                status: "Active",
                expiryYear: 2027
            }
        ]
    }
])

// Step 4: Test validation — this insert must be REJECTED (invalid field types)
db.employees.insertOne({
    _id: 99,
    name: 123,
    departmentId: "HR",
    experience: "one",
    active: "yes"
})


// ============================================================
// Task 2: Advanced Array Queries and Updates
// ============================================================

// 2.1 Find employees with certifications containing name: "MongoDB" AND status: "Active" using $elemMatch
db.employees.find({
    certifications: {
        $elemMatch: {
            name: "MongoDB",
            status: "Active"
        }
    }
})

// 2.2 Update John's MongoDB certification status from "Expired" to "Active" using positional $ operator
db.employees.updateOne(
    {
        _id: 1,
        "certifications.name": "MongoDB"
    },
    {
        $set: {
            "certifications.$.status": "Active"
        }
    }
)

// Verify John's updated certification
db.employees.findOne({ _id: 1 })

// 2.3 Change status to "Renewal Due" for certifications where expiryYear < 2027 using arrayFilters
db.employees.updateMany(
    {},
    {
        $set: {
            "certifications.$[cert].status": "Renewal Due"
        }
    },
    {
        arrayFilters: [
            { "cert.expiryYear": { $lt: 2027 } }
        ]
    }
)

// Verify: Alice → MongoDB, Active | John → MongoDB, Renewal Due
db.employees.find(
    {},
    {
        _id: 0,
        name: 1,
        certifications: 1
    }
)


// ============================================================
// Task 3: Bulk Write Operations
// ============================================================

// Single bulkWrite() call: increment John's exp, deactivate Alice, insert Emma
db.employees.bulkWrite([
    {
        updateOne: {
            filter: { _id: 1 },
            update: {
                $inc: { experience: 1 }
            }
        }
    },
    {
        updateOne: {
            filter: { _id: 2 },
            update: {
                $set: { active: false }
            }
        }
    },
    {
        insertOne: {
            document: {
                _id: 4,
                name: "Emma",
                departmentId: 20,
                skills: ["Excel"],
                experience: 2,
                active: true,
                certifications: [
                    {
                        name: "Excel",
                        status: "Active",
                        expiryYear: 2026
                    }
                ]
            }
        }
    }
])


// ============================================================
// Task 4: Advanced Aggregation
// ============================================================

// 4.1 Join employees with departments using $lookup and $unwind
// Return employee name and departmentName; sort by name ascending
db.employees.aggregate([
    {
        $lookup: {
            from: "departments",
            localField: "departmentId",
            foreignField: "_id",
            as: "department"
        }
    },
    {
        $unwind: "$department"
    },
    {
        $project: {
            _id: 0,
            name: 1,
            departmentName: "$department.name"
        }
    },
    {
        $sort: {
            name: 1
        }
    }
])

// 4.2 Count employees for each skill
// $unwind skills → group by skill → count → sort by count desc, skill name asc
db.employees.aggregate([
    {
        $unwind: "$skills"
    },
    {
        $group: {
            _id: "$skills",
            employeeCount: {
                $sum: 1
            }
        }
    },
    {
        $sort: {
            employeeCount: -1,
            _id: 1
        }
    }
])

// 4.3 Return active employees and a count using $facet
// Returns both active employee names (sorted ascending) and total count in one pipeline
db.employees.aggregate([
    {
        $match: {
            active: true
        }
    },
    {
        $facet: {
            employees: [
                {
                    $sort: {
                        name: 1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        name: 1
                    }
                }
            ],
            count: [
                {
                    $count: "totalActiveEmployees"
                }
            ]
        }
    }
])


// ============================================================
// Task 5: Indexing and Query Performance
// ============================================================

// 5.1 Create a compound index on departmentId (asc) + name (asc)
db.employees.createIndex(
    {
        departmentId: 1,
        name: 1
    },
    {
        name: "departmentId_1_name_1"
    }
)

// Verify indexes
db.employees.getIndexes()

// 5.2 Run explain("executionStats") to analyze query performance
db.employees
    .find({ departmentId: 10 })
    .sort({ name: 1 })
    .explain("executionStats")

// Output:
// {
//   explainVersion: '1',
//   queryPlanner: {
//     namespace: 'company_advanced.employees',
//     parsedQuery: {
//       departmentId: {
//         '$eq': 10
//       }
//     },
//     indexFilterSet: false,
//     queryHash: 'E5A42DED',
//     planCacheShapeHash: 'E5A42DED',
//     planCacheKey: 'D43CA850',
//     optimizationTimeMillis: 1,
//     optimizationTimeMicros: 1135,
//     maxIndexedOrSolutionsReached: false,
//     maxIndexedAndSolutionsReached: false,
//     maxScansToExplodeReached: false,
//     prunedSimilarIndexes: false,
//     winningPlan: {
//       isCached: false,
//       stage: 'FETCH',
//       nss: 'company_advanced.employees',
//       inputStage: {
//         stage: 'IXSCAN',
//         nss: 'company_advanced.employees',
//         keyPattern: {
//           departmentId: 1,
//           name: 1
//         },
//         indexName: 'departmentId_1_name_1',
//         isMultiKey: false,
//         multiKeyPaths: {
//           departmentId: [],
//           name: []
//         },
//         isUnique: false,
//         isSparse: false,
//         isPartial: false,
//         indexVersion: 2,
//         direction: 'forward',
//         indexBounds: {
//           departmentId: [
//             '[10, 10]'
//           ],
//           name: [
//             '[MinKey, MaxKey]'
//           ]
//         }
//       }
//     },
//     rejectedPlans: []
//   },
//   executionStats: {
//     executionSuccess: true,
//     nReturned: 2,
//     executionTimeMillis: 5,
//     executionTimeMicros: 5331,
//     totalKeysExamined: 2,
//     totalDocsExamined: 2,
//     executionStages: {
//       isCached: false,
//       stage: 'FETCH',
//       nReturned: 2,
//       executionTimeMillisEstimate: 0,
//       works: 3,
//       advanced: 2,
//       needTime: 0,
//       needYield: 0,
//       saveState: 0,
//       restoreState: 0,
//       isEOF: 1,
//       nss: 'company_advanced.employees',
//       docsExamined: 2,
//       alreadyHasObj: 0,
//       inputStage: {
//         stage: 'IXSCAN',
//         nReturned: 2,
//         executionTimeMillisEstimate: 0,
//         works: 3,
//         advanced: 2,
//         needTime: 0,
//         needYield: 0,
//         saveState: 0,
//         restoreState: 0,
//         isEOF: 1,
//         nss: 'company_advanced.employees',
//         keyPattern: {
//           departmentId: 1,
//           name: 1
//         },
//         indexName: 'departmentId_1_name_1',
//         isMultiKey: false,
//         multiKeyPaths: {
//           departmentId: [],
//           name: []
//         },
//         isUnique: false,
//         isSparse: false,
//         isPartial: false,
//         indexVersion: 2,
//         direction: 'forward',
//         indexBounds: {
//           departmentId: [
//             '[10, 10]'
//           ],
//           name: [
//             '[MinKey, MaxKey]'
//           ]
//         },
//         keysExamined: 2,
//         seeks: 1,
//         dupsTested: 0,
//         dupsDropped: 0,
//         peakTrackedMemBytes: 0
//       }
//     }
//   },
//    queryShapeHash: '5A0F20A6DED9FE3E1BFA7046D82577FA3941B587A0A6EC4AD43E72479A526CFC',
//   command: {
//     find: 'employees',
//     filter: {
//       departmentId: 10
//     },
//     sort: {
//       name: 1
//     },
//     '$db': 'company_advanced'
//   },
//   serverInfo: {
//     host: 'Yash-Legion5',
//     port: 27017,
//     version: '9.0.2',
//     gitVersion: 'c4d309807b94ac30edcca32e35e88a9598eadfc8'
//   },
//   serverParameters: {
//     internalQueryFacetMaxOutputDocSizeBytes: 104857600,
//     internalLookupStageIntermediateDocumentMaxSizeBytes: 104857600,
//     internalQueryProhibitBlockingMergeOnMongoS: 0,
//     internalQueryFrameworkControl: 'trySbeRestricted',
//     internalQueryPlannerIgnoreIndexWithCollationForRegex: 1
//   },
//   ok: 1
// }

// 5.3 Create a TTL index on the sessions collection
db.createCollection("sessions")

db.sessions.insertOne({
    _id: 1,
    userName: "John",
    expiresAt: new Date(Date.now() + 600000)
})

// TTL index: documents expire when expiresAt time is reached
db.sessions.createIndex(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0,
        name: "expiresAt_1"
    }
)

// Verify TTL index
db.sessions.getIndexes()
