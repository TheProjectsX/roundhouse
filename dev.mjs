import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const args = new Set(process.argv.slice(2));
const isBuildOnly = args.has("--build");
const isProd = args.has("--prod");
const skipBuild = args.has("--skip-build");

const services = [
    {
        name: "server",
        dir: path.join(rootDir, "server-side"),
        color: "\x1b[36m",
        devScript: "dev",
        prodScript: "start:prod",
    },
    {
        name: "client",
        dir: path.join(rootDir, "client-side"),
        color: "\x1b[35m",
        devScript: "dev",
        prodScript: "start",
    },
];

const resetColor = "\x1b[0m";
const children = [];
let shuttingDown = false;

function prefixStream(stream, label, color, target) {
    let buffer = "";
    stream.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            target.write(`${color}[${label}]${resetColor} ${line}\n`);
        }
    });
    stream.on("end", () => {
        if (buffer.length > 0) {
            target.write(`${color}[${label}]${resetColor} ${buffer}\n`);
        }
    });
}

function killChild(child) {
    if (!child.pid || child.killed) return;
    if (isWindows) {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
            stdio: "ignore",
        });
    } else {
        child.kill("SIGTERM");
    }
}

function shutdown(exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of children) {
        killChild(child);
    }
    setTimeout(() => process.exit(exitCode), 250);
}

function runCommand(service, script) {
    return new Promise((resolve, reject) => {
        const child = spawn("npm", ["run", script], {
            cwd: service.dir,
            shell: true,
            stdio: ["ignore", "pipe", "pipe"],
        });

        prefixStream(child.stdout, `${service.name}:${script}`, service.color, process.stdout);
        prefixStream(child.stderr, `${service.name}:${script}`, service.color, process.stderr);

        child.on("exit", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${service.name} (${script}) exited with code ${code ?? 1}`));
            }
        });
    });
}

async function main() {
    if (isBuildOnly || (isProd && !skipBuild)) {
        for (const service of services) {
            console.log(`${service.color}[${service.name}]${resetColor} Building...`);
            await runCommand(service, "build");
        }
        if (isBuildOnly) {
            console.log("All builds completed.");
            return;
        }
    }

    for (const service of services) {
        const script = isProd ? service.prodScript : service.devScript;
        const child = spawn("npm", ["run", script], {
            cwd: service.dir,
            shell: true,
            stdio: ["ignore", "pipe", "pipe"],
        });

        children.push(child);
        prefixStream(child.stdout, service.name, service.color, process.stdout);
        prefixStream(child.stderr, service.name, service.color, process.stderr);

        child.on("exit", (code) => {
            if (!shuttingDown) {
                console.log(`${service.color}[${service.name}]${resetColor} exited with code ${code ?? 0}`);
                shutdown(code ?? 0);
            }
        });
    }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((err) => {
    console.error(err.message);
    shutdown(1);
});
