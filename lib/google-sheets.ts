import { google } from "googleapis";

export type SheetRow = Record<string, string>;

// Names of pre-existing sheets in the spreadsheet
export const SHEETS = {
  DPR_INPUT: "Input ", // Note trailing space
  ADD_HINDRANCE: "Add Hindrance",
  EDIT_HINDRANCE: "Edit Hindrance",
  MACHINERY_INPUT: "Machinery Input",
  SCHEDULES: "Schedules",
  JOB_CARD_MASTER: "Job Card Master",
  BOQ: "BOQ",
  LEGEND: "Legend",
  MACHINERY: "Machinery",
  EMPLOYEE_MASTER: "Employee Master",
  CHECKLIST_INPUT: "Checklist Input",
  REPORT: "Report",
} as const;

// In-memory cache to guarantee ultra-fast responses and prevent Vercel timeouts
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }
  return null;
}

function setInCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";

  if (privateKey) {
    privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.warn(
      `Google Sheets credentials status: Email=${!!clientEmail}, Key=${!!privateKey}, SheetId=${!!spreadsheetId}`
    );
    throw new Error(
      `Google Sheets credentials missing. Ensure GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID are set in Vercel.`
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    spreadsheetId,
    sheets: google.sheets({ version: "v4", auth }),
  };
}

/**
 * Reads rows with an optional maxRows limit to stay blazing fast.
 */
export async function readSheet(sheetName: string, maxRows?: number): Promise<SheetRow[]> {
  const cacheKey = `readSheet:${sheetName}:${maxRows || "all"}`;
  const cached = getFromCache<SheetRow[]>(cacheKey);
  if (cached) return cached;

  const { spreadsheetId, sheets } = await getSheetsClient();
  const range = maxRows ? `'${sheetName}'!A1:Z${maxRows}` : `'${sheetName}'!A1:Z`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values ?? [];
  if (rows.length <= 1) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((h) => String(h ?? "").trim());

  const result = dataRows
    .filter((row) => row && row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const rowObject: SheetRow = {};
      headers.forEach((header, index) => {
        if (header) {
          rowObject[header] = String(row[index] ?? "").trim();
        }
      });
      return rowObject;
    });

  setInCache(cacheKey, result);
  return result;
}

/**
 * Appends a new row to a pre-existing sheet matching existing headers.
 */
export async function appendToSheet(
  sheetName: string,
  entryData: Record<string, string | number>
): Promise<Record<string, string>> {
  const { spreadsheetId, sheets } = await getSheetsClient();

  // Read header row first to guarantee column positions
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!1:1`,
  });

  const headers = (headerRes.data.values?.[0] ?? []).map((h) => String(h ?? "").trim());
  if (headers.length === 0) {
    throw new Error(`Sheet '${sheetName}' does not have a header row.`);
  }

  const entryLower: Record<string, string> = {};
  for (const [k, v] of Object.entries(entryData)) {
    entryLower[k.toLowerCase().trim()] = String(v ?? "").trim();
  }

  const orderedRow = headers.map((header) => {
    const key = header.toLowerCase().trim();
    return entryLower[key] ?? "";
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetName}'`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [orderedRow],
    },
  });

  // Clear cache for this sheet
  for (const key of cache.keys()) {
    if (key.includes(sheetName)) {
      cache.delete(key);
    }
  }

  const resultObj: Record<string, string> = {};
  headers.forEach((h, i) => {
    resultObj[h] = orderedRow[i];
  });
  return resultObj;
}

// -------------------------------------------------------------
// MASTER DATA FETCHERS
// -------------------------------------------------------------

export type JobCardOption = {
  jobCardNo: string;
  siteEngineer: string;
  projectCoordinator: string;
  planningCoordinator: string;
};

export async function getJobCards(): Promise<JobCardOption[]> {
  const cacheKey = "master:jobCards";
  const cached = getFromCache<JobCardOption[]>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await readSheet(SHEETS.JOB_CARD_MASTER, 100);
    const set = new Map<string, JobCardOption>();

    for (const r of rows) {
      const jobCardNo = r["Job Card No"] || "";
      if (jobCardNo && !set.has(jobCardNo)) {
        set.set(jobCardNo, {
          jobCardNo,
          siteEngineer: r["Site Engineer"] || "",
          projectCoordinator: r["Project Co-Ordinator"] || "",
          planningCoordinator: r["Planning Co-Ordinator"] || "",
        });
      }
    }

    const result = Array.from(set.values());
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error reading Job Card Master:", error);
    return [];
  }
}

export type BoqOption = {
  lineCode: string;
  itemDescription: string;
  jobCard: string;
  clientName: string;
  totalQty: string;
  balanceQty: string;
};

export async function getBoqItems(filterJobCard?: string): Promise<BoqOption[]> {
  const cacheKey = `master:boq:${filterJobCard || "all"}`;
  const cached = getFromCache<BoqOption[]>(cacheKey);
  if (cached) return cached;

  try {
    // Read up to 2500 BOQ items for instant delivery
    const rows = await readSheet(SHEETS.BOQ, 2500);
    const items: BoqOption[] = [];

    for (const r of rows) {
      const lineCode = r["Line Code"] || "";
      const jobCard = r["Job Card"] || "";
      if (!lineCode) continue;

      if (filterJobCard && jobCard.toLowerCase() !== filterJobCard.toLowerCase()) {
        continue;
      }

      items.push({
        lineCode,
        itemDescription: r["Item Description"] || "",
        jobCard,
        clientName: r["Client Name"] || "",
        totalQty: r["Total Qty"] || "0",
        balanceQty: r["Balance Qty"] || "0",
      });
    }

    setInCache(cacheKey, items);
    return items;
  } catch (error) {
    console.error("Error reading BOQ:", error);
    return [];
  }
}

export type HindranceCategory = {
  name: string;
  department: string;
  type: string;
};

export async function getHindranceCategories(): Promise<HindranceCategory[]> {
  const cacheKey = "master:hindranceCategories";
  const cached = getFromCache<HindranceCategory[]>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await readSheet(SHEETS.LEGEND, 100);
    const set = new Map<string, HindranceCategory>();

    for (const r of rows) {
      const joinName = r["Join"] || r["Hindrance List"] || "";
      const dept = r["Department Name"] || "";
      const type = r["Hindrance Type"] || "";

      if (joinName && !set.has(joinName)) {
        set.set(joinName, {
          name: joinName,
          department: dept,
          type: type,
        });
      }
    }

    const result = Array.from(set.values());
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error reading Legend Hindrances:", error);
    return [];
  }
}

export type MachineryOption = {
  tCode: string;
  itemDescription: string;
  jobCardNo: string;
  projectName: string;
};

export async function getMachineryOptions(): Promise<MachineryOption[]> {
  const cacheKey = "master:machinery";
  const cached = getFromCache<MachineryOption[]>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await readSheet(SHEETS.MACHINERY, 500);
    const items: MachineryOption[] = [];

    for (const r of rows) {
      const tCode = r["T Code"] || "";
      if (!tCode) continue;

      items.push({
        tCode,
        itemDescription: r["Item Description"] || "",
        jobCardNo: r["Job Card No"] || "",
        projectName: r["Project Name"] || "",
      });
    }

    setInCache(cacheKey, items);
    return items;
  } catch (error) {
    console.error("Error reading Machinery:", error);
    return [];
  }
}

// -------------------------------------------------------------
// DPR LOGIC (Pre-existing Sheet: "Input ")
// -------------------------------------------------------------

export type DprPayload = {
  lineCode: string;
  itemDescription: string;
  actualQty: string | number;
  manpower: string | number;
  remark?: string;
  dateOfDpr: string;
  enteredBy: string;
  uploadDocument?: string;
  planQty?: string | number;
};

export async function recordDpr(payload: DprPayload) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

  return appendToSheet(SHEETS.DPR_INPUT, {
    "Time Stamp": timestamp,
    "Entered By": payload.enteredBy || "Site Engineer",
    "Line Code": payload.lineCode,
    "Item Description": payload.itemDescription,
    "Actual Qty": payload.actualQty,
    "Manpower": payload.manpower,
    "Remark": payload.remark || "",
    "Upload Document": payload.uploadDocument || "",
    "Plan Qty": payload.planQty || "",
    "Uploaded Document": payload.uploadDocument || "",
    "Date Of DPR": payload.dateOfDpr,
  });
}

export async function fetchDprEntries(limit = 100) {
  const rows = await readSheet(SHEETS.DPR_INPUT, limit);
  // Return the most recent entries
  return rows.slice(-limit).reverse().map((r, index) => ({
    id: `dpr-${index}`,
    timestamp: r["Time Stamp"] || "",
    date: r["Date Of DPR"] || "",
    lineCode: r["Line Code"] || "",
    itemDescription: r["Item Description"] || "",
    actualQty: r["Actual Qty"] || "0",
    manpower: r["Manpower"] || "0",
    remarks: r["Remark"] || "",
    enteredBy: r["Entered By"] || "",
    uploadDocument: r["Uploaded Document"] || r["Upload Document"] || "",
  }));
}

// -------------------------------------------------------------
// HINDRANCE LOGIC (Pre-existing Sheet: "Add Hindrance")
// -------------------------------------------------------------

export type HindrancePayload = {
  jobCardNo: string;
  startDate: string;
  selectHindrance: string;
  remark: string;
  enteredBy: string;
  uploadDocument?: string;
  category?: string;
  subCategory?: string;
};

export async function recordHindrance(payload: HindrancePayload) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const taskId = `HIN-${Math.floor(10000 + Math.random() * 90000)}`;

  let cat = payload.category || "";
  let subCat = payload.subCategory || "";
  if (!cat && payload.selectHindrance.includes("-")) {
    const parts = payload.selectHindrance.split("-");
    cat = parts[0].trim();
    subCat = parts.slice(1).join("-").trim();
  }

  return appendToSheet(SHEETS.ADD_HINDRANCE, {
    "Timestamp": timestamp,
    "Entered By": payload.enteredBy || "Site Engineer",
    "Job Card No": payload.jobCardNo,
    "Start Date": payload.startDate,
    "Select Hindrance": payload.selectHindrance,
    "Remark": payload.remark || "",
    "Upload Document": payload.uploadDocument || "",
    "Task ID": taskId,
    "Status": "Open",
    "Category": cat,
    "Sub Category": subCat,
  });
}

export async function fetchHindranceEntries(limit = 100) {
  const rows = await readSheet(SHEETS.ADD_HINDRANCE, limit);
  return rows.slice(-limit).reverse().map((r, index) => ({
    id: r["Task ID"] || `hin-${index}`,
    timestamp: r["Timestamp"] || "",
    startDate: r["Start Date"] || "",
    jobCardNo: r["Job Card No"] || "",
    hindrance: r["Select Hindrance"] || "",
    category: r["Category"] || "",
    subCategory: r["Sub Category"] || "",
    remarks: r["Remark"] || "",
    status: r["Status"] || "Open",
    enteredBy: r["Entered By"] || "",
    uploadDocument: r["Upload Document"] || "",
  }));
}

// -------------------------------------------------------------
// MACHINERY & MANPOWER LOGIC (Pre-existing Sheet: "Machinery Input")
// -------------------------------------------------------------

export type MachineryPayload = {
  date: string;
  jobCardNo: string;
  tCode: string;
  itemDescription: string;
  currentActual: string | number;
  planQty?: string | number;
  remark?: string;
};

export async function recordMachineryInput(payload: MachineryPayload) {
  const timestamp = new Date().toISOString();

  return appendToSheet(SHEETS.MACHINERY_INPUT, {
    "Timestamp": timestamp,
    "Date": payload.date,
    "T Code": payload.tCode,
    "Item Description": payload.itemDescription,
    "Current Actual": payload.currentActual,
    "Plan Qty": payload.planQty || "0",
    "Remark": payload.remark || "",
    "Job Card No": payload.jobCardNo,
  });
}

export async function fetchMachineryEntries(limit = 100) {
  const rows = await readSheet(SHEETS.MACHINERY_INPUT, limit);
  return rows.slice(-limit).reverse().map((r, index) => ({
    id: `mach-${index}`,
    timestamp: r["Timestamp"] || "",
    date: r["Date"] || "",
    jobCardNo: r["Job Card No"] || "",
    tCode: r["T Code"] || "",
    itemDescription: r["Item Description"] || "",
    currentActual: r["Current Actual"] || "0",
    planQty: r["Plan Qty"] || "0",
    remarks: r["Remark"] || "",
  }));
}

// -------------------------------------------------------------
// SCHEDULES LOGIC (Pre-existing Sheet: "Schedules")
// -------------------------------------------------------------

export async function fetchScheduleEntries(limit = 150) {
  const rows = await readSheet(SHEETS.SCHEDULES, limit);
  return rows.slice(0, limit).map((r, index) => ({
    id: `sch-${index}`,
    jobCardNo: r["Job Card No"] || "",
    description: r["Description"] || r["Building No with Phase No"] || "Milestone",
    status: r["Schedule Status"] || r["Status (Running)"] || "Active",
    totalQty: r["Total Qty"] || "0",
    actualQty: r["Actual Qty"] || "0",
    percentActual: r["% Of Actual"] || "0",
    planStartDate: r["Plan Start Date"] || "",
    actualStartDate: r["Actual Start Date"] || "",
    planEndDate: r["Plan End Date"] || "",
    actualEndDate: r["Actual End Date"] || "",
    remark: r["Remark for Start"] || r["Remark for End"] || "",
  }));
}
