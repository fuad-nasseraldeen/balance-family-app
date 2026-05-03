export const OWNER_DB = {
  fuad: "פואד",
  hisan: "חיסן"
};

export const OWNER_UI_TO_DB = {
  "פואד": "fuad",
  "חיסן": "hisan"
};

export const OWNER_DB_VALUES = ["fuad", "hisan"];

export function ownerDbToUi(value) {
  return OWNER_DB[value] || "פואד";
}

export function ownerUiToDb(value) {
  return OWNER_UI_TO_DB[value] || "fuad";
}
