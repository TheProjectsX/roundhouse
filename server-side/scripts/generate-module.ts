const { exec } = require("child_process");

let moduleName = process.argv[2];

if (!moduleName) {
    console.error(
        "❌ Please provide a module name. Example: npm run cModule Investor",
    );
    process.exit(1);
}

try {
    ["npx nest g mo", "npx nest g co", "npx nest g s"].map((cmd) =>
        exec(`${cmd} ${moduleName.toLowerCase()} --no-spec`),
    );
    console.log(`✅ Generated: ${moduleName}`);
} catch (err) {
    console.error(err);
}
