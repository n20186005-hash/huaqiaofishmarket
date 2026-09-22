/**
 * 東港（華僑市場）天氣資料模組。
 *
 * 資料來源為 Open-Meteo（免金鑰）：
 *  - 陸地預報 API：氣溫、體感、濕度、降水、降雨機率、風速、WMO 天氣代碼、紫外線
 *  - 海洋 API：浪高、海溫（供海邊漁港視角）
 *
 * 於預先渲染階段抓取，並以程序內快取控制頻率；頁面載入後再由前端以相同邏輯刷新。
 * 文案只描述「天氣與旅客可執行建議」，不呈現技術供應細節、不杜撰精準潮汐時間。
 */

export interface WeatherCurrent {
  /** 觀測時間（ISO 字串，含時區偏移） */
  time: string;
  /** 氣溫 ℃ */
  temperature: number | null;
  /** 體感溫度 ℃ */
  apparentTemperature: number | null;
  /** 相對濕度 % */
  humidity: number | null;
  /** 降水量 mm */
  precipitation: number | null;
  /** 風速 km/h */
  windSpeed: number | null;
  /** WMO 天氣代碼 */
  code: number | null;
  /** 是否為白天 */
  isDay: boolean;
}

export interface WeatherDay {
  /** 日期 YYYY-MM-DD */
  date: string;
  code: number | null;
  tempMax: number | null;
  tempMin: number | null;
  /** 降水量總和 mm */
  precipitationSum: number | null;
  /** 降雨機率最大值 % */
  precipitationProbability: number | null;
  /** 紫外線指數最大值 */
  uvIndex: number | null;
  /** 浪高最大值 m（海洋 API） */
  waveHeightMax: number | null;
}

export interface WeatherMarine {
  /** 觀測時間 */
  time: string;
  /** 即時浪高 m */
  waveHeight: number | null;
  /** 即時海溫 ℃ */
  seaTemp: number | null;
}

export interface WeatherSnapshot {
  current: WeatherCurrent | null;
  daily: WeatherDay[];
  marine: WeatherMarine | null;
  /** 資料抓取時間（ISO） */
  fetchedAt: string;
}

const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const MARINE_ENDPOINT = 'https://marine-api.open-meteo.com/v1/marine';
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

const memoryCache = new Map<string, { at: number; data: WeatherSnapshot }>();

export function buildForecastUrl(latitude: number, longitude: number, days = 7): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max',
    timezone: 'Asia/Taipei',
    forecast_days: String(days)
  });
  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

export function buildMarineUrl(latitude: number, longitude: number, days = 7): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'wave_height,sea_surface_temperature',
    daily: 'wave_height_max',
    timezone: 'Asia/Taipei',
    forecast_days: String(days)
  });
  return `${MARINE_ENDPOINT}?${params.toString()}`;
}

const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  // 硬逾時：DNS／連線掛起時 AbortController 可能不生效，用 Promise.race 兜底，
  // 確保即使網路完全卡死也不會讓建置無限期阻塞。
  const guard = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('weather fetch timed out')), FETCH_TIMEOUT_MS + 3000)
  );
  return Promise.race([
    fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal }).then((res) => {
      if (!res.ok) throw new Error(`weather request failed: ${res.status}`);
      return res.json();
    }),
    guard
  ]).finally(() => {
    clearTimeout(timer);
    controller.abort();
  });
}

function normalizeForecast(raw: any): { current: WeatherCurrent | null; daily: WeatherDay[] } {
  const c = raw?.current ?? null;
  const d = raw?.daily ?? null;
  const current: WeatherCurrent | null = c
    ? {
        time: String(c.time ?? ''),
        temperature: num(c.temperature_2m),
        apparentTemperature: num(c.apparent_temperature),
        humidity: num(c.relative_humidity_2m),
        precipitation: num(c.precipitation),
        windSpeed: num(c.wind_speed_10m),
        code: num(c.weather_code),
        isDay: c.is_day === 0 ? false : true
      }
    : null;

  const times: unknown[] = Array.isArray(d?.time) ? d.time : [];
  const daily: WeatherDay[] = times.map((date, i) => ({
    date: String(date),
    code: num(d?.weather_code?.[i]),
    tempMax: num(d?.temperature_2m_max?.[i]),
    tempMin: num(d?.temperature_2m_min?.[i]),
    precipitationSum: num(d?.precipitation_sum?.[i]),
    precipitationProbability: num(d?.precipitation_probability_max?.[i]),
    uvIndex: num(d?.uv_index_max?.[i]),
    waveHeightMax: null
  }));
  return { current, daily };
}

function normalizeMarine(raw: any, daily: WeatherDay[]): WeatherMarine | null {
  const c = raw?.current ?? null;
  const d = raw?.daily ?? null;
  if (!c && !d) return null;

  const marine: WeatherMarine = {
    time: String(c?.time ?? ''),
    waveHeight: num(c?.wave_height),
    seaTemp: num(c?.sea_surface_temperature)
  };

  if (Array.isArray(d?.wave_height_max)) {
    d.wave_height_max.forEach((wh: unknown, i: number) => {
      if (daily[i]) daily[i].waveHeightMax = num(wh);
    });
  }
  return marine;
}

/** 直接抓取一次資料（不經快取），供前端刷新使用。 */
export async function fetchWeather(latitude: number, longitude: number, days = 7): Promise<WeatherSnapshot> {
  const [forecast, marine] = await Promise.allSettled([
    fetchJson(buildForecastUrl(latitude, longitude, days)),
    fetchJson(buildMarineUrl(latitude, longitude, days))
  ]);

  if (forecast.status === 'rejected') throw new Error('forecast fetch failed');
  const { current, daily } = normalizeForecast(forecast.value);

  let marineData: WeatherMarine | null = null;
  if (marine.status === 'fulfilled') marineData = normalizeMarine(marine.value, daily);

  return { current, daily, marine: marineData, fetchedAt: new Date().toISOString() };
}

/** 取得天氣快照（含程序內快取；任一元件失敗時回傳上一筆或 null）。 */
export async function getWeather(latitude: number, longitude: number, days = 7): Promise<WeatherSnapshot | null> {
  const key = `${latitude},${longitude},${days}`;
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  try {
    const data = await fetchWeather(latitude, longitude, days);
    memoryCache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return cached ? cached.data : null;
  }
}

const WMO: Record<number, string> = {
  0: '晴',
  1: '晴時多雲',
  2: '多雲',
  3: '陰',
  45: '霧',
  48: '霧（有霧淞）',
  51: '輕毛毛雨',
  53: '毛毛雨',
  55: '較強毛毛雨',
  56: '輕凍毛毛雨',
  57: '凍毛毛雨',
  61: '小雨',
  63: '雨',
  65: '大雨',
  66: '輕凍雨',
  67: '凍雨',
  71: '小雪',
  73: '雪',
  75: '大雪',
  77: '米雪',
  80: '短暫陣雨',
  81: '陣雨',
  82: '強陣雨',
  85: '短暫陣雪',
  86: '強陣雪',
  95: '雷雨',
  96: '雷雨伴冰雹',
  99: '強雷雨伴冰雹'
};

/** WMO 天氣代碼轉繁體中文描述。 */
export function wmoText(code: number | null | undefined): string {
  if (code === null || code === undefined) return '暫無資料';
  return WMO[code] ?? '天氣變化';
}

/** 天氣代碼對應的天氣符號（裝飾用，搭配文字顯示）。 */
export function wmoIcon(code: number | null | undefined): string {
  if (code === null || code === undefined) return '・';
  if (code === 0) return '☀️';
  if (code === 1) return '🌤';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦';
  if (code >= 61 && code <= 67) return '🌧';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦';
  if (code >= 85 && code <= 86) return '🌨';
  return '⛈';
}

/** 風速（km/h）轉蒲福風級，缺值回傳 null。 */
export function beaufortLevel(kmh: number | null | undefined): number | null {
  if (kmh === null || kmh === undefined) return null;
  if (kmh < 1) return 0;
  if (kmh < 6) return 1;
  if (kmh < 12) return 2;
  if (kmh < 20) return 3;
  if (kmh < 29) return 4;
  if (kmh < 39) return 5;
  if (kmh < 50) return 6;
  if (kmh < 62) return 7;
  if (kmh < 75) return 8;
  return 9;
}

const LIGHT_RAIN = new Set([51, 53, 55, 56, 57, 61, 80]);
const HEAVY_RAIN = new Set([63, 65, 66, 67, 81, 82]);
const isThunder = (code: number | null | undefined) => code !== null && code !== undefined && code >= 95;
const isHeavyRain = (code: number | null | undefined) => code !== null && code !== undefined && HEAVY_RAIN.has(code);
const isLightRain = (code: number | null | undefined) => code !== null && code !== undefined && LIGHT_RAIN.has(code);

export interface WeatherAdvice {
  /** 當前天氣一句話概覽（不含建議） */
  summary: string;
  /** 出行穿搭 */
  outfit: string[];
  /** 遊玩安排（含海邊視角） */
  activity: string[];
  /** 隨身物品 */
  packing: string[];
  /** 風險提醒（紅色，有才顯示） */
  alerts: string[];
  /** 是否有風險提醒（控制紅色區塊顯示） */
  hasAlert: boolean;
}

/**
 * 依即時觀測、今日預報與海洋資料，產生旅客看得懂、可直接執行的建議。
 * 各條件獨立觸發，未命中者不進清單（動態渲染，不堆疊無關項目）。
 */
export function weatherAdvice(
  current: WeatherCurrent | null,
  today: WeatherDay | undefined,
  marine: WeatherMarine | null
): WeatherAdvice {
  const temp = current?.apparentTemperature ?? today?.tempMax ?? null;
  const tempMax = today?.tempMax ?? null;
  const tempMin = today?.tempMin ?? null;
  const uv = today?.uvIndex ?? null;
  const wind = current?.windSpeed ?? null;
  const windLv = beaufortLevel(wind);
  const pop = today?.precipitationProbability ?? null;
  const code = current?.code ?? today?.code ?? null;

  const outfit: string[] = [];
  const activity: string[] = [];
  const packing: string[] = [];
  const alerts: string[] = [];

  const thunder = isThunder(code);
  const heavy = isHeavyRain(code);
  const light = isLightRain(code);

  // ── 降水相關 ──
  if (thunder) {
    alerts.push('⚠️ 雷雨來襲：請勿登山、海邊戲水或在樹下避雨，水上活動大概率關閉。');
    activity.push('遊船、水上項目大概率關閉，建議改為室內市場與美食行程。');
    packing.push('雨衣（雷雨天不建議撐傘）。');
  } else if (heavy) {
    alerts.push('⚠️ 雨勢較強：避開山谷、低窪與臨海礁石區，留意積水與強陣風。');
    activity.push('不建議戶外遊玩，遊船、纜車可能停運；優先安排室內場館。');
    packing.push('雨衣（風大不建議長柄傘）。');
  } else if (light) {
    activity.push('有小雨、路面濕滑，走路與上下船注意防滑；露天項目體驗較差。');
    packing.push('摺疊傘。');
  } else if (pop !== null && pop >= 60) {
    outfit.push('降雨機率偏高，出門前先想好備案。');
    activity.push('優先安排室內場館，戶外爬山、海邊遊玩建議延後。');
    packing.push('雨傘或雨衣。');
  }

  // ── 高溫 & 紫外線 ──
  if (tempMax !== null && tempMax >= 32) {
    outfit.push('氣溫偏高，出門盡量避開正午時段。');
    activity.push('縮短戶外遊玩時間，多找遮蔭與室內攤位休息。');
    packing.push('防曬用品、充足飲用水與防暑小物。');
  }
  if (uv !== null && uv >= 5) {
    outfit.push('紫外線偏強，注意防曬。');
    packing.push('防曬霜、墨鏡、遮陽帽。');
  }

  // ── 低溫、降溫 ──
  if (tempMax !== null && tempMin !== null && tempMax - tempMin > 8) {
    outfit.push('晝夜溫差大，帶一件外套方便增減衣物。');
  }
  if (tempMax !== null && tempMax <= 10) {
    outfit.push('氣溫偏低，做好防寒。');
    packing.push('厚外套、圍巾。');
  }

  // ── 風力 ──
  if (windLv !== null && windLv >= 7) {
    alerts.push('⚠️ 強風等級：遠離廣告招牌與海邊礁石，海上項目大概率關閉。');
    activity.push('海邊遊船、部分露天設施可能停航停運。');
  } else if (windLv !== null && windLv >= 5) {
    outfit.push('風力偏大，帽子容易被吹落。');
    activity.push('海邊遊船、部分露天遊樂設施可能停航停運。');
    packing.push('不建議穿寬鬆長裙；固定好帽子與輕物。');
  }

  // ── 晴天 / 陰天（降雨機率偏高時不輸出強戶外建議，避免與帶傘／延後矛盾）──
  if ((code === 0 || code === 1) && (pop === null || pop < 60)) {
    activity.push('天氣晴好，適合戶外遊覽與看日出、夕陽。');
    packing.push('記得防曬。');
  } else if (code === 3 && (pop === null || pop < 60)) {
    activity.push('光線柔和很適合拍照，無暴晒、適合長時間戶外逛遊。');
  }

  // ── 霧 / 霾 ──
  if (code === 45 || code === 48) {
    alerts.push('⚠️ 濃霧：能見度差，渡輪、航班容易延誤，不適合看海看山。');
    packing.push('口罩。');
  }

  // ── 海邊視角（東港為臨海漁港）──
  const wave = marine?.waveHeight ?? null;
  if (wave !== null) {
    const rough = wave > 1.5 || (windLv !== null && windLv >= 7) || thunder;
    const calm = wave <= 1.0 && !light && !heavy && !thunder && (windLv === null || windLv < 5);
    if (rough) {
      activity.push('浪高與風勢偏大，不建議下水、踩礁石或前往潮間帶；船班可能停航。');
    } else if (calm) {
      activity.push('海況平穩，可海邊散步拍照；趕海請先查當地潮汐表，並注意礁石濕滑。');
    } else {
      activity.push('海邊活動留意即時浪況與礁石濕滑，下水前先看現場公告。');
    }
  }

  // ── 當前天氣概覽 ──
  const parts: string[] = [];
  if (code !== null) parts.push(wmoText(code));
  if (tempMax !== null && tempMin !== null) parts.push(`${fmt(tempMax, '°')}–${fmt(tempMin, '°')}`);
  else if (temp !== null) parts.push(fmt(temp, '°'));
  if (pop !== null) parts.push(`降雨機率 ${Math.round(pop)}%`);
  if (windLv !== null) parts.push(`${windLabel(wind)}（${windLv} 級）`);
  const summary = parts.length ? parts.join('・') : '暫無資料';

  return { summary, outfit, activity, packing, alerts, hasAlert: alerts.length > 0 };
}

const LUNAR_MONTH = 29.530588853;
/** 已知朔日基準（UTC），用於推算月相。 */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

export interface TideInfo {
  /** 潮汐類型描述 */
  type: string;
  /** 大潮 / 中潮 / 小潮 */
  springNeap: '大潮' | '中潮' | '小潮';
  /** 今日兩次高潮（HH:MM，天文潮預估） */
  highTides: string[];
  /** 趕海時機強度提示 */
  harvestHint: string;
}

/** 由絕對時間推算月相（距朔日天數與照明度）。 */
export function lunarPhase(date: Date): { phaseDay: number; illumination: number } {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const phaseDay = ((days % LUNAR_MONTH) + LUNAR_MONTH) % LUNAR_MONTH;
  const illumination = 0.5 * (1 - Math.cos((2 * Math.PI * phaseDay) / LUNAR_MONTH));
  return { phaseDay, illumination };
}

/**
 * 東港（臺灣海峽南端）半日潮近似模型。
 * 僅為天文潮預估：未含地形、風暴潮與氣象修正；精確潮時潮高請以官方潮汐表為準。
 * 大潮落在朔／望前後（距朔望約 0–3 天），小潮落在上／下弦前後（約 5–7 天）。
 * 半日潮高潮間隔約 12h25m，且每日高潮時間隨月相遞延約 50 分鐘。
 */
export function tideModel(date: Date): TideInfo {
  const { phaseDay } = lunarPhase(date);
  const half = LUNAR_MONTH / 2;
  const distToSpring = Math.min(phaseDay, Math.abs(phaseDay - half), LUNAR_MONTH - phaseDay);
  const springNeap: TideInfo['springNeap'] = distToSpring <= 3 ? '大潮' : distToSpring >= 5 ? '小潮' : '中潮';

  const baseMin = 12 * 60 + phaseDay * 50;
  const h1 = ((baseMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const h2 = (h1 + 12 * 60 + 25) % (24 * 60);
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;

  const harvestHint =
    springNeap === '大潮'
      ? '大潮前後潮差大、灘塗露出多，最適合趕海；仍須留意回漲潮，別被困在礁石外側。'
      : springNeap === '小潮'
        ? '小潮潮差小、灘塗露出少，不適合趕海；以市場採買與港區散步為主。'
        : '中潮潮差中等，趕海時機普通；出發前再確認當日潮時。';

  return {
    type: '半日潮（一日兩漲兩退）',
    springNeap,
    highTides: [hhmm(h1), hhmm(h2)],
    harvestHint
  };
}

/** 星期顯示（依臺灣時區），失敗時回傳原日期。 */
export function weekdayLabel(date: string): string {
  try {
    const d = new Date(`${date}T00:00:00+08:00`);
    return new Intl.DateTimeFormat('zh-TW', { weekday: 'short', timeZone: 'Asia/Taipei' }).format(d);
  } catch {
    return date;
  }
}

/** 月／日顯示。 */
export function monthDayLabel(date: string): string {
  const parts = date.split('-');
  return parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : date;
}

/** 觀測時間顯示（HH:MM，臺灣時區）。 */
export function timeLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Taipei'
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

/** 數值格式化：無資料時回傳「—」。 */
export function fmt(value: number | null | undefined, unit = ''): string {
  return value === null || value === undefined ? '—' : `${Math.round(value)}${unit}`;
}

/** 風速分級描述（蒲福風級簡化版）。 */
export function windLabel(speed: number | null | undefined): string {
  if (speed === null || speed === undefined) return '—';
  if (speed < 12) return '微風';
  if (speed < 25) return '和風';
  if (speed < 40) return '強風';
  return '強陣風';
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cell = (name: string, value: string, className: string) =>
  `<span data-wx="${name}" class="${className}">${escape(value)}</span>`;

/**
 * 多日預報列表的 HTML（伺服器與前端共用同一份輸出，避免兩種版本不一致）。
 * 資料缺值時以「—」呈現，不填入推測數字。
 */
export function dailyItemsHtml(days: WeatherDay[]): string {
  return days
    .map((day) => {
      const pop = day.precipitationProbability === null ? null : Math.round(day.precipitationProbability);
      const wave = day.waveHeightMax === null ? null : day.waveHeightMax.toFixed(1);
      return `<li class="flex min-w-[7.2rem] flex-col items-center gap-1 rounded-2xl border border-[#0b6871]/15 bg-white px-3 py-4 text-center shadow-sm">
        ${cell('weekday', weekdayLabel(day.date), 'text-xs font-extrabold tracking-[.14em] text-[#bb3026]')}
        ${cell('date', monthDayLabel(day.date), 'text-[.7rem] font-bold text-[#7c9296]')}
        ${cell('icon', wmoIcon(day.code), 'text-2xl leading-none')}
        ${cell('desc', wmoText(day.code), 'text-xs font-bold text-[#092f37]')}
        ${cell('range', `${fmt(day.tempMax, '°')} / ${fmt(day.tempMin, '°')}`, 'text-sm font-black text-[#0b6871]')}
        ${cell('pop', pop === null ? '降雨機率 —' : `降雨機率 ${pop}%`, 'text-[.7rem] font-bold text-[#5b757a]')}
        ${cell('wave', wave === null ? '浪高 —' : `浪高 ${wave} m`, 'text-[.7rem] font-bold text-[#2f7d86]')}
      </li>`;
    })
    .join('');
}
