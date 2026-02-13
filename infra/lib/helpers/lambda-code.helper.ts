import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export function createLambdaPackage(
  mainFile: string,
  lambdaPath: string,
  outputPath: string,
) {
  console.log("Building Lambda function with UV...");

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  try {
    execSync("uv export --frozen --no-dev --no-editable -o requirements.txt", {
      cwd: lambdaPath,
      stdio: "inherit",
    });

    execSync(
      `uv pip install --no-installer-metadata \
            --no-compile-bytecode \
            --python-platform x86_64-manylinux2014 \
            --python 3.13 \
            --target ${outputPath} -r requirements.txt`,
      {
        cwd: lambdaPath,
        stdio: "inherit",
      },
    );

    fs.copyFileSync(
      path.join(lambdaPath, mainFile),
      path.join(outputPath, mainFile),
    );
  } catch (error) {
    console.error("Error building Lambda function:", error);
    throw error;
  }
}
