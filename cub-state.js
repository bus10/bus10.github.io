(function () {
    const STORAGE_KEY = 'cub_profile_v1';
    const SESSION_VISIT_KEY = 'cub_session_visit_counted_v1';

    function safeReadProfile() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function safeWriteProfile(profile) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
            return true;
        } catch (error) {
            return false;
        }
    }

    function createDefaultProfile() {
        const now = new Date().toISOString();
        return {
            version: 1,
            firstVisitISO: now,
            lastVisitISO: now,
            visitCount: 0,
            visitedPages: {},
            dailyModesEnabled: true,
            bestSnake: 0,
            bestSnakeUpdatedISO: null,
            bestTypeSpeed: {
                wpm: 0,
                accuracy: 0,
                duration: 0
            },
            bestTypeSpeedUpdatedISO: null,
            gamesPlayed: 0
        };
    }

    function normalizeProfile(profile) {
        const normalized = profile && typeof profile === 'object' ? profile : createDefaultProfile();

        if (typeof normalized.dailyModesEnabled !== 'boolean') {
            normalized.dailyModesEnabled = true;
        }

        return normalized;
    }

    function getProfile() {
        return normalizeProfile(safeReadProfile()) || createDefaultProfile();
    }

    function saveProfile(profile) {
        profile.lastVisitISO = new Date().toISOString();
        safeWriteProfile(profile);
    }

    function recordVisit(pathname) {
        const profile = getProfile();
        const pageKey = pathname || window.location.pathname || '/';

        let countedThisSession = false;
        try {
            countedThisSession = sessionStorage.getItem(SESSION_VISIT_KEY) === '1';
        } catch (error) {
            countedThisSession = false;
        }

        if (!countedThisSession) {
            profile.visitCount += 1;
            try {
                sessionStorage.setItem(SESSION_VISIT_KEY, '1');
            } catch (error) {
                // If sessionStorage is unavailable, fall back to per-load counting.
            }
        }

        profile.visitedPages[pageKey] = (profile.visitedPages[pageKey] || 0) + 1;

        saveProfile(profile);
        return profile;
    }

    function recordGamePlayed() {
        const profile = getProfile();
        profile.gamesPlayed += 1;
        saveProfile(profile);
        return profile;
    }

    function setBestSnake(score) {
        const profile = getProfile();
        if (typeof score === 'number' && score > profile.bestSnake) {
            profile.bestSnake = score;
            profile.bestSnakeUpdatedISO = new Date().toISOString();
            saveProfile(profile);
        }
        return profile.bestSnake;
    }

    function setBestTypeSpeed(wpm, accuracy, duration) {
        const profile = getProfile();
        const incomingWpm = typeof wpm === 'number' ? wpm : 0;

        if (incomingWpm > profile.bestTypeSpeed.wpm) {
            profile.bestTypeSpeed = {
                wpm: incomingWpm,
                accuracy: typeof accuracy === 'number' ? accuracy : 0,
                duration: typeof duration === 'number' ? duration : 0
            };
            profile.bestTypeSpeedUpdatedISO = new Date().toISOString();
            saveProfile(profile);
        }

        return profile.bestTypeSpeed;
    }

    function clearProfile() {
        const freshProfile = createDefaultProfile();
        safeWriteProfile(freshProfile);
        try {
            sessionStorage.removeItem(SESSION_VISIT_KEY);
        } catch (error) {
            // sessionStorage may be unavailable in some contexts.
        }
        return freshProfile;
    }

    function getDailyMode() {
        const dateKey = new Date().toISOString().slice(0, 10);
        let hash = 0;
        for (let i = 0; i < dateKey.length; i++) {
            hash += dateKey.charCodeAt(i);
        }

        const modes = ['BLACKOUT', 'OVERCLOCK', 'ARCHIVE'];
        return modes[hash % modes.length];
    }

    function isDailyModeEnabled() {
        const profile = getProfile();
        return profile.dailyModesEnabled !== false;
    }

    function setDailyModeEnabled(enabled) {
        const profile = getProfile();
        profile.dailyModesEnabled = Boolean(enabled);
        saveProfile(profile);

        const mode = applyDailyMode();
        window.CUBState.currentMode = mode;

        return profile.dailyModesEnabled;
    }

    function getActiveDailyMode() {
        if (!isDailyModeEnabled()) return null;
        return getDailyMode();
    }

    function applyDailyMode() {
        const mode = getActiveDailyMode();
        if (!mode) {
            document.body.removeAttribute('data-daily-mode');
            return null;
        }

        document.body.setAttribute('data-daily-mode', mode.toLowerCase());
        return mode;
    }

    window.CUBState = {
        getProfile,
        saveProfile,
        recordVisit,
        recordGamePlayed,
        setBestSnake,
        setBestTypeSpeed,
        clearProfile,
        getDailyMode,
        getActiveDailyMode,
        isDailyModeEnabled,
        setDailyModeEnabled,
        applyDailyMode
    };

    const profile = recordVisit(window.location.pathname || '/');
    const mode = applyDailyMode();

    window.CUBState.currentProfile = profile;
    window.CUBState.currentMode = mode;
})();
