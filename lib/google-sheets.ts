import { google } from "googleapis";

export type ScheduleStatus = "Not Started" | "In Progress" | "Completed" | "Delayed";

export type ScheduleEntry = {
  milestone: string;
  startDate: string;
  endDate: string;
  contractor: string;
  status: ScheduleStatus;
  notes?: string;
};

const SHEET_NAME = "Schedule";
const SHEET_HEADERS = [
  "milestone",
  "startDate",
  "endDate",
  "contractor",
  "status",
  "notes",
] as const;

const STATUS_OPTIONS: ScheduleStatus[] = [
  "Not Started",
  "In Progress",
  "Completed",
  "Delayed",
];

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

export function validateScheduleEntry(payload: Partial<ScheduleEntry>): ScheduleEntry {
  const milestone = normalizeText(payload.milestone);

  if (!milestone) {
    throw new Error("Milestone name is required.");
  }

  const rawStatus = normalizeText(payload.status, "Not Started");
  const status: ScheduleStatus = STATUS_OPTIONS.includes(rawStatus as ScheduleStatus)
    ? (rawStatus as ScheduleStatus)
    : "Not Started";

  return {
    milestone,
    startDate: normalizeText(payload.startDate),
    endDate: normalizeText(payload.endDate),
    contractor: normalizeText(payload.contractor, "Unassigned"),
    status,
    notes: normalizeText(payload.notes),
  };
}

async function getSheetsClient() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
    
    // Properly format the private key to handle Vercel environment variables escaping issues
    if (privateKey) {
      privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    }
    
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.warn("⚠️ Google Sheets credentials are not fully configured in environment variables.");
      throw new Error(`Google Sheets credentials are missing: Email=${!!clientEmail}, Key=${!!privateKey}, SheetId=${!!spreadsheetId}`);
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
  } catch (error) {
    console.error("🚨 Error initializing Google Sheets client:", error);
    throw error;
  }
}

export async function ensureSheet(sheetName: string, headers: readonly string[]) {
  const { spreadsheetId, sheets } = await getSheetsClient();

  const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles =
    sheetInfo.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? [];

  if (!existingTitles.includes(sheetName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
  }

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  const existingHeader = headerResponse.data.values?.[0] ?? [];
  const hasHeader = existingHeader.some(
    (cell) => String(cell).trim().toLowerCase() === String(headers[0]).trim().toLowerCase(),
  );

  if (!hasHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(64 + Math.max(headers.length, 1))}1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [Array.from(headers)],
      },
    });
  }

  return { spreadsheetId, sheets };
}

export async function readSheetRows(sheetName: string, headers: readonly string[]) {
  const { spreadsheetId, sheets } = await ensureSheet(sheetName, headers);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = response.data.values ?? [];
  if (rows.length <= 1) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headerMap = Object.fromEntries(
    headerRow.map((cell, index) => [String(cell).trim().toLowerCase(), index]),
  );

  return dataRows
    .map((row) => {
      const rowObject: Record<string, string> = {};
      headers.forEach((header) => {
        const key = String(header).trim().toLowerCase();
        rowObject[header] = String(row[headerMap[key]] ?? "").trim();
      });
      return rowObject;
    })
    .filter((item) => Object.values(item).some((value) => value !== ""));
}

export async function appendSheetRow(sheetName: string, headers: readonly string[], rowValues: Record<string, string>) {
  const { spreadsheetId, sheets } = await ensureSheet(sheetName, headers);
  const orderedValues = headers.map((header) => rowValues[header] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: {
      values: [orderedValues],
    },
  });

  return orderedValues;
}

async function ensureScheduleSheet() {
  return ensureSheet(SHEET_NAME, SHEET_HEADERS);
}

export async function fetchScheduleEntries(): Promise<ScheduleEntry[]> {
  try {
    const { spreadsheetId, sheets } = await ensureScheduleSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: SHEET_NAME,
    });

    const rows = response.data.values ?? [];
    if (rows.length <= 1) {
      return [];
    }

    const [headerRow, ...dataRows] = rows;
    const headerMap = Object.fromEntries(
      headerRow.map((cell, index) => [String(cell).trim().toLowerCase(), index]),
    );

    const parsedEntries: ScheduleEntry[] = [];

    for (const row of dataRows) {
      const milestone = normalizeText(row[headerMap.milestone] ?? "");
      if (!milestone) continue;

      const statusValue = normalizeText(row[headerMap.status] ?? "Not Started");
      const safeStatus: ScheduleStatus = STATUS_OPTIONS.includes(statusValue as ScheduleStatus)
        ? (statusValue as ScheduleStatus)
        : "Not Started";

      parsedEntries.push({
        milestone,
        startDate: normalizeText(row[headerMap.startdate] ?? ""),
        endDate: normalizeText(row[headerMap.enddate] ?? ""),
        contractor: normalizeText(row[headerMap.contractor] ?? "Unassigned"),
        status: safeStatus,
        notes: normalizeText(row[headerMap.notes] ?? "") || undefined,
      });
    }

    return parsedEntries;
  } catch (error) {
    console.error("Unable to fetch schedule data from Google Sheet:", error);
    return [];
  }
}

export async function upsertScheduleEntry(payload: Partial<ScheduleEntry>) {
  const entry = validateScheduleEntry(payload);
  const { spreadsheetId, sheets } = await ensureScheduleSheet();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: SHEET_NAME,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((row, index) => {
    if (index === 0) return false;
    return String(row[0] ?? "").trim().toLowerCase() === entry.milestone.toLowerCase();
  });

  const values = [
    entry.milestone,
    entry.startDate,
    entry.endDate,
    entry.contractor,
    entry.status,
    entry.notes ?? "",
  ];

  if (rowIndex > 0) {
    const actualRowNumber = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A${actualRowNumber}:F${actualRowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [values],
      },
    });

    return entry;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: SHEET_NAME,
    valueInputOption: "RAW",
    requestBody: {
      values: [values],
    },
  });

  return entry;
}
