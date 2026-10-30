/**
 * 東港華僑市場擴頁內容註冊表 — 型別與群組標籤
 *
 * 全站 42 個繁體中文內容頁的單一資料來源。新增或修改專題時，編輯對應分組檔，
 * 路由與元件會自動收錄。內容原則：中立第三方、不替店家排名、可核實來源優先、
 * 涉及營業／票價／船班／開放區域者皆標註「現場確認」。
 */

import { RATING_VALUE, RATING_COUNT, RATING_AS_OF } from '../site';

export type TopicGroup = 'market' | 'food' | 'transport' | 'nearby' | 'itineraries' | 'seasons';

export const TOPIC_GROUP_LABELS: Record<TopicGroup, string> = {
  market: '市場與採購指南',
  food: '東港海鮮美食',
  transport: '交通與碼頭',
  nearby: '周邊景點與文化',
  itineraries: '行程規劃',
  seasons: '季節與活動'
};

export interface TopicSection {
  id?: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
}

export interface TopicFaq {
  q: string;
  a: string;
}

export interface Topic {
  /** 完整路徑（不含前後斜線），如 'visit' 或 'food/bluefin-tuna' */
  slug: string;
  group: TopicGroup;
  title: string;
  description: string;
  h1: string;
  lead: string;
  updated: string;
  image?: string;
  imageAlt?: string;
  sections: TopicSection[];
  faqs: TopicFaq[];
  related: string[];
}

/** 評分與核對日：提供給專題頁顯示用（避免各頁重複硬編碼） */
export const TOPIC_RATING = {
  value: RATING_VALUE,
  count: RATING_COUNT,
  asOf: RATING_AS_OF
} as const;
