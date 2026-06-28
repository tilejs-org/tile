import { performance } from "node:perf_hooks";
import { Schema, Database } from "../../packages/database/dist/index.js";

interface BenchmarkUser {
  _id?: string;
  email: string;
  visits?: number;
}

const DOCUMENTS = 10_000;
const RUNS = 10;

const schema = new Schema<BenchmarkUser>({
  email: { type: String },
  visits: { type: Number, default: 0 },
});

const db = new Database({
  dbName: "tile-benchmark",
  logger: {
    enabled: false,
  },
});

const Users = db.collection<BenchmarkUser>("users", schema);

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function format(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

async function cleanup(): Promise<void> {
  const users = await Users.find();

  for (const user of users) {
    await Users.deleteOne({
      _id: user._id,
    });
  }
}

async function benchmarkCreate(): Promise<number> {
  const start = performance.now();

  for (let i = 0; i < DOCUMENTS; i++) {
    await Users.create({
      email: `user-${i}@benchmark.dev`,
    });
  }

  return performance.now() - start;
}

async function benchmarkFind(): Promise<number> {
  const start = performance.now();

  await Users.find();

  return performance.now() - start;
}

async function benchmarkUpdate(): Promise<number> {
  const users = await Users.find();

  const start = performance.now();

  for (const user of users) {
    await Users.updateOne(
      { _id: user._id },
      {
        $inc: {
          visits: 1,
        },
      },
    );
  }

  return performance.now() - start;
}

async function benchmarkDelete(): Promise<number> {
  const users = await Users.find();

  const start = performance.now();

  for (const user of users) {
    await Users.deleteOne({
      _id: user._id,
    });
  }

  return performance.now() - start;
}

async function run(): Promise<void> {
  await db.connect();

  const createResults: number[] = [];
  const findResults: number[] = [];
  const updateResults: number[] = [];
  const deleteResults: number[] = [];

  console.log("");
  console.log("==================================");
  console.log(" Tile Database Benchmark");
  console.log("==================================");
  console.log(`Documents: ${DOCUMENTS.toLocaleString()}`);
  console.log(`Runs: ${RUNS}`);
  console.log("");

  for (let run = 1; run <= RUNS; run++) {
    console.log(`Run ${run}/${RUNS}`);

    await cleanup();

    const create = await benchmarkCreate();
    const find = await benchmarkFind();
    const update = await benchmarkUpdate();
    const del = await benchmarkDelete();

    createResults.push(create);
    findResults.push(find);
    updateResults.push(update);
    deleteResults.push(del);

    console.log(`  Create : ${format(create)}`);
    console.log(`  Find   : ${format(find)}`);
    console.log(`  Update : ${format(update)}`);
    console.log(`  Delete : ${format(del)}`);
    console.log("");
  }

  console.log("==================================");
  console.log(" Average Results");
  console.log("==================================");

  console.log(`Create : ${format(average(createResults))}`);

  console.log(`Find   : ${format(average(findResults))}`);

  console.log(`Update : ${format(average(updateResults))}`);

  console.log(`Delete : ${format(average(deleteResults))}`);

  console.log("");
  console.log("Environment");
  console.log("----------------------------------");
  console.log(`Runtime : Bun ${Bun.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Arch    : ${process.arch}`);

  await db.disconnect();
}

run().catch(console.error);
