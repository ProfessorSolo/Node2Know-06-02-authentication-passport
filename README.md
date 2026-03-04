# Node2Know — MongoDB & Mongoose Intro

This demo introduces **MongoDB** and **Mongoose** to the Node2Know stack, replacing static data arrays with a true persistence layer. While it utilizes **EJS** for templating, this is a purposefully **bare-bones application** designed to focus strictly on the integration of **MongoDB** (via Mongoose), **Express**, and **Node.js**.

## 🚀 Core Concepts

### 1. Schemas & Models

We use **Mongoose** to define the structure of our documents and create models to interact with the database.

- **`data/projects.js`**: Defines the `Project` schema and model.
- **`data/contacts.js`**: Defines the `Contact` schema and model.

Example Schema Definition:

```javascript
const projectSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: String,
  description: String,
  isActive: Boolean,
});

const Project = mongoose.model("Project", projectSchema);
```

### 2. Data Operations

Instead of direct database calls in the routers, we encapsulate logic in "Operations" classes (e.g., `ProjectOps`, `ContactOps`). This keeps our controllers clean and our data logic reusable.

### 3. Queries

We use Mongoose methods like `.find()`, `.findOne()`, and `.save()` to interact with MongoDB.

- **Finding all:** `Project.find({ isActive: true })`
- **Finding one:** `Project.findOne({ slug: slug })`
- **Search:** We use the `$or` operator with regex for case-insensitive searching.

---

## 🧭 Routes & Features

### Projects

- **GET `/projects`**: Lists all active projects.
  - Supports search via query string: `/projects?q=term`
  - Filters by `title` OR `description`.
- **GET `/projects/:slug`**: Displays details for a single project.

### Contact

- **GET `/contact`**: Displays the contact form.
- **POST `/contact`**: Receives form data and saves a new `Contact` document to MongoDB.

---

## 📦 Install & Run

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Configure Environment**

    Create a `.env` file in the root directory and add your MongoDB connection string.

    **Example `.env` file:**

    ```env
    MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<db-name>?retryWrites=true&w=majority
    ```

3.  **Start Server**

    ```bash
    npm run dev
    ```

4.  **Visit**
    - [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```txt
.
├── server.js            # Entry point & Database connection
├── data/
│   ├── projects.js      # Project Schema & Operations
│   └── contacts.js      # Contact Schema & Operations
├── routers/
│   ├── projectRouter.js # Project routes
│   └── contactRouter.js # Contact routes
├── views/
│   ├── project-list.ejs
│   ├── project-detail.ejs
│   └── contact.ejs
└── ...
```

---

## License

**Node2Know-LEARN-1.0**
