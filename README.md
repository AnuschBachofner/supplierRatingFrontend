# Supplier Rating Software - Frontend

![Angular](https://img.shields.io/badge/Angular-21.0.0-DD0031?style=flat&logo=angular&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952B3?style=flat&logo=bootstrap&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat&logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-20.x-339933?style=flat&logo=nodedotjs&logoColor=white)

This is the dedicated web frontend for the **Supplier Rating Software**, a specialised application designed to evaluate suppliers at a material science institution.


As a modern user interface, it communicates with the backend to display data from the [openBIS](https://openbis.ch/) data management system in a user-friendly way. 
It hides technical details and offers intuitive workflows for order rating and supplier evaluation.

---

## 1. Key Features

### 🚀 Core Functionality

* **Supplier & Order Management:** Comprehensive list views and detail pages for managing supplier and order information.
* **Interactive Rating:** User-friendly modals and forms for entering ratings (Quality, Cost, Reliability, Availability), which are sent directly to the backend for calculation.
* **Responsive Design:** Optimized display for various screen sizes thanks to Bootstrap 5 integration.

### 🛡️ Technical Highlights

* **Modern Tech Stack:** Built on Angular 21, utilizing the latest features like Standalone Components and Signals.
* **Automated API Integration:** The API client is automatically generated from the backend specification (`openapi.yaml`) using the OpenAPI Generator, guaranteeing type safety.
* **Dockerized Deployment:** Production-ready Docker image that serves the application using Nginx.

---

## 2. Technologies Used

* **Framework:** Angular 21
* **Language:** TypeScript 5.9
* **Styling:** SCSS, Bootstrap 5.3, Bootstrap Icons
* **Build Tool:** Angular CLI
* **API Client Generation:** OpenAPI Generator CLI
* **Containerization:** Docker & Nginx

---

## 3. Code Organization

The source code follows a modular structure focused on features and reusability.

```text
src/app
├── components      // Reusable UI components (Buttons, Modals, Toasts)
├── layout          // Layout wrappers (e.g., MainLayout with Sidebar/Navbar)
├── models          // TypeScript Interfaces and DTOs
├── openapi-gen     // Automatically generated API client (DO NOT edit manually)
├── openapi         // OpenAPI specification (Source for generator)
├── pages           // Main views accessed via the router
│   ├── dashboard
│   ├── login
│   ├── orders
│   └── suppliers
├── services        // Application logic and state management
└── environments    // Configuration for Dev/Prod (API URLs, etc.)
```

## 4. Authentication

The application uses a **PAT-based login flow** connecting to openBIS.

**How it works:**
1. The user enters their openBIS **username** and **Personal Access Token (PAT)**
   in the login form.
2. These are sent to the Backend, which validates the PAT against openBIS.
3. On success, the Backend returns the PAT as a Bearer token.
4. The Frontend stores this token in memory and attaches it as
   `Authorization: Bearer <PAT>` to every subsequent API request.

**How to get a PAT:**
- Log in to your openBIS instance
- Go to your profile (top right corner) → **Personal Access Tokens**
- Click **Create new token**, set an expiry date, and copy the generated token
- Use this token together with your openBIS username to log in

## 5. Contributing

First off, thank you for considering contributing to the Supplier Rating Frontend! 🚀

We welcome everyone who wants to make this project better—whether you're **fixing a bug**, **improving documentation**,
or **proposing a cool new feature**.

### 🤝 How can I contribute?

1. **Found a Bug?**
  * Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/SupplierRatingSoftware/supplierRatingFrontend/issues).
  * If not, open a new issue with a clear title and description.

2. **Have a Feature Idea?**
  * Great! We love new features. Please **open an issue first** to discuss your idea. This ensures that your feature
    fits into the architectural vision and prevents you from doing unnecessary work.

3. **Submit a Pull Request (PR)**
  * **Fork** the repository and create your branch from `main`.
  * **Code** your changes. Use `npm run lint:check` and `npm run prettier:check` to maintain code style.
  * **Test** your changes thoroughly.
  * **Submit** the PR! We will review it as soon as possible.

### 📝 Coding Guidelines

To keep the codebase clean and maintainable, please keep the following in mind:

* **Angular Best Practices:** Use Standalone Components and strict typing.
* **Commit Messages:** We prefer [Conventional Commits](https://www.conventionalcommits.org/) (e.g.,
  `feat: add supplier list`, `fix: login validation`) to keep the history readable.

Thank you for your support! ❤️

## 6. License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
