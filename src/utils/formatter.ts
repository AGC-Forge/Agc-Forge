export const normalizeScalar = (raw: string | undefined): string | undefined => {
  if (raw === undefined) return undefined;
  let v = raw.trim();
  if (v.length >= 2) {
    const first = v[0];
    const last = v[v.length - 1];
    if ((first === last && (first === '"' || first === "'" || first === '`'))) {
      v = v.slice(1, -1).trim();
    }
  }
  return v;
};

export const parseNumber = (raw: string | undefined, fallback: number): number => {
  const v = normalizeScalar(raw);
  if (v === undefined || v.length === 0) return fallback;
  const cleaned = v.replace(/[$,%_\s]/g, '').replace(/,/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
};

export const parseIntSafe = (raw: string | undefined, fallback: number): number => {
  const v = normalizeScalar(raw);
  if (v === undefined || v.length === 0) return fallback;
  const cleaned = v.replace(/[$,%_\s]/g, '').replace(/,/g, '');
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const parseBool = (raw: string | undefined, fallback: boolean): boolean => {
  const v = normalizeScalar(raw);
  if (v === undefined) return fallback;
  return v === 'true' || v === '1' || v.toLowerCase() === 'yes';
};

export const parseUserAddresses = (input: string | undefined): string[] => {
  const trimmed = normalizeScalar(input) ?? '';
  if (trimmed.length === 0) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((a) => String(a).toLowerCase().trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return trimmed
    .split(',')
    .map((a) => a.toLowerCase().trim())
    .filter(Boolean);
};

export const parseStringList = (input: string | undefined): string[] => {
  const trimmed = normalizeScalar(input) ?? '';
  if (trimmed.length === 0) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return trimmed
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};
