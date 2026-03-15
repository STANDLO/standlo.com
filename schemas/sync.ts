import localesRecord from "./locales.json";
import taxesRecord from "./taxes.json";
import colorsArray from "./colors.json";
import themesArray from "./theme.json";
import materialsArray from "./materials.json";
import texturesArray from "./textures.json";
import appsRecord from "./apps.json";
import modulesRecord from "./modules.json";
import rbacRecord from "./rbac.json";

import pkg from "../package.json";

// Convert locales record to a flat array and ensure all entities have an explicit 'id'
const localesArray = Object.values(localesRecord).map(locale => ({
  ...locale,
  id: locale.code
}));

// Flatten taxes record into a single array
const taxesArray = Object.values(taxesRecord).flat();

// Convert nested RBAC json into a flat array injecting the root key as 'id'
const rbacArray = Object.entries(rbacRecord).map(([roleId, perms]) => ({
  id: roleId,
  ...perms
}));

export const syncPayload = {
  system: [{ id: "version", value: pkg.version }],
  locales: localesArray,
  taxes: taxesArray,
  colors: colorsArray,
  themes: themesArray,
  materials: materialsArray,
  textures: texturesArray,
  apps: appsRecord,
  modules: modulesRecord,
  rbac: rbacArray
};

export type SyncPayload = typeof syncPayload;
