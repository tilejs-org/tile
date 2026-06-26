import { Database, Schema } from "../dist/index.js";

interface Member {
  _id?: string; // obrigatorio
  email: string;
  name?: string;
  verified?: boolean;
  visits?: number;
  note?: string;
}

const memberSchema = new Schema<Member>(
  {
    _id: { type: String }, // opcional (recomendado)
    email: { type: String, unique: true },
    name: { type: String, unique: true },
    verified: { type: Boolean, default: false },
    visits: { type: Number, default: 0 },
    note: { type: String },
  },
  {
    _id: true, // padrao: true (recomendado: true)
    timestamps: true, // padrao: true (recomendado: true)
    versionKey: true, // padrao: true (recomendado: true)
  },
);

/**
 * Define onde os dados serão armazenados.
 *
 * "workspace": salva em .tile/database/ na raiz do workspace/projeto.
 * "global": salva em ~/.tile/database/, tornando-os disponíveis globalmente para o usuário da máquina.
 *
 * Estrutura resultante:
 * documentos: .tile/database/<dbName>/<collection>/*.bson
 * metadados de schema: .tile/database/<dbName>/<collection>/_schema.json
 * @default "workspace"
 */
async function main(): Promise<void> {

const connection = new Database({
  dbName: "exemplo",
  storage: "workspace",
  logger: {
    enabled: true,
    colors: true,
  },
});

const database = Object.assign(connection, {
  members: connection.collection<Member>("members", memberSchema),
});

  console.log("schema:", database.members.describeSchema());

  await database.connect();
  const email = "israel@gmail.com";
  const existing = await database.members.findOne({ email });
  const member = existing
    ? existing
    : await database.members.create({
        email,
        name: "Israel",
        note: "hello",
      });

  console.log(existing ? "loaded:" : "created:", member);

  const found = await database.members.findOneByID(member._id!);
  console.log("found:", found);

  const updated = await database.members.updateOne(
    { _id: member._id },
    {
      $set: { verified: true, name: "Israel Jatobá" },
      $inc: { visits: 1 },
      $delete: ["note"],
    },
  );
  console.log("updated:", updated);
  console.log("version:", updated?.__v);

  const allMembers = await database.members.find();
  console.log("total members:", allMembers.length);

  // Delete example:
  // await database.members.deleteOne({ _id: member._id });

  await database.disconnect();
}

main();
