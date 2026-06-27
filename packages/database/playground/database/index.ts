import { Database } from "../../dist/index.js"; // igual a "@tile.js/database"
import { memberSchema, type Member } from "./schema/member.js";

const connection = new Database({
  dbName: "example-project",
  storage: "workspace",
  // logger: {
  //     enabled: true,
  //     colors: true
  // }
});

export const database = Object.assign(connection, {
  member: connection.collection<Member>("members", memberSchema),
})
