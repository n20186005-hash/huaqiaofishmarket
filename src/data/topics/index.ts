import type { Topic, TopicGroup } from './types';
import { marketTopics } from './market';
import { foodTopics } from './food';
import { transportTopics } from './transport';
import { nearbyTopics } from './nearby';
import { itinerariesTopics } from './itineraries';
import { seasonsTopics } from './seasons';

/** 所有主題（42 頁） */
export const allTopics: Topic[] = [
  ...marketTopics,
  ...foodTopics,
  ...transportTopics,
  ...nearbyTopics,
  ...itinerariesTopics,
  ...seasonsTopics
];

/** 既有頁面（非主題資料）的相關連結回退，避免 related 指向不存在的項目 */
const EXISTING_PAGES: Record<string, { url: string; title: string }> = {
  hours: { url: '/hours/', title: '華僑市場營業時間' },
  parking: { url: '/parking/', title: '交通與停車' },
  food: { url: '/food/', title: '東港海鮮美食' }
};

/** 依分組取得主題清單 */
export function topicsByGroup(group: TopicGroup): Topic[] {
  return allTopics.filter((t) => t.group === group);
}

/** 依 slug 取得主題（market 群組 slug 無前綴，其餘含 / 前綴） */
export function getTopicBySlug(slug: string): Topic | undefined {
  return allTopics.find((t) => t.slug === slug);
}

/** 主題 URL：slug 即路徑（market 群組為根層級，其餘含群組前綴） */
export function topicUrl(slug: string): string {
  return `/${slug}/`;
}

/** 解析 related 清單為可渲染連結（含既有頁面回退） */
export function resolveRelated(slugs: string[]): { url: string; title: string }[] {
  return slugs
    .map((slug) => {
      const topic = getTopicBySlug(slug);
      if (topic) return { url: topicUrl(slug), title: topic.h1 };
      const existing = EXISTING_PAGES[slug];
      if (existing) return existing;
      return null;
    })
    .filter((x): x is { url: string; title: string } => x !== null);
}

export { TOPIC_GROUP_LABELS } from './types';
