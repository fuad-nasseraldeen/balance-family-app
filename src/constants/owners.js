export const OWNER_DB = {
  fuad: "פואד",
  hesen: "חיסן",
  hisan: "חיסן"
};

export const OWNER_UI_TO_DB = {
  "פואד": "fuad",
  "חיסן": "hesen"
};

export const OWNER_DB_VALUES = ["fuad", "hesen"];

export function ownerDbToUi(value) {
  return OWNER_DB[value] || "פואד";
}

export function ownerUiToDb(value) {
  if (value === "fuad" || value === "hesen") return value;
  if (value === "hisan") return "hesen";
  return OWNER_UI_TO_DB[value] || "fuad";
}
