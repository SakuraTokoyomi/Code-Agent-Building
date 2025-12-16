/**
 * User Preferences Management Module
 * Handles localStorage-based preference storage and management
 */
class PreferencesManager {
    constructor() {
        this.STORAGE_KEY = 'arxiv_cs_daily_prefs';

        this.defaultPreferences = {
            lastViewedCategory: 'cs.AI',
            theme: 'light',
            showAbstracts: true
        };

        this.initializePreferences();
    }

    initializePreferences() {
        try {
            const existingPrefs = this.getPreferences();
            if (!existingPrefs) {
                this.savePreferences(this.defaultPreferences);
            }
        } catch (error) {
            console.warn('Error initializing preferences:', error);
            this.savePreferences(this.defaultPreferences);
        }
    }

    getPreferences() {
        try {
            const prefs = localStorage.getItem(this.STORAGE_KEY);
            return prefs ? JSON.parse(prefs) : null;
        } catch (error) {
            console.error('Failed to retrieve preferences:', error);
            return this.defaultPreferences;
        }
    }

    savePreferences(preferences) {
        try {
            const mergedPrefs = { ...this.defaultPreferences, ...preferences };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedPrefs));

            window.dispatchEvent(new CustomEvent('preferencesUpdated', {
                detail: mergedPrefs
            }));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    updatePreference(key, value) {
        try {
            const currentPrefs = this.getPreferences() || this.defaultPreferences;
            const updatedPrefs = { ...currentPrefs, [key]: value };
            this.savePreferences(updatedPrefs);
        } catch (error) {
            console.error(`Failed to update preference ${key}:`, error);
        }
    }

    resetPreferences() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultPreferences));
            window.dispatchEvent(new CustomEvent('preferencesReset', {
                detail: this.defaultPreferences
            }));
        } catch (error) {
            console.error('Failed to reset preferences:', error);
        }
    }
}

// Export class for use in other modules
window.PreferencesManager = PreferencesManager;
