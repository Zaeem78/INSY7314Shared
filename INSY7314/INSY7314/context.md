Of course. As a developer on the internal team, I will generate a comprehensive app blueprint context file. This document will serve as the single source of truth for the architecture, security, and implementation details of the International Payment System.

***

### **App Blueprint Context File: International Payment System**

**Project:** International Payment System (IPS)
**Components:** Customer Web Portal (React), Backend API, Employee Portal (Implied)
**Date:** 2023-10-27
**Author:** Internal Bank Development Team

---

### **1. System Overview & Architecture**

The International Payment System is a secure, internal web application split into two main user-facing components and a shared backend API.

*   **Customer Portal (React SPA):** Allows bank customers to register, log in, and initiate international payments.
*   **Employee Portal (Implied):** A separate, internal portal for pre-registered bank staff to verify and submit payments to SWIFT.
*   **Backend API (RESTful):** A secure server that handles business logic, data persistence, and communication between the frontend and database. This blueprint focuses on the Customer Portal and its accompanying API.

**High-Level Data Flow:**
1.  Customer registers/logs in via React App.
2.  React App makes API calls to the backend over HTTPS.
3.  Backend validates, sanitizes, and processes requests.
4.  Backend interacts with the secured database.
5.  Upon payment creation, the transaction is stored and becomes visible to the Employee Portal.
6.  Employee verifies and submits the payment to SWIFT (outside the scope of this API).

---

### **2. Detailed Component Specifications**

#### **2.1. Customer Portal (React Frontend)**

**Technology Stack:** React, React Router, Axios, Context API (for state management).

**Key Screens & Components:**

*   **Public Routes:**
    *   `LoginPage`: Form for `username`, `accountNumber`, and `password`.
    *   `RegistrationPage`: Form for `fullName`, `idNumber`, `accountNumber`, and `password`.
*   **Protected Routes (Require Authentication):**
    *   `DashboardPage`: Overview and entry point for new payments.
    *   `NewPaymentPage`: The core payment initiation form.
    *   `PaymentHistoryPage`: (Stretch Goal) List of past transactions.

**State Management:**
*   **Auth Context:** Manages user authentication state (isLoggedIn, userDetails, JWT token).
*   **Payment Context:** Manages the state of a new payment during creation.

#### **2.2. Backend API Specification**

**Technology Stack:** Node.js with Express.js, JWT for authentication, bcrypt for hashing.

**Database Models (Simplified Schema):**

*   **Table: `Users`**
    *   `id` (Primary Key, UUID)
    *   `fullName` (String, Encrypted)
    *   `idNumber` (String, Encrypted)
    *   `accountNumber` (String, Encrypted)
    *   `username` (String, Unique, Hashed for lookup)
    *   `passwordHash` (String, Hashed & Salted)
    *   `salt` (String)
    *   `createdAt` (DateTime)

*   **Table: `Payments`**
    *   `id` (Primary Key, UUID)
    *   `userId` (Foreign Key to `Users.id`)
    *   `amount` (Decimal)
    *   `currency` (String, e.g., "USD", "EUR")
    *   `paymentProvider` (String, e.g., "SWIFT")
    *   `beneficiaryAccountNumber` (String, Encrypted)
    *   `beneficiarySwiftCode` (String, Encrypted)
    *   `beneficiaryName` (String, Encrypted)
    *   `status` (String: "PENDING", "VERIFIED", "SUBMITTED", "FAILED")
    *   `createdAt` (DateTime)

---

### **3. Security Implementation & Adherence to Requirements**

This section details how each security requirement will be met.

#### **3.1. Password Security (Hashing & Salting)**

*   **Implementation:** Use the `bcrypt` library.
*   **Process:**
    1.  Upon registration, a unique `salt` is generated for each user.
    2.  The user's password is combined with the salt and hashed using a strong work factor (e.g., 12 rounds) to create the `passwordHash`.
    3.  Both the `salt` and `passwordHash` are stored in the database. The plaintext password is never stored.
    4.  During login, the provided password is combined with the stored `salt` and hashed. The resulting hash is compared to the stored `passwordHash`.

#### **3.2. Input Whitelisting with RegEx Patterns**

All API endpoints will validate incoming data against strict whitelist RegEx patterns on the backend. Frontend validation is for UX only and is not trusted.

*   **`fullName`:** `^[a-zA-Z\s\-']{2,100}$` (Allows letters, spaces, hyphens, apostrophes.)
*   **`idNumber`:** `^[a-zA-Z0-9]{5,20}$` (Alphanumeric, specific length based on national ID format.)
*   **`accountNumber`:** `^[0-9]{1,20}$` (Numeric only.)
*   **`username`:** `^[a-zA-Z0-9_]{3,20}$` (Alphanumeric and underscores.)
*   **`amount`:** `^[0-9]+(\.[0-9]{1,2})?$` (Positive decimal with up to 2 decimal places.)
*   **`currency`:** `^[A-Z]{3}$` (Exactly 3 uppercase letters.)
*   **`swiftCode`:** `^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$` (Standard SWIFT/BIC format.)
*   **`beneficiaryAccountNumber`:** `^[a-zA-Z0-9]{1,34}$` (IBAN or general international account format.)

**Example in API Route:**
```javascript
// Pseudo-code for Express.js validation middleware
const validatePaymentInput = (req, res, next) => {
  const { amount, currency, swiftCode } = req.body;

  const amountRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  const currencyRegex = /^[A-Z]{3}$/;
  const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

  if (!amountRegex.test(amount)) {
    return res.status(400).json({ error: "Invalid amount format." });
  }
  // ... validate other fields
  next();
};
```

#### **3.3. SSL/TLS Encryption (HTTPS)**

*   **Implementation:** This is enforced at the infrastructure/load balancer level.
*   **Process:**
    1.  The application will be deployed behind a reverse proxy (e.g., Nginx) or a cloud load balancer (e.g., AWS ALB).
    2.  An SSL certificate (e.g., from Let's Encrypt or the bank's internal CA) will be installed on the proxy/load balancer.
    3.  All HTTP traffic will be permanently redirected (301) to HTTPS.
    4.  The React app will only make API calls to the `https://` endpoint.

#### **3.4. Protection Against Common Attacks**

*   **SQL Injection:**
    *   **Mitigation:** Use parameterized queries or an ORM (e.g., Sequelize, Prisma). **Never** concatenate user input into SQL strings.

*   **Cross-Site Scripting (XSS):**
    *   **Mitigation:**
        *   **Backend:** Sanitize all user-generated content before storing it. Use libraries like `DOMPurify` on data before sending it to the client if needed.
        *   **Frontend (React):** React automatically escapes values in JSX, providing a built-in layer of defense.

*   **Cross-Site Request Forgery (CSRF):**
    *   **Mitigation:** Use the `SameSite=Strict` attribute on cookies. For additional security, implement anti-CSRF tokens, especially for state-changing operations like payment initiation. Since we are using JWT stored in memory (e.g., in an httpOnly cookie or React state) and not session cookies, the risk is reduced.

*   **Sensitive Data Exposure:**
    *   **Mitigation:**
        *   **Encryption at Rest:** All PII (Personally Identifiable Information) like `fullName`, `idNumber`, `accountNumber`, and payment details will be encrypted in the database using a strong encryption algorithm (e.g., AES-256). The encryption keys will be managed by a secure Key Management Service (KMS).
        *   **JWT Security:** JWTs will be signed with a strong secret (RS256) and have short expiration times. They will be transmitted over HTTPS only.

*   **Brute Force Attacks:**
    *   **Mitigation:** Implement rate limiting on the `/api/auth/login` endpoint (e.g., using `express-rate-limit`). Lock accounts after a small number of failed attempts (e.g