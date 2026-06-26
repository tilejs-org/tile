import { database } from "./database/index.js";

async function main(): Promise<void> {

  console.log("schema:", database.member.describeSchema());

  await database.connect();
  const email = "israel@gmail.com";
  const existing = await database.member.findOne({ email });
  const member = existing
    ? existing
    : await database.member.create({
        email,
        name: "Israel",
        note: "hello",
      });

  console.log(existing ? "loaded:" : "created:", member);

  const found = await database.member.findOneByID(member._id!);
  console.log("found:", found);

  const updated = await database.member.updateOne(
    { _id: member._id },
    {
      $set: { verified: true, name: "Israel Jatobá" },
      $inc: { visits: 1 },
      $delete: ["note"],
    },
  );
  console.log("updated:", updated);
  console.log("version:", updated?.__v);

  const allMembers = await database.member.find();
  console.log("total members:", allMembers.length);

  // Delete example:
  // await database.member.deleteOne({ _id: member._id });

  await database.disconnect();
}

main();