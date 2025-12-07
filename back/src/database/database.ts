import { DatabaseSync } from "node:sqlite";

export let db: DatabaseSync;

export async function initDatabase() {
  db = new DatabaseSync("./database.db");

  return db;
}
