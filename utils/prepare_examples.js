// Generate the EXAMPLES file
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const EXAMPLES_DIR = path.join(__dirname, "..", "Examples");

const examples = fs.readdirSync(EXAMPLES_DIR).filter((filename) =>
  filename.endsWith(".xml")
);
const exampleIndex = examples.map((filename) =>
  `${filename}\t${filename.replace(/\.xml$/, "")}`
).join("\n");
fs.writeFileSync(path.join(EXAMPLES_DIR, "EXAMPLES"), exampleIndex);

// generate metadata files
examples.forEach((filename) => {
  const filepath = path.join(EXAMPLES_DIR, filename);
  const src = fs.readFileSync(filepath, "utf8");
  const name = filename.replace(/\.xml/, "");
  const metadata = {
    name,
    notes: extractNotes(src),
    services: extractServices(src),
    roleNames: extractRoleNames(src),
  };

  const outfile = filepath.replace(/\.xml/, ".json");
  console.log("Generated metadata for", name);
  fs.writeFileSync(outfile, JSON.stringify(metadata, null, 2));
});

function extractServices(projectXml) {
  let services = [];
  let foundRpcs = projectXml.match(
    /getJSFromRPCStruct"><l>([a-zA-Z\-_0-9]+)<\/l>/g,
  );
  if (foundRpcs) {
    foundRpcs.forEach((txt) => {
      let match = txt.match(/getJSFromRPCStruct"><l>([a-zA-Z\-_0-9]+)<\/l>/);
      services.push(match[1]);
    });
  }
  return services;
}

function extractNotes(projectXml) {
  const notes = projectXml.split("<notes>")[1].split("</notes>").shift();
  return notes;
}

function extractRoleNames(projectXml) {
  let start = projectXml.indexOf('<role name="');
  const names = [];
  while (start > -1) {
    const end = projectXml.indexOf('">', start);
    const name = projectXml.substring(start, end);
    names.push(name);
    projectXml = projectXml.substring(end);
  }
  return names;
}
