import { DatabaseSync } from "node:sqlite";

export let db: DatabaseSync;

export async function initDatabase(inMemory: boolean = false) {
  db = new DatabaseSync(inMemory ? ":memory:" : "./database.db");

  return db;
}
