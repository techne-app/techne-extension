import { ChatConfig, MODEL_OPTIONS } from '../types/chat';
import { contextDb, SettingKeys } from '../background/contextDb';

class ConfigStore {
  private async loadConfig(): Promise<ChatConfig> {
    try {
      const [model, temperature, topP, maxTokens] = await Promise.all([
        contextDb.getSettingValue(SettingKeys.CHAT_MODEL, MODEL_OPTIONS[0].value),
        contextDb.getSettingValue(SettingKeys.CHAT_TEMPERATURE, 0.7),
        contextDb.getSettingValue(SettingKeys.CHAT_TOP_P, 0.95),
        contextDb.getSettingValue(SettingKeys.CHAT_MAX_TOKENS, 4096)
      ]);
      
      return {
        model,
        temperature,
        topP,
        maxTokens
      };
    } catch (error) {
      console.error('Failed to load chat config:', error);
      return {
        model: MODEL_OPTIONS[0].value,
        temperature: 0.7,
        topP: 0.95,
        maxTokens: 4096,
      };
    }
  }

  async getModel(): Promise<string> {
    return await contextDb.getSettingValue(SettingKeys.CHAT_MODEL, MODEL_OPTIONS[0].value);
  }

  async setModel(model: string): Promise<void> {
    await contextDb.saveSetting(SettingKeys.CHAT_MODEL, model);
  }


  async getTemperature(): Promise<number> {
    return await contextDb.getSettingValue(SettingKeys.CHAT_TEMPERATURE, 0.7);
  }

  async setTemperature(temperature: number): Promise<void> {
    await contextDb.saveSetting(SettingKeys.CHAT_TEMPERATURE, temperature);
  }

  async getTopP(): Promise<number> {
    return await contextDb.getSettingValue(SettingKeys.CHAT_TOP_P, 0.95);
  }

  async setTopP(topP: number): Promise<void> {
    await contextDb.saveSetting(SettingKeys.CHAT_TOP_P, topP);
  }

  async getMaxTokens(): Promise<number> {
    return await contextDb.getSettingValue(SettingKeys.CHAT_MAX_TOKENS, 4096);
  }

  async setMaxTokens(maxTokens: number): Promise<void> {
    await contextDb.saveSetting(SettingKeys.CHAT_MAX_TOKENS, maxTokens);
  }

  async getConfig(): Promise<ChatConfig> {
    return await this.loadConfig();
  }

  async updateConfig(updates: Partial<ChatConfig>): Promise<void> {
    const promises = [];
    
    if (updates.model !== undefined) {
      promises.push(this.setModel(updates.model));
    }
    if (updates.temperature !== undefined) {
      promises.push(this.setTemperature(updates.temperature));
    }
    if (updates.topP !== undefined) {
      promises.push(this.setTopP(updates.topP));
    }
    if (updates.maxTokens !== undefined) {
      promises.push(this.setMaxTokens(updates.maxTokens));
    }
    
    await Promise.all(promises);
  }
}

export const configStore = new ConfigStore();