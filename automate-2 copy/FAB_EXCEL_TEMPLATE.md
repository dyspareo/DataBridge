# FAB Hierarchy Excel Template

## Excel Format Specification

### Column Order (A-I)
| Index | Column Name | Description | Example |
|-------|-------------|-------------|---------|
| 0 | Plant Code | Plant identifier | 2031 |
| 1 | Department Code | Department identifier | CIVIL &MEP |
| 2 | Initiator | Initiator email | john.doe@company.com |
| 3 | Reviewer | Reviewer email | jane.smith@company.com |
| 4 | CBS GA | CBS GA emails (comma-separated) | user1@company.com,user2@company.com |
| 5 | Business Partner 1 | Business partner email | partner1@company.com |
| 6 | Business Partner 2 | Business partner email | partner2@company.com |
| 7 | Approver DoA 1 | Approver email | approver1@company.com |
| 8 | Approver DoA 2 | Approver email | approver2@company.com |

### Sample Excel Data

| Plant Code | Department Code | Initiator | Reviewer | CBS GA | Business Partner 1 | Business Partner 2 | Approver DoA 1 | Approver DoA 2 |
|------------|-----------------|-----------|----------|--------|-------------------|-------------------|----------------|----------------|
| 2031 | CIVIL &MEP | john.doe@company.com | jane.smith@company.com | user1@company.com,user2@company.com | partner1@company.com | partner2@company.com | approver1@company.com | approver2@company.com |
| 2032 | MECHANICAL | initiator@company.com | reviewer@company.com | cbs@company.com | bp1@company.com | bp2@company.com | app1@company.com | app2@company.com |

### Validation Rules

1. **Plant Code**: Must exist in FAB_PLANT_MASTER table and be active
2. **Department Code**: Must belong to the specified plant in FAB_DEPARTMENT_MASTER table
3. **All Email Fields**: Must be valid email format and exist in USER_MASTER table
4. **CBS GA**: Can contain multiple comma-separated emails, each validated individually
5. **Duplicate Detection**: Same Plant+Department combination in same upload generates warning

### API Endpoint

**POST** `/api/fab/hierarchy/upload`

**Request**: Multipart form data with file field named "file"

**Response**: Array of validation results per row

```json
[
  {
    "rowNumber": 2,
    "status": "VALID",
    "errors": [],
    "warnings": []
  },
  {
    "rowNumber": 3,
    "status": "INVALID",
    "errors": [
      "Plant code '9999' does not exist",
      "Initiator user 'invalid@company.com' not found in system"
    ],
    "warnings": []
  }
]
```
