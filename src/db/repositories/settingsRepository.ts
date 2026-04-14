import { db } from '../schema'
import {
  DEFAULT_DISPLAY_SETTINGS,
  DISPLAY_SETTINGS_ID,
  type DisplaySettings,
  type DisplaySettingsRecord,
} from '../../types/settings'

function toRecord(settings: DisplaySettings): DisplaySettingsRecord {
  return {
    id: DISPLAY_SETTINGS_ID,
    ...settings,
  }
}

export const settingsRepository = {
  async getDisplaySettings(): Promise<DisplaySettings> {
    const record = await db.displaySettings.get(DISPLAY_SETTINGS_ID)

    if (!record) {
      await db.displaySettings.put(toRecord(DEFAULT_DISPLAY_SETTINGS))
      return DEFAULT_DISPLAY_SETTINGS
    }

    const { id: _id, ...settings } = record
    return settings
  },

  async saveDisplaySettings(settings: DisplaySettings): Promise<string> {
    await db.displaySettings.put(toRecord(settings))
    return DISPLAY_SETTINGS_ID
  },

  async updateDisplaySettings(
    changes: Partial<DisplaySettings>,
  ): Promise<string> {
    const current = await this.getDisplaySettings()
    const nextSettings = {
      ...current,
      ...changes,
    }

    await db.displaySettings.put(toRecord(nextSettings))
    return DISPLAY_SETTINGS_ID
  },

  async resetDisplaySettings(): Promise<string> {
    await db.displaySettings.put(toRecord(DEFAULT_DISPLAY_SETTINGS))
    return DISPLAY_SETTINGS_ID
  },
}
