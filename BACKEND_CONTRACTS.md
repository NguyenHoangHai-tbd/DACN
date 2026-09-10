# ASP.NET Core Backend Contracts - Library Management SaaS (Auth Module)

## 1. REST API Endpoints

### `POST /api/auth/login`
**Description**: Authenticates a user and returns a JWT along with the scoped tenant information. Detects suspicious logins via AI Service.
- **Request (LoginDto)**:
  ```json
  {
    "username": "admin",
    "password": "SecurePassword123!",
    "tenantCode": "hq"
  }
  ```
- **Response `200 OK` (AuthResponseDto)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbG...",
      "refreshToken": "ref-tok-...",
      "user": {
        "id": "u-1",
        "username": "admin",
        "tenantId": "tenant-1",
        "roles": ["TenantAdmin", "Librarian"],
        "branchIds": ["b-1", "b-2"]
      },
      "riskAlert": "High risk detected by AI: Suspicious location."
    },
    "message": null,
    "errors": null,
    "meta": null
  }
  ```
- **Response `401 Unauthorized`**: Returns standard error wrapper with `message: "auth.login.invalid_credentials"`.

### `POST /api/auth/refresh`
**Description**: Refreshes the JWT without requiring credentials.
- **Request (RefreshTokenDto)**: `{ "refreshToken": "..." }`
- **Response `200 OK`**: Returns new `accessToken` and `refreshToken`.

### `POST /api/auth/change-password`
**Description**: Updates user password. Requires valid Bearer token.
- **Request (ChangePasswordDto)**: `{ "currentPassword": "...", "newPassword": "..." }`
- **Response `200 OK`**: Returns success message key.

## 2. SignalR Hub Events
- **Hub Route**: `/hubs/security`
- **Targeting**: Hub ensures events are pushed *only* to the relevant `tenant_id` and specific connection ID (user).
- **Events**:
  - `security.loginSuspicious` - Triggered when a new login occurs that ML flags as anomalous.
    ```json
    { "messageKey": "auth.security.suspicious_login", "variables": { "ip": "1.2.3.4" } }
    ```
  - `user.sessionRevoked` - Directed strictly to the affected `userId` to forcefully log them out via SIgnalR across all active tabs.

## 3. AI Service Contract
- **Interface**:
  ```csharp
  public interface IAiRiskService 
  {
      Task<RiskAssessmentResult> EvaluateLoginRiskAsync(RiskRequestDto request, CancellationToken ct);
  }
  ```
- **Prompt Template**:
  ```text
  Evaluate login context for anomalous behavior. 
  User ID: {Request.UserId}
  Previous IP: {Request.PreviousIp}, Target IP: {Request.CurrentIp}
  Device: {Request.DeviceFingerprint}
  Tenant Code: {Request.TenantCode}
  Rule: Output strictly in JSON format containing { "RiskScore": 0-100, "Reason": "..." }.
  ```
- **Fallback**: If AI times out or throws, the `IAiRiskService` returns `{ RiskScore: 0, Reason: "AI Check Disabled" }` rather than failing the login.

## 4. Test Cases

1. **[Given] A user logs in [When] providing valid credentials but the wrong tenant code [Then] the login fails (Isolation Check)**
   - *Input*: `admin / password / wrong-tenant-code`
   - *Expected*: 401 Unauthorized, `message = "auth.login.invalid_credentials"`.

2. **[Given] A compromised session [When] the AI detects a high-risk login from a blocked IP [Then] the login succeeds but broadcasts a risk alert to the user's SignalR connection.**
   - *Input*: `admin / password` from IP `192.168.0.50`
   - *Expected*: 200 OK with `riskAlert` populated in the response payload. 

3. **[Given] An active session [When] the user's role is disabled by Tenant Admin [Then] the user receives a SignalR `user.sessionRevoked` event.**
   - *Expected*: Client automatically destroys tokens and redirects to Login Screen.

## 5. Admin API (Tenant, User, Branch) Endpoints
### `GET /api/tenants`
**Description**: Fetches a list of all tenants in the system (SuperAdmin restricted).
- **Response `200 OK`**: Array of `{ id, code, name, status, createdAt }`.

### `GET /api/users`
**Description**: Fetches users for the authenticated Tenant Code scope in headers (TenantAdmin restricted).
- **Response `200 OK`**: Array of `{ id, username, email, role, status, tenantId }`.

### `GET /api/branches`
**Description**: Fetches branches for the authenticated Tenant Code scope in headers (TenantAdmin restricted).
- **Response `200 OK`**: Array of `{ id, name, code, tenantId }`.

### `POST /api/ai/suggest-roles`
**Description**: Triggers the AI Assistant to suggest role configurations for a specified library context.
- **Request (AiRoleRequestDto)**: `{ "libraryType": "university" }`
- **Response `200 OK`**: Returns `{ "suggestion": "...", "roles": ["..."] }`

## 6. Catalog API (Books, Copies) Endpoints

### `GET /api/books`
**Description**: Fetches the catalog of books within the tenant scope.
- **Response `200 OK`**: Array of `{ id, isbn, title, author, category, totalCopies, availableCopies }`.

### `POST /api/books`
**Description**: Creates a new book record and initializes physical copies.
- **Request (BookCreateDto)**: `{ "isbn": "...", "title": "...", "author": "...", "category": "...", "copies": 1 }`
- **Response `201 Created`**: Returns defined Book aggregate root.

### `POST /api/ai/enrich-book`
**Description**: Triggers AI/OCR services to generate metadata or read cover image context.
- **Request (AiEnrichBookRequestDto)**: `{ "isbn": "...", "title": "..." }`
- **Response `200 OK`**: Returns `{ "description": "...", "suggestedCategories": ["..."], "tags": ["..."] }`

### `GET /api/books/search`
**Description**: Advanced search with filtering.
- **Request Parameters**: `?q=...&category=...&branch=...`
- **Response `200 OK`**: Search result array with items and metadata.

### `POST /api/ai/search`
**Description**: Semantic Vector Search via AI Embedding.
- **Request (AiSearchRequestDto)**: `{ "query": "..." }`
- **Response `200 OK`**: Array of matched items `{ "book": {...}, "matchReason": "...", "confidence": 0.95 }`.

## 7. Circulation API Endpoints

### `POST /api/loans/check-out`
**Description**: Processes a book check-out to a user. Validates limits and availability.
- **Request (CheckOutDto)**: `{ "userId": "...", "copyId": "..." }`
- **Response `201 Created`**: Returns created `Loan` object.

### `POST /api/loans/check-in`
**Description**: Returns a book, updates inventory, and assesses fines if overdue.
- **Request (CheckInDto)**: `{ "copyId": "..." }`
- **Response `200 OK`**: Returns `{ "loan": {...}, "fine": 50000 }`.

### `GET /api/loans/active`
**Description**: Retrieve current active loans for the tenant scope.
- **Response `200 OK`**: Array of active `Loan` objects.

### `POST /api/ai/circulation-insight`
**Description**: AI-driven analysis of user loan history to suggest actions or predict churn/late risks.
- **Request (AiInsightDto)**: `{ "userId": "..." }`
- **Response `200 OK`**: Returns `{ "insight": "...", "riskLevel": "Low|Medium|High", "suggestedActions": ["..."] }`

## 8. Admin, Catalog, & Circulation API Test Cases

4. **[Given] A Super Admin [When] requesting the tenants list [Then] they receive a full array of all tenants.**
5. **[Given] A Tenant Admin of "Lib 1" [When] they request users [Then] the backend successfully restricts to users matching the TenantCode header scope.**
6. **[Given] A user using the Role Configurator [When] selecting University context [Then] the AI successfully generates Student, Staff, and Faculty roles.**
7. **[Given] A Librarian [When] creating a book with duplicate ISBN [Then] the system returns 409 Conflict with duplicate_isbn error code.**
8. **[Given] A new book submission [When] the copies count is 300 [Then] the backend correctly generates 300 physical book copy records linked to the catalog entry.**
9. **[Given] Valid ISBN sent to AI endpoint [When] AI service responds [Then] the system returns generated description and categories mapped to the DTO.**
10. **[Given] A user executing a semantic search "Java books" [When] the API answers [Then] books mapping closely to programming/java are returned even if keyword matching fails.**
11. **[Given] A user fetching standard search results [When] providing a query with 3+ characters [Then] debounce successfully limits calls and standard catalog data applies.**
12. **[Given] A librarian checks out an unavailable book [When] calling `api/loans/check-out` [Then] API rejects with 400 Bad Request and availability rule error.**
13. **[Given] An overdue book is checked in [When] calling `api/loans/check-in` [Then] backend correctly calculates fine amount and returns it in the response.**
14. **[Given] A user ID sent to AI insight generator [When] loan history is analyzed [Then] suggestions like "Limit renewals" or "Send reminder SMS" are accurately returned.**
