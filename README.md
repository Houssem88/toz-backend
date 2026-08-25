# TOZ Backend

## Local development

Without `DATABASE_URL`, the API uses SQLite in `data/toz.sqlite`.

```bash
npm install
npm run dev
```

The API is available at `http://127.0.0.1:3000` and the reports page at
`http://127.0.0.1:3000/reports`.

## Production

Set `DATABASE_URL` to the PostgreSQL connection string provided by Supabase.
Set `HOST=0.0.0.0` on Render so the platform can reach the server. Locally, the
server listens only on `127.0.0.1` by default.

Never commit a real `DATABASE_URL` or any other secret. Configure secrets in the
hosting provider environment settings. Base64 is only an encoding, not a
security mechanism.

```bash
npm start
```

For Render, use `npm install && npm run build` as the build command and
`npm start` as the start command.