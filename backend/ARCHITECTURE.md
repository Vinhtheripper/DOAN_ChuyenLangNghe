# Backend Architecture

## Folder layout

- `index.js`: thin entrypoint
- `src/server.js`: boot server and DB connection
- `src/app.js`: express app + middleware + route mounting
- `src/config/env.js`: environment variables
- `src/config/database.js`: MongoDB connection and collection registry
- `src/middlewares/auth.js`: auth/authorization middleware
- `src/routes/*.routes.js`: route modules by domain

## Routes split

- `products.routes.js`: products + product reviews
- `users.routes.js`: signup/login/profile/user-management
- `cart.routes.js`: cart actions
- `orders.routes.js`: orders + invoice PDF
- `feedback.routes.js`: contact/feedback
- `dashboard.routes.js`: admin dashboard stats/activities
- `blogs.routes.js`: blog CRUD/public list

## Mock data / DB setup

- `create_db.js`: recreate DB and seed mock users/blogs/contacts
- `seed_blogs.js`: blog seed data (exports `sampleBlogs`)
- `seed_contacts.js`: contact seed data (exports `sampleContacts`)
- `checkMongo.js`: verify DB data counts

## Run commands

```bash
npm run db:create
npm run db:check
npm start
```

Default DB env:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=dacsan3mien
```
