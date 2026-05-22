# Node.js Fastify Coding Standard with ESLint Rules

Ensuring **code quality and maintainability** in Node.js and Fastify applications requires following best practices enforced by **ESLint rules**.

This guide outlines **coding standards** with explanations, incorrect and correct examples, and why each rule is important.

---
## Table of Contents
- [1. Consistent Code Style](#[1]-consistent-code-style)
- [2. Use Arrow Functions for Callbacks](#[2]-use-arrow-functions-for-callbacks)
- [3. Avoid Callback Hell (Use Async/Await)](#[3]-avoid-callback-hell-use-async-and-await)
- [4. Use Descriptive Route Names](#[4]-use-descriptive-route-names)
- [5. Avoid Mutating Request Objects](#[5]-avoid-mutating-request-objects)
- [6. Use process.env for Configuration Variables](#[6]-use-processenv-for-configuration-variables)
- [7. Avoid Using setTimeout for Async Operations](#[7]-avoid-using-settimeout-for-async-operations)
- [8. Enforce Strict Equality (===)](#[8]-enforce-strict-equality-===)
- [9. Use .map() Instead of forEach() for Transformations](#[9]-use-.map-instead-of-foreach-for-transformations)
- [10. Always Return a Response](#[10]-always-return-a-response)
- [11. Avoid Console Logs in Production](#[11]-avoid-console-logs-in-production)
- [12. Use Named Functions for Middleware](#[12]-use-named-functions-for-middleware)
- [13. Enforce Object Property Shorthand](#[13]-enforce-object-property-shorthand)
- [14. Use const for Immutable Variables](#[14]-use-const-for-immutable-variables)
- [15. Always Use Braces for Conditionals](#[15]-always-use-braces-for-conditionals)
- [16. Ensure Proper Spacing](#[16]-ensure-proper-spacing)
- [17. Avoid Hardcoded Status Codes](#[17]-avoid-hardcoded-status-codes)
- [18. Avoid Deeply Nested Code](#[18]-avoid-deeply-nested-code)
- [19. Limit Maximum Line Length](#[19]-limit-maximum-line-length)
- [20. Use .catch() for Promises](#[20]-use-.catch-for-promises)
- [21. Avoid Using eval()](#[21]-avoid-using-eval)
- [22. Use req.query, req.params, and req.body Correctly](#[22]-use-reqquery-reqparams-and-reqbody-correctly)
- [23. Avoid Modifying Function Parameters](#[23]-avoid-modifying-function-parameters)
- [24. Use Promise.all() for Parallel Async Operations](#[24]-use-promise.all-for-parallel-async-operations)
- [25. Avoid Deeply Nested Ternary Expressions](#[25]-avoid-deeply-nested-ternary-expressions)
- [26. Use Proper Error Messages](#[26]-use-proper-error-messages)
- [27. Always Use Meaningful Variable Names](#[27]-always-use-meaningful-variable-names)
- [28. Enforce Comments for Complex Logic](#[28]-enforce-comments-for-complex-logic)
- [29. Avoid Using Deprecated APIs](#[29]-avoid-using-deprecated-apis)
- [30. Validate Input Data](#[30]-validate-input-data)
- [31. Always Close Database Connections](#[31]-always-close-database-connections)
- [32. Avoid Hardcoded Paths](#[32]-avoid-hardcoded-paths)
- [33. Limit Function Complexity](#[33]-limit-function-complexity)
- [34. Use Rate Limiting to Prevent Abuse](#[34]-use-rate-limiting-to-prevent-abuse)
- [35. Use Helmet for Security Headers](#[35]-use-helmet-for-security-headers)
- [36. Avoid Insecure JWT Secrets](#[36]-avoid-insecure-jwt-secrets)
- [37. Sanitize User Input](#[37]-sanitize-user-input)
- [38. Enforce API Versioning](#[38]-enforce-api-versioning)

## [1] Consistent Code Style

### Reason
Ensures consistency in code formatting, improving readability and maintainability.
### 🔴 Incorrect Usage:
```javascript
const fastify = require("fastify")() // ❌ Inconsistent quotes and missing semicolon

fastify.get("/ping", (request, response) =>
  {response.send({ pong: "ok" })} // ❌ Incorrect indentation and inconsistent curly brace placement
)

fastify.listen(3000, err => { if (err) throw err; console.log("Server running") }) // ❌ No proper error handling
```

### 🟢 Correct Usage:
```javascript
const fastify = require('fastify')({ logger: true }); // ✅ Consistent quotes and semicolon usage

fastify.get('/ping', (request, reply) => {
  reply.send({ pong: 'ok' }); // ✅ Proper indentation and structured response
});

fastify.listen(3000, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Server running on port 3000');
});
```

---

## [2] Use Arrow Functions for Callbacks

### Reason

Arrow functions are more concise, avoid `this` binding issues, and ensure consistency.

### 🔴 Incorrect Usage:

```javascript
fastify.get('/user', function(req, res) { // ❌ Using function expression instead of arrow function
  res.send({ user: 'John Doe' });
});
```

### 🟢 Correct Usage:
```javascript
fastify.get('/user', (req, res) => { // ✅ Arrow function used for consistency
  res.send({ user: 'John Doe' });
});
```
---
## [3] Avoid Callback Hell Use Async and Await

### Reason
Improves readability and maintainability by avoiding deeply nested callbacks.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/data', (req, res) => {
  someAsyncFunction((err, result) => {
    if (err) {
      res.send({ error: 'Failed' });
    } else {
      anotherAsyncFunction(result, (err, newData) => {
        if (err) {
          res.send({ error: 'Failed again' });
        } else {
          res.send({ data: newData });
        }
      });
    }
  });
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/data', async (req, res) => {
  try {
    const result = await someAsyncFunction();
    const newData = await anotherAsyncFunction(result);
    res.send({ data: newData });
  } catch (err) {
    res.send({ error: 'Failed' });
  }
});
```
  
---
  
## [4] Use Descriptive Route Names
  
### Reason
Improves API clarity and maintainability.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/u', (req, res) => { // ❌ Short, unclear route name
  res.send({ user: 'John Doe' });
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/user-profile', (req, res) => { // ✅ Descriptive route name
  res.send({ user: 'John Doe' });
});
```
  
---
  
## [5] Avoid Mutating Request Objects
  
### Reason
Prevents unexpected side effects that can cause bugs.
  
### 🔴 Incorrect Usage:
```javascript
fastify.addHook('preHandler', async (req, res) => {
  req.authenticated = true; // ❌ Mutating `req`
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.addHook('preHandler', async (req, res) => {
  req.locals = { authenticated: true }; // ✅ Use `req.locals` instead
});
```
  
---
  
## [6] Use process.env for Configuration Variables
  
### Reason
Prevents hardcoded secrets in code, enhancing security and maintainability.
  
### 🔴 Incorrect Usage:
```javascript
const dbPassword = '123456'; // ❌ Hardcoded credentials
```
  
### 🟢 Correct Usage:
```javascript
const dbPassword = process.env.DB_PASSWORD; // ✅ Use environment variables
```
  
---
  
## [7] Avoid Using setTimeout for Async Operations
  
### Reason
Avoids magic numbers and makes the code more configurable.
  
### 🔴 Incorrect Usage:
```javascript
setTimeout(() => {
  console.log('Done');
}, 5000); // ❌ Magic number used
```
  
### 🟢 Correct Usage:
```javascript
const TIMEOUT_DELAY = 5000; // ✅ Define as a constant
  
setTimeout(() => {
  console.log('Done');
}, TIMEOUT_DELAY);
```
  
---
  
## [8] Enforce Strict Equality ===
  
### Reason
Prevents unexpected type coercion, ensuring accurate comparisons.
  
### 🔴 Incorrect Usage:
```javascript
if (user.id == '10') { // ❌ Loose comparison
  console.log('User found');
}
```
  
### 🟢 Correct Usage:
```javascript
if (user.id === '10') { // ✅ Strict comparison
  console.log('User found');
}
```
  
---
  
## [9] Use .map Instead of forEach for Transformations
  
### Reason
`.map()` is more functional and avoids unnecessary mutation.
 
### 🔴 Incorrect Usage:
```javascript
const users = ['Alice', 'Bob', 'Charlie'];
const greetings = [];
  
users.forEach((user) => {
  greetings.push(`Hello, ${user}!`); // ❌ Unnecessary mutation
});
```
  
### 🟢 Correct Usage:
```javascript
const users = ['Alice', 'Bob', 'Charlie'];
  
const greetings = users.map((user) => `Hello, ${user}!`); // ✅ Use `.map()` for transformations
```
  
---
  
## [10] Always Return a Response
  
### Reason
Prevents hanging requests and ensures consistent API behavior.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/user', (req, res) => {
  if (req.query.id) {
    res.send({ user: 'John Doe' });
  }
  // ❌ If no `id` is provided, there is no response, leading to a hanging request
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/user', (req, res) => {
  if (!req.query.id) {
    return res.status(400).send({ error: 'ID is required' });
  }
  return res.send({ user: 'John Doe' }); // ✅ Always return a response
});

```
  
---
  
## [11] Avoid Console Logs in Production
  
### Reason
`console.log` is useful for debugging but should not be used in production. Use a proper logger.
  
### 🔴 Incorrect Usage:
```javascript
fastify.listen(3000, () => {
  console.log('Server running on port 3000'); // ❌ console.log should not be used in production
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.listen(3000, () => {
  fastify.log.info('Server running on port 3000'); // ✅ Use Fastify's built-in logger
});
```
 
---
  
## [12] Use Named Functions for Middleware
 
### Reason

Named functions make debugging easier and improve stack traces.
  
### 🔴 Incorrect Usage:
```javascript
fastify.addHook('preHandler', async function (req, res) { // ❌ Anonymous function
  req.user = await getUser(req);
});
```
  
### 🟢 Correct Usage:

```javascript
async function attachUser(req, res) { // ✅ Named function
  req.user = await getUser(req);
}
 
fastify.addHook('preHandler', attachUser);
```
  
---
  
## [13] Enforce Object Property Shorthand
  
### Reason
Reduces redundancy in object creation.
  
### 🔴 Incorrect Usage:
```javascript
const name = 'Alice';
const user = { name: name }; // ❌ Redundant property assignment
```
  
### 🟢 Correct Usage:
```javascript
const name = 'Alice';
const user = { name }; // ✅ Use property shorthand
```
  
---
  
## [14] Use const for Immutable Variables
  
### Reason
Prevents unintended variable reassignment.
  
### 🔴 Incorrect Usage:
```javascript
let fastify = require('fastify')(); // ❌ `let` used for an immutable variable
```
  
### 🟢 Correct Usage:
```javascript
const fastify = require('fastify')(); // ✅ `const` used for an immutable variable
```
  
---
  
## [15] Always Use Braces for Conditionals
  
### Reason
Improves code clarity and prevents unintended behavior.
  
### 🔴 Incorrect Usage:
```javascript
if (user.isAdmin) console.log('Admin User'); // ❌ No braces
```
 
### 🟢 Correct Usage:
```javascript
if (user.isAdmin) {
  console.log('Admin User'); // ✅ Use braces for clarity
}
```
  
---
  
## [16] Ensure Proper Spacing
  
### Reason
Improves code readability.
  
### 🔴 Incorrect Usage:
```javascript
const x=10+5; // ❌ No spacing around operators
  
if(true){ // ❌ No spacing between `if` and `(`
  console.log('Hello');
}
```
  
### 🟢 Correct Usage:
```javascript
const x = 10 + 5; // ✅ Proper spacing around operators
  
if (true) { // ✅ Proper spacing between `if` and `(`
  console.log('Hello');
}
```

---
  
## [17] Avoid Hardcoded Status Codes
  
### Reason
Magic numbers reduce code readability. Use constants for clarity.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/forbidden', (req, res) => {
  res.status(403).send({ error: 'Access Denied' }); // ❌ Magic number used
});
```
  
### 🟢 Correct Usage:
```javascript
const HTTP_STATUS = {
  FORBIDDEN: 403,
};
  
fastify.get('/forbidden', (req, res) => {
  res.status(HTTP_STATUS.FORBIDDEN).send({ error: 'Access Denied' }); // ✅ Use named constants
});
```
  
---
  
## [18] Avoid Deeply Nested Code
  
### Reason
Reduces complexity and improves readability.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/validate', (req, res) => {
  if (req.body) {
    if (req.body.email) {
      if (req.body.email.includes('@')) {
        res.send({ message: 'Valid Email' });
      } else {
        res.send({ error: 'Invalid Email' });
      }
    } else {
      res.send({ error: 'Email is required' });
    }
  } else {
    res.send({ error: 'Request body is missing' });
  }
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/validate', (req, res) => {
  if (!req.body) return res.status(400).send({ error: 'Request body is missing' });
  if (!req.body.email) return res.status(400).send({ error: 'Email is required' });
  if (!req.body.email.includes('@')) return res.status(400).send({ error: 'Invalid Email' });
  
  res.send({ message: 'Valid Email' });
});
```
  
---
  
## [19] Limit Maximum Line Length
  
### Reason
Prevents horizontal scrolling and improves readability.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/long-endpoint', (req, res) => { res.send({ message: 'This is a really long message that should not exceed the maximum line length of 80 or 100 characters' }); });
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/long-endpoint', (req, res) => {
  res.send({
    message: 'This message is properly formatted and does not exceed the recommended line length.',
  });
});
```
  
---

## [20] Use .catch for Promises
  
### Reason
Ensures proper error handling in asynchronous operations.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/fetch-data', async (req, res) => {
  const data = await fetchData(); // ❌ No error handling for rejected promise
  res.send({ data });
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/fetch-data', async (req, res) => {
  try {
    const data = await fetchData();
    res.send({ data });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch data' });
  }
});
```
  
---
  
## [21] Avoid Using eval
  
### Reason
`eval()` is a security risk as it can execute arbitrary code, leading to vulnerabilities.
  
### 🔴 Incorrect Usage:
```javascript
const userInput = 'console.log("Hello World")';
eval(userInput); // ❌ Security risk!
```
  
### 🟢 Correct Usage:
```javascript
const safeFunction = new Function('console.log("Hello World")'); // ✅ Use Function constructor if necessary
safeFunction();
```
  
---
  
## [22] Use req.query, req.params, and req.body Correctly
  
### Reason
Prevents improper data handling and ensures requests retrieve values from the correct locations.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/user', (req, res) => {
  const id = req.body.id; // ❌ `id` should come from `req.query` or `req.params`, not `req.body`
  res.send({ id });
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/user/:id', (req, res) => {
  const { id } = req.params; // ✅ Use `req.params` for route parameters
  res.send({ id });
});
```
  
---
  
## [23] Avoid Modifying Function Parameters
  
### Reason
Prevents unintended side effects when modifying function parameters.
  
### 🔴 Incorrect Usage:
```javascript
function updateUser(user) {
  user.name = 'Updated Name'; // ❌ Modifying function parameter directly
}
```
  
### 🟢 Correct Usage:
```javascript
function updateUser(user) {
  return { ...user, name: 'Updated Name' }; // ✅ Return a new object instead
}
```
  
---
  
## [24] Use Promise.all for Parallel Async Operations
  
### Reason
Ensures non-blocking execution and improves performance by running asynchronous operations in parallel.
  
### 🔴 Incorrect Usage:
```javascript
async function fetchData() {
  const result1 = await fetchUserData(); // ❌ These run sequentially
  const result2 = await fetchOrderData();
  return { result1, result2 };
}
```
  
### 🟢 Correct Usage:
```javascript
async function fetchData() {
  const [result1, result2] = await Promise.all([fetchUserData(), fetchOrderData()]); // ✅ Runs both in parallel
  return { result1, result2 };
}
```
 
---
  
## [25] Avoid Deeply Nested Ternary Expressions
  
### Reason
Enhances readability and avoids confusion.
  
### 🔴 Incorrect Usage:
```javascript
const status = user.isActive ? (user.isAdmin ? 'Admin' : 'User') : 'Inactive'; // ❌ Nested ternary expressions
```
  
### 🟢 Correct Usage:
```javascript
let status;
if (user.isActive) {
  status = user.isAdmin ? 'Admin' : 'User';
} else {
  status = 'Inactive';
} // ✅ Improved readability with an explicit structure
```
  
---
  
## [26] Use Proper Error Messages
  
### Reason
Ensures meaningful error messages for debugging.
  
### 🔴 Incorrect Usage:
```javascript
fastify.get('/error', async (req, res) => {
  throw 'Something went wrong'; // ❌ Throwing a string is bad practice
});
```

### 🟢 Correct Usage:
```javascript
fastify.get('/error', async (req, res) => {
  throw new Error('Something went wrong'); // ✅ Use Error objects for meaningful error messages
});
```
---

## [27] Always Use Meaningful Variable Names
### Reason
Improves code readability and maintainability.

### 🔴 Incorrect Usage:
```javascript
const x = getUserData(); // ❌ Variable name `x` is not meaningful
```
  
### 🟢 Correct Usage:
```javascript
const userData = getUserData(); // ✅ Use descriptive variable names
```
  
---
  
## [28] Enforce Comments for Complex Logic
  
### Reason
Helps in documentation and understanding of complex code.
  
### 🔴 Incorrect Usage:
```javascript
function calculateDiscount(price, discountRate) {
  return price - price * discountRate; // ❌ No explanation for formula
}
```
  
### 🟢 Correct Usage:
```javascript
/**
 * Calculates the final price after applying a discount.
 * @param {number} price - The original price of the product.
 * @param {number} discountRate - The discount rate as a decimal (e.g., 0.2 for 20%).
 * @returns {number} - The final price after discount.
 */
function calculateDiscount(price, discountRate) {
  return price - price * discountRate;
} // ✅ Clear explanation through comments
```
 
---
 
## [29] Avoid Using Deprecated APIs
  
### Reason
Prevents usage of outdated or removed Node.js APIs.
  
### 🔴 Incorrect Usage:
```javascript
const domain = require('domain'); // ❌ `domain` module is deprecated
const d = domain.create();
```
  
### 🟢 Correct Usage:
```javascript
process.on('uncaughtException', (err) => { // ✅ Use proper error handling
  console.error('Unhandled Exception:', err);
});
```
  
---
  
## [30] Validate Input Data
 
### Reason
Prevents Regular Expression Denial of Service (ReDoS) attacks.
 
### 🔴 Incorrect Usage:
```javascript
fastify.get('/search', (req, res) => {
  const regex = new RegExp(req.query.keyword); // ❌ Unsafe regex
  res.send({ result: regex.test('some text') });
});
```
  
### 🟢 Correct Usage:
```javascript
const safeRegex = /^[a-zA-Z0-9\s]+$/; // ✅ Safe regex with defined pattern
  
fastify.get('/search', (req, res) => {
  if (!safeRegex.test(req.query.keyword)) {
    return res.status(400).send({ error: 'Invalid input' });
  }
  res.send({ result: 'Valid search query' });
});
```
  
---
  
## [31] Always Close Database Connections
 
### Reason
Prevents memory leaks and database connection exhaustion.
 
### 🔴 Incorrect Usage:
```javascript
fastify.get('/data', async (req, res) => {
  const db = await getDatabaseConnection(); // ❌ Connection is not closed
  const data = await db.query('SELECT * FROM users');
  res.send(data);
});
```
  
### 🟢 Correct Usage:
```javascript
fastify.get('/data', async (req, res) => {
  const db = await getDatabaseConnection();
  try {
    const data = await db.query('SELECT * FROM users');
    res.send(data);
  } finally {
    db.close(); // ✅ Always close connections
  }
});
```
  
---
 
## [32] Avoid Hardcoded Paths
  
### Reason
Prevents errors in different environments and improves security.
  
### 🔴 Incorrect Usage:
```javascript
const filePath = __dirname + '/uploads/image.png'; // ❌ Hardcoded path concatenation
```
  
### 🟢 Correct Usage:
```javascript
const path = require('path');
const filePath = path.join(__dirname, 'uploads', 'image.png'); // ✅ Use `path.join()`
```
  
---
  
## [33] Limit Function Complexity
  
### Reason
Reduces cognitive load and improves maintainability.
  
### 🔴 Incorrect Usage:
```javascript
function processRequest(req, res) {
  if (req.body) {
    if (req.body.email) {
      if (req.body.email.includes('@')) {
        if (req.body.age > 18) {
          res.send({ message: 'Valid' });
        } else {
          res.send({ error: 'Underage' });
        }
      } else {
        res.send({ error: 'Invalid email' });
      }
    } else {
      res.send({ error: 'Missing email' });
    }
  } else {
    res.send({ error: 'Missing body' });
  }
}
```
  
### 🟢 Correct Usage:
```javascript
function validateEmail(email) {
  return email && email.includes('@');
}
  
function validateAge(age) {
  return age > 18;
}

fastify.post('/validate', (req, res) => {
  const { email, age } = req.body;

  if (!email) return res.status(400).send({ error: 'Missing email' });
  if (!validateEmail(email)) return res.status(400).send({ error: 'Invalid email' });
  if (!validateAge(age)) return res.status(400).send({ error: 'Underage' });

  res.send({ message: 'Valid' });
}); // ✅ Refactored into smaller functions
```

---

## [34] Use Rate Limiting to Prevent Abuse

### Reason
Protects APIs from excessive requests and DoS attacks.

### 🔴 Incorrect Usage:
```javascript
fastify.get('/resource', (req, res) => {
  res.send({ message: 'Unprotected endpoint' }); // ❌ No rate limiting
});
```

### 🟢 Correct Usage:
```javascript
fastify.register(require('@fastify/rate-limit'), {
  max: 10, // ✅ Allows only 10 requests per minute per IP
  timeWindow: '1 minute',
});
  
fastify.get('/resource', (req, res) => {
  res.send({ message: 'Protected endpoint' });
});
```

---

## [35] Use Helmet for Security Headers

### Reason
Prevents common security vulnerabilities.

### 🔴 Incorrect Usage:

```javascript

fastify.get('/', (req, res) => {
  res.send({ message: 'Unprotected' }); // ❌ No security headers
});
```

### 🟢 Correct Usage:
```javascript
fastify.register(require('@fastify/helmet')); // ✅ Adds security headers

fastify.get('/', (req, res) => {
  res.send({ message: 'Protected' });
});
```

---

## [36] Avoid Insecure JWT Secrets

### Reason
Prevents unauthorized access due to exposed secrets.

### 🔴 Incorrect Usage:
```javascript
const jwt = require('jsonwebtoken');
const secret = 'my-secret-key'; // ❌ Hardcoded secret

const token = jwt.sign({ user: 'admin' }, secret);
```

### 🟢 Correct Usage:
```javascript
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET; // ✅ Store secrets in environment variables

const token = jwt.sign({ user: 'admin' }, secret);
```

---

## [37] Sanitize User Input

### Reason
Prevents injection attacks (SQL, XSS, etc.).

### 🔴 Incorrect Usage:
```javascript
fastify.post('/submit', (req, res) => {
  const userInput = req.body.comment; // ❌ Unsanitized input
  res.send({ comment: userInput });
});
```

### 🟢 Correct Usage:
```javascript
const sanitizeHtml = require('sanitize-html');

fastify.post('/submit', (req, res) => {
  const userInput = sanitizeHtml(req.body.comment); // ✅ Sanitized input
  res.send({ comment: userInput });
});
```

---

## [38] Enforce API Versioning

### Reason
Allows backward compatibility for future API changes.

### 🔴 Incorrect Usage:
```javascript
fastify.get('/users', (req, res) => {
  res.send({ users: [] }); // ❌ No versioning
});
```

### 🟢 Correct Usage:
```javascript
fastify.register((instance, options, done) => {
  instance.get('/v1/users', (req, res) => {
    res.send({ users: [] });
  });
  done();
}); // ✅ API versioning for future compatibility
```

---

### **Reference Websites**
- **ESLint Rules Documentation**: [https://eslint.org/docs/latest/rules/](https://eslint.org/docs/latest/rules/)
- **Node.js Style Guide (Airbnb)**: [https://github.com/airbnb/javascript](https://github.com/airbnb/javascript)
- **OWASP Node.js Security Cheat Sheet**: [https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- **Fastify Helmet Plugin for Security Headers**: [https://github.com/fastify/fastify-helmet](https://github.com/fastify/fastify-helmet)