// https://www.figma.com/plugin-docs/manifest/
export default {
  name: "G-code generation | GRBL/Marlin lasers",
  id: "1519595187088702528",
  networkAccess: {
    allowedDomains: ["none"],
  },
  documentAccess: "dynamic-page",
  api: "1.0.0",
  main: "plugin.js",
  ui: "index.html",
  capabilities: [],
  enableProposedApi: false,
  editorType: ["figma", "figjam"],
};
