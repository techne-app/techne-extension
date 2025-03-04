import Dexie from 'dexie';
import { Tag } from '../types/tag';
import { Search } from '../types/search';

// Define the database schema
class ContextDB extends Dexie {
  tags: Dexie.Table<Tag, number>;
  searches: Dexie.Table<Search, number>;
  settings: Dexie.Table<UserSetting, string>;

  constructor() {
    super('ContextDB');
    
    // Define tables and their primary keys and indexes
    this.version(1).stores({
      tags: '++id, tag, timestamp, type',
      searches: '++id, query, timestamp',
      settings: 'key, timestamp'
    });
    
    // TypeScript type binding
    this.tags = this.table('tags');
    this.searches = this.table('searches');
    this.settings = this.table('settings');
  }

  // Tag-related methods
  async getAllTags(): Promise<Tag[]> {
    return await this.tags.toArray();
  }

  async storeTag(tag: string, type: string, anchor: string): Promise<number> {
    return await this.tags.add({
      tag,
      type,
      timestamp: Date.now(),
      anchor
    });
  }

  async clearTags(): Promise<void> {
    await this.tags.clear();
  }

  async getRecentTags(k: number): Promise<Tag[]> {
    return await this.tags
      .orderBy('timestamp')
      .reverse()
      .limit(k)
      .toArray();
  }

  // Search-related methods
  async getAllSearches(): Promise<Search[]> {
    return await this.searches.toArray();
  }

  async storeSearch(query: string): Promise<number> {
    return await this.searches.add({
      query,
      timestamp: Date.now()
    });
  }

  async clearSearches(): Promise<void> {
    await this.searches.clear();
  }

  async getRecentSearches(k: number): Promise<Search[]> {
    return await this.searches
      .orderBy('timestamp')
      .reverse()
      .limit(k)
      .toArray();
  }

  // Settings-related methods
  async getSetting(key: string): Promise<UserSetting | undefined> {
    return await this.settings.get(key);
  }

  async getSettingValue<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await this.getSetting(key);
    return setting ? setting.value : defaultValue;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    await this.settings.put({
      key,
      value,
      timestamp: Date.now()
    });
  }

  async getAllSettings(): Promise<UserSetting[]> {
    return await this.settings.toArray();
  }

  async getRecentSettings(k: number): Promise<UserSetting[]> {
    return await this.settings
      .orderBy('timestamp')
      .reverse()
      .limit(k)
      .toArray();
  }
}

// Define the UserSetting interface
export interface UserSetting {
  key: string;
  value: any;
  timestamp: number;
}

// Define setting keys as constants
export const SettingKeys = {
  PERSONALIZATION_ENABLED: 'personalization_enabled'
};

export const contextDb = new ContextDB();
export type { Tag, Search }; 