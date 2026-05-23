# Deploy Soft Skill Dashboard

## 1. MongoDB Atlas

Create a free MongoDB Atlas cluster, then create a database user and copy the connection string.

Use these environment variables on your hosting service:

```txt
DATABASE_URL=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=soft_skill_dashboard
```

When `DATABASE_URL` exists, the backend stores users, sessions, reset codes, and assessments in MongoDB instead of `data/db.json`.

## 2. SMTP Email

For Outlook/Hotmail, use:

```txt
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@hotmail.com
SMTP_PASS=your_app_password_or_smtp_password
SMTP_FROM=your_email@hotmail.com
```

For Gmail, enable 2-step verification and create an App Password. Then use:

```txt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

For Brevo, SendGrid, Mailgun, or another SMTP provider, use their SMTP host, port, username, and password.

## 3. Render Or Railway

Create a new Node.js web service from your GitHub repository.

Use:

```txt
Build command: npm install
Start command: npm start
```

Add the environment variables from `.env.example`.

Required production variables:

```txt
DATABASE_URL=your_mongodb_atlas_connection_string
MONGODB_DB=soft_skill_dashboard
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@hotmail.com
SMTP_PASS=your_smtp_password
SMTP_FROM=your_email@hotmail.com
```

Do not commit `.env` to GitHub. Add these values in Render/Railway environment settings.

After deploy, the app will be available at the public URL provided by the hosting service.

## 4. Local Behavior

If `DATABASE_URL` is not set, the app uses `data/db.json`.

If SMTP variables are not set, password reset emails are written to `data/mailbox.json`.
