import * as schema from "../src/drizzleSchema.js";
import { pgGenerate } from "drizzle-dbml-generator";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdirSync } from "fs";

const execAsync = promisify(exec);
const OUTPUT_PATH = "./drizzle/generated";

async function generateDBML() {
  const dbmlFile = OUTPUT_PATH + "/schema.dbml";
  const svgFile = OUTPUT_PATH + "/erd.svg";
  const relational = true;

  // Ensure generated directory exists
  mkdirSync(OUTPUT_PATH, { recursive: true });

  console.log("🔄 Generating DBML schema...");
  pgGenerate({ schema, out: dbmlFile, relational });
  console.log("✅ Created schema.dbml");

  console.log("🎨 Generating ERD diagram...");
  try {
    await execAsync(`pnpm exec dbml-renderer -i ${dbmlFile} -o ${svgFile}`);
    console.log("✅ Created erd.svg");
    console.log("\n📁 Generated files:");
    console.log(`   - ${OUTPUT_PATH}/schema.dbml (DBML schema definition)`);
    console.log(`   - ${OUTPUT_PATH}/erd.svg (Entity Relationship Diagram)`);
  } catch (error) {
    console.error("❌ Failed to generate SVG:", error);
  }
}

generateDBML().catch(console.error);
