# Drawgether 2.0

Drawgether 2.0 is a collaborative digital art platform designed for artists to create, share, and interact in real-time. Built with a modern full-stack architecture, it focuses on community engagement and seamless artistic collaboration.

## 📋 Project Roadmap

As a solo developer, I use Trello to organize my workflow and manage the feature backlog.
**[View the Drawgether Trello Board](https://trello.com/b/aYQQtL0V/drawgether)**

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Language:** TypeScript/JavaScript

## ⚙️ Setup & Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/lukaarakic/drawgether_2.0.git
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and add your PostgreSQL connection string:

    ```env
    DATABASE_URL="your_postgresql_url_here"
    JWT_SECRET="your_jwt_secret"
    OPENAI_API_KEY="your_openai_api_key"
    ```

4.  **Database Sync:**

    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
