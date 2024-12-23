# Announcements Bot

### Setting Up Supabase

> Running Supabase locally requires the installation of [Docker Desktop](https://docs.docker.com/desktop)

1. Run `npx supabase start` to install the Docker images and containers for the project
2. Once the project is running, it will output a list of URLs and keys for your local environment.
3. Run `yarn generate` to generate a types file for your local database
4. When you are done with local development, you can run `npx supabase db stop` to stop all Supabase Docker containers currently running.

You can learn more about Supabase from their [documentation](https://supabase.com/docs)

#### Supabase Migrations

If you need to make changes to the database, you can do so in the local Supabase studio and then create a migration with `npx supabase db diff -f <migration_name>`. This will create a file in `./supabase/migrations`, which will be deployed to production when merged into the main branch.

If there are new migrations in the repo, you can apply them to your local database with `npx supabase migration up`
