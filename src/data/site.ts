/**
 * 單一景點實體綁定設定（Single-Attraction SEO Entity Binding）
 *
 * 全站 SEO 名稱、JSON-LD 實體、TDK 與內文語義綁定都從這裡取值，
 * 避免同一個景點事實在多個頁面各自硬編碼而產生不一致。
 */

/** 網站域名（正式網域唯一來源） */
export const DOMAIN_NAME = 'huaqiaofishmarket.com';
export const SITE_URL = `https://${DOMAIN_NAME}`;

/** 景點官方全稱 */
export const ATTRACTION_FULL_NAME = '東港漁港漁產品直銷中心（華僑市場）';
/** 景點常用俗稱，同時是網域名稱 huaqiao fish market 的中文對應含義 */
export const ATTRACTION_SHORT_NAME = '華僑市場';
/** 英文慣用名 */
export const ATTRACTION_EN_NAME = 'Huaqiao Fish Market';
/** 景點類型 */
export const ATTRACTION_TYPE = '海鮮市場';

/** 城市／城鎮 */
export const CITY_NAME = '東港鎮';
/** 城市簡稱（用於 SEO 站名與標題） */
export const CITY_SHORT = '東港';
/** 省／州／縣 */
export const STATE_PROVINCE = '屏東縣';
/** 國家 */
export const COUNTRY_NAME = '臺灣';
/** 兩位國家代碼 */
export const COUNTRY_CODE_2LETTER = 'TW';
/** 郵遞區號 */
export const POSTAL_CODE = '928';

/** 緯度 */
export const LATITUDE = 22.468089;
/** 經度 */
export const LONGITUDE = 120.44332;
/** 門牌地址 */
export const STREET_ADDRESS = '朝安里朝隆路39號';
/** 地圖座標參考 */
export const PIN_REFERENCE = '22.468089, 120.44332';
/** 聯絡電話 */
export const TELEPHONE_DISPLAY = '08-833-9969';
export const TELEPHONE = '+886-8-833-9969';

/** Google Maps 分享短連結 */
export const MAPS_SHARE_URL = 'https://maps.app.goo.gl/h7gVHwrv5e6CSpV77';
/** Google Maps 嵌入 src */
export const MAPS_EMBED_SRC = 'https://maps.google.com/maps?q=22.468089,120.44332&z=15&output=embed';

/** 周邊核心地標 */
export const NEARBY_LANDMARK_1 = '東港東隆宮';
export const NEARBY_LANDMARK_2 = '大鵬灣跨海大橋';

/** 官方觀光／主管機關權威連結 */
export const GOVT_TOURISM_URL = 'https://www.taiwan.net.tw/m1.aspx?id=A12-00342&sNo=0001122';
export const GOVT_TOURISM_NAME = '交通部觀光署「東港漁港漁產品直銷中心（華僑市場）」景點資料';
export const GOVT_SCENIC_URL = 'https://www.dbnsa.gov.tw/attraction/AttractionPage?a=256';
export const GOVT_SCENIC_NAME = '交通部觀光署大鵬灣國家風景區管理處景點資料';

/** 第三方公開評分快照（會變動，僅作參考） */
export const RATING_VALUE = 4.3;
export const RATING_COUNT = 39645;
export const RATING_SOURCE_NOTE = '2026-10-20 Google 地圖公開評分快照（4.3／5，39,645 則）';

/** SEO 站名格式：景點名稱 + 城市 + 旅遊指南 */
export const SITE_NAME = `${ATTRACTION_FULL_NAME}｜${CITY_SHORT}旅遊指南`;
/** PWA／短標題用品牌名 */
export const SITE_SHORT_NAME = '華僑市場';

/** 子頁標題統一附加站名後綴 */
export const withSiteName = (suffix: string) => `${suffix} | ${SITE_NAME}`;

/** 地理歸屬層級：景點 → 城鎮 → 縣 → 國家 */
export const GEO_HIERARCHY = [ATTRACTION_FULL_NAME, CITY_NAME, STATE_PROVINCE, COUNTRY_NAME];
