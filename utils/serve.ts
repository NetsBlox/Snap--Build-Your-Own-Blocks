import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import express from "express";
import morgan from "morgan";
import mustache from "mustache";
import type { ProjectMetadata } from "netsblox-cloud-client/src/types/ProjectMetadata";
import { resultify } from "./resultify.ts";

type ViewType = {
    TITLE: string;
    DESCRIPTION: string;
    CLOUD: string;
    IS_DEV_MODE: boolean;
    IMAGE?: { width: number; height: number; url: string };
};

const EXAMPLE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

const THUMBNAIL_CACHE: Record<string, Buffer<ArrayBuffer>> = {};

const ROOT_DIR = path.join(import.meta.dirname, "../");

const DEFAULTS = {
    NB_CLOUD_URL: "https://cloud.netsblox.org",
    NB_ALLOWED_CLOUDS: ["https://cloud.netsblox.org"],
    NB_BROWSER_URL: "https://editor.netsblox.org",
    NB_MODE: "development",
    NB_PORT: "8000",
    NB_EXAMPLES_DIR: path.join(ROOT_DIR, "Examples"),
    NB_MAX_BUG_REPORTS: 500,
    NB_BUG_DIR: path.join(ROOT_DIR, "bugs"),
};

const NB_ALLOWED_CLOUDS =
    process.env.NB_ALLOWED_CLOUDS?.split(",")
        .map((str) => str.trim())
        .filter(Boolean) || DEFAULTS.NB_ALLOWED_CLOUDS;

const NB_MAX_BUG_REPORTS =
    parseInt(`${process.env.NB_MAX_BUG_REPORTS}`, 10) ||
    DEFAULTS.NB_MAX_BUG_REPORTS;

const NB_BROWSER_URL = process.env.NB_BROWSER_URL || DEFAULTS.NB_BROWSER_URL;
const NB_EXAMPLES_DIR = process.env.NB_EXAMPLES_DIR || DEFAULTS.NB_EXAMPLES_DIR;
const NB_BUG_DIR = process.env.NB_BUG_DIR || DEFAULTS.NB_BUG_DIR;
fs.mkdirSync(NB_BUG_DIR, { recursive: true });

const TEMPLATE_PATH = path.join(ROOT_DIR, "index.mustache");
const TEMPLATE = fs.readFileSync(TEMPLATE_PATH).toString();
mustache.parse(TEMPLATE);

function getDefaultView(req: express.Request): ViewType {
    const cloud =
        typeof req.query.cloud === "string" &&
        NB_ALLOWED_CLOUDS.includes(req.query.cloud)
            ? req.query.cloud
            : undefined;
    return {
        TITLE: "NetsBlox",
        DESCRIPTION: "A NetsBlox App!",
        CLOUD: cloud || process.env.NB_CLOUD_URL || DEFAULTS.NB_CLOUD_URL,
        IS_DEV_MODE: process.env.NODE_ENV !== "production",
        IMAGE: undefined,
    };
}

async function getProjectView(req: express.Request) {
    const { cloud, Username, ProjectName } = req.query;
    if (typeof Username !== "string") {
        return getDefaultView(req);
    } else if (typeof ProjectName !== "string") {
        return getDefaultView(req);
    } else if (typeof cloud !== "string") {
        return getDefaultView(req);
    } else if (!NB_ALLOWED_CLOUDS.includes(cloud)) {
        const warn = `cloud url not in allow list: ${cloud}`;
        console.warn(warn);
        return getDefaultView(req);
    }
    const endpoint = `${cloud}/projects/user/${encodeURIComponent(Username)}/${encodeURIComponent(ProjectName)}/metadata`;
    const uri = encodeURI(endpoint);
    const fetching = await resultify(fetch(uri));
    if (!fetching.ok) {
        const warn = `Failed to fetch project metadata from ${cloud}: ${fetching.e.message}`;
        console.warn(warn);
        return getDefaultView(req);
    }
    const rsp = fetching.value;
    if (!rsp.ok) {
        const warn = `fetching project metadata returned ${rsp.status} from ${cloud}`;
        console.warn(warn);
        rsp.text()
            .then((text) => console.warn(`${warn}: ${text}`))
            .catch(() => console.warn(warn));
        return getDefaultView(req);
    }
    const parsing = await resultify<ProjectMetadata>(rsp.json());
    if (!parsing.ok) {
        const warn = `Failed to parse project metadata from ${cloud}: ${parsing.e.message}`;
        console.warn(warn);
        return getDefaultView(req);
    }
    const project = parsing.value;
    const imageUrl = `${cloud}/projects/id/${project.id}/thumbnail?aspectRatio=1.91`;
    const image = { url: imageUrl, width: 640, height: 480 };
    return { ...getDefaultView(req), TITLE: project.name, IMAGE: image };
}

async function getExampleView(req: express.Request) {
    const name = req.query.ProjectName;
    if (typeof name !== "string" || !EXAMPLE_NAME_REGEX.test(name)) {
        const warn = `Failed to get example: Missing or malformed example name: ${req.query.ProjectName}`;
        console.warn(warn);
        return getDefaultView(req);
    }
    const file = path.join(NB_EXAMPLES_DIR, `${name}.xml`);
    const accessing = await resultify(fsp.access(file));
    if (!accessing.ok) {
        const warn = `Failed to get example: accessing failed for ${file}: ${accessing.e.message}`;
        console.warn(warn);
        return getDefaultView(req);
    }
    const imageUrl = `${NB_BROWSER_URL}/thumbnails/${name}`;
    const image = { url: imageUrl, width: 640, height: 480 };
    return { ...getDefaultView(req), TITLE: name, IMAGE: image };
}

const app = express();

app.use(morgan("tiny"));

app.get(["/", "/index.html"], async (req, res) => {
    const { action } = req.query;
    if (action === "present") {
        const view = await getProjectView(req);
        const html = mustache.render(TEMPLATE, view);
        return res.type("html").send(html);
    } else if (action === "example") {
        const view = await getExampleView(req);
        const html = mustache.render(TEMPLATE, view);
        return res.type("html").send(html);
    } else {
        const view = getDefaultView(req);
        const html = mustache.render(TEMPLATE, view);
        return res.type("html").send(html);
    }
});

app.get("/thumbnails/:exampleName", async (req, res) => {
    const name = req.params.exampleName;
    if (!EXAMPLE_NAME_REGEX.test(name)) {
        const warn = `Failed to validate example name: ${name}`;
        console.warn(warn);
        return res.status(400).send("Thumbnail not found");
    }
    if (THUMBNAIL_CACHE[name] !== undefined) {
        const buffer = THUMBNAIL_CACHE[name];
        return res.type("png").send(buffer);
    }
    const file = path.join(NB_EXAMPLES_DIR, `${name}.xml`);
    const reading = await resultify(fsp.readFile(file, "utf8"));
    if (!reading.ok) {
        const warn = `Failed to get example thumbnail: reading failed for ${file}: ${reading.e.message}`;
        console.warn(warn);
        return res.status(404).send("Thumbnail not found");
    }
    const example = reading.value;
    const marker = "<thumbnail>data:image/png;base64,";
    const markerIndex = example.indexOf(marker);
    if (markerIndex === -1) {
        const warn = `Failed to get example thumbnail: failed to find start of substring from (${markerIndex})`;
        console.warn(warn);
        return res.status(404).send("Thumbnail not found");
    }
    const start = markerIndex + marker.length;
    const end = example.indexOf("</thumbnail>", start);
    if (end === -1) {
        const warn = `Failed to get example thumbnail: failed to find substring from (${start}) to (${end})`;
        console.warn(warn);
        return res.status(404).send("Thumbnail not found");
    }
    const thumbnail = example.substring(start, end);
    const buffer = Buffer.from(thumbnail, "base64");
    THUMBNAIL_CACHE[name] = buffer;
    return res.type("png").send(buffer);
});

app.use("/bugs/", express.json({ limit: "10mb" }));
app.use(((err, _req, res, next) => {
    if (err?.type === "entity.too.large") {
        res.status(413).send("Bug report too large. Please reduce the size.");
    } else {
        console.warn(err);
        next(err);
    }
}) as express.ErrorRequestHandler);

app.post("/bugs/", async (req, res) => {
    const report = JSON.stringify(req.body);
    const infix = req.query.auto ? "auto" : "user";
    const filename = `${Date.now()}-${infix}-report.json`;
    const filepath = path.join(NB_BUG_DIR, filename);
    const writing = await resultify(fsp.writeFile(filepath, report));
    if (!writing.ok) {
        const warn = `Failed to write bug report file: ${writing.e.message}`;
        console.warn(warn);
        return res.status(500).send("Failed to save bug report");
    }
    const listing = await resultify(fsp.readdir(NB_BUG_DIR));
    if (!listing.ok) {
        const warn = `Failed to read bug directory for cleaning: ${listing.e.message}`;
        console.warn(warn);
        return res.status(200).end();
    }
    const reports = listing.value;

    if (reports.length <= NB_MAX_BUG_REPORTS) {
        return res.status(200).end();
    }
    const overflow = reports.length - NB_MAX_BUG_REPORTS;
    const promises = reports
        .sort()
        .slice(0, overflow)
        .map((filename) => path.join(NB_BUG_DIR, filename))
        .map((filepath) => fsp.rm(filepath, { force: true }));
    const removing = await resultify(Promise.all(promises));
    if (!removing.ok) {
        const warn = `Failed to remove bug report files: ${removing.e.message}`;
        console.warn(warn);
    }
    return res.status(200).end();
});

app.use(express.static(ROOT_DIR));

const port = parseInt(process.env.NB_PORT || DEFAULTS.NB_PORT, 10);

app.listen(port);
console.log(`listening to port ${port}`);
