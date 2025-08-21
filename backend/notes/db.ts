import { SQLDatabase } from "encore.dev/storage/sqldb";

export const notesDB = new SQLDatabase("notes", {
  migrations: "./migrations",
});
