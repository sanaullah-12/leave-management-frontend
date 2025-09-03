# Backend API Implementation Guide

## Required API Endpoints for Employee Detail Page

### 1. Leave Policy Management

#### Get Leave Policy
```http
GET /api/leaves/policy
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "casual": 10,
    "sick": 8,
    "annual": 10,
    "maternity": 90,
    "paternity": 15,
    "emergency": 3
  }
}
```

#### Update Leave Policy (Admin only)
```http
PUT /api/leaves/policy
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "casual": 10,
  "sick": 8,
  "annual": 10,
  "maternity": 90,
  "paternity": 15,
  "emergency": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave policy updated successfully"
}
```

### 2. Individual Employee Leave Allocation

#### Update Employee Leave Allocation (Admin only)
```http
PUT /api/leaves/allocation/{employeeId}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "casual": 12,
  "sick": 10,
  "annual": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee leave allocation updated successfully"
}
```

### 3. Employee Leave History

#### Get Employee Leave History
```http
GET /api/leaves/employee/{employeeId}?page=1&limit=50
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaves": [
      {
        "_id": "64a123...",
        "employee": {
          "_id": "64a456...",
          "name": "John Doe",
          "employeeId": "EMP001"
        },
        "leaveType": "annual",
        "startDate": "2024-01-15",
        "endDate": "2024-01-19",
        "totalDays": 5,
        "reason": "Family vacation",
        "status": "approved",
        "reviewComments": "Approved for vacation",
        "createdAt": "2024-01-10",
        "updatedAt": "2024-01-12"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "pages": 1
    }
  }
}
```

### 4. Enhanced Leaves Endpoint (Filter by Employee)

#### Get Leaves with Employee Filter
```http
GET /api/leaves?employeeId={employeeId}&page=1&limit=50&status=approved
Authorization: Bearer {token}
```

This should work with your existing leaves endpoint by adding employeeId as a query parameter.

## Database Schema Additions

### 1. Leave Policy Collection
```javascript
// leavePolicy schema
{
  _id: ObjectId,
  companyId: ObjectId, // reference to company
  policy: {
    casual: Number,
    sick: Number,
    annual: Number,
    maternity: Number,
    paternity: Number,
    emergency: Number
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // admin who created/updated
}
```

### 2. Employee Leave Allocation Collection (Optional)
```javascript
// employeeLeaveAllocation schema
{
  _id: ObjectId,
  employeeId: ObjectId,
  companyId: ObjectId,
  year: Number, // 2024
  allocations: {
    casual: Number,
    sick: Number,
    annual: Number,
    maternity: Number,
    paternity: Number,
    emergency: Number
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId // admin who set the allocation
}
```

## Implementation Priority

1. **High Priority (Core Functionality):**
   - GET `/api/leaves?employeeId={id}` (filter existing leaves endpoint)
   - GET `/api/leaves/policy` (with default policy fallback)

2. **Medium Priority (Admin Features):**
   - PUT `/api/leaves/policy` (admin policy management)
   - PUT `/api/leaves/allocation/{employeeId}` (individual allocations)

3. **Low Priority (Enhanced Features):**
   - GET `/api/leaves/employee/{employeeId}` (dedicated endpoint)
   - Advanced analytics and reporting

## Default Leave Policy

When no policy is set, use these defaults:
- Casual Leave: 10 days
- Sick Leave: 8 days  
- Annual Leave: 10 days
- Maternity Leave: 90 days
- Paternity Leave: 15 days
- Emergency Leave: 3 days

## Current Frontend Fallback

The frontend currently:
- Uses employee data from the existing `/api/users` endpoint
- Calculates leave balance from actual leave history
- Falls back to default policy values when API endpoints don't exist
- Provides mock data for demonstration purposes

This ensures the Employee Detail Page works even before backend implementation is complete!