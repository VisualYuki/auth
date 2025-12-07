import { DatabaseSync } from "node:sqlite";
import { hashService } from "../src/service/hash";

async function addUser(login: string, password: string) {
  // Открываем базу данных
  const db = new DatabaseSync("../database.db");

  // Генерируем хэш пароля
  const hashedPassword = await hashService.hash(password);

  // Вставляем пользователя в таблицу
  db.prepare("INSERT INTO auth (login, password) VALUES (?, ?)").run(
    login,
    hashedPassword
  );

  console.log(`Пользователь ${login} успешно добавлен!`);
  console.log(`Хэш пароля: ${hashedPassword}`);

  db.close();
}

// Использование:
// node -r ts-node/register src/scripts/add-user.ts
const login = process.argv[2];
const password = process.argv[3];

if (!login || !password) {
  console.error(
    "Использование: ts-node src/scripts/add-user.ts <login> <password>"
  );
  process.exit(1);
}

addUser(login, password).catch(console.error);
