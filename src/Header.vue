<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const emit = defineEmits<{
    (e: 'change-view', view: string): void;
}>();

defineProps<{
    activeView: string;
}>();

const { isDark, toggleTheme } = useTheme();

const NAV_VIEWS = [
    { id: 'grid', label: 'Vehicles' },
    { id: 'batteries', label: 'Batteries' },
    { id: 'backstory', label: 'Backstory' }
] as const;
</script>

<template>
    <header class="floating-header-wrapper">
        <nav class="glass-navbar" aria-label="Main navigation">
            <button class="brand-logo-btn" @click="emit('change-view', 'grid')" aria-label="Return to EV Finder home"
                type="button">
                <svg viewBox="0 0 24 24" class="icon brand-bolt-svg" aria-hidden="true">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span class="brand-name">EV Finder</span>
            </button>

            <div class="nav-segmented-group desktop-nav-tabs" role="tablist">
                <button v-for="view in NAV_VIEWS" :key="view.id" class="nav-segment-btn"
                    :class="{ 'is-active': activeView === view.id }" @click="emit('change-view', view.id)" role="tab"
                    :aria-selected="activeView === view.id" type="button">
                    {{ view.label }}
                </button>
            </div>

            <div class="mobile-nav-dropdown-wrapper">
                <select class="mobile-nav-select" :value="activeView"
                    @change="emit('change-view', ($event.target as HTMLSelectElement).value)" aria-label="Select view">
                    <option v-for="view in NAV_VIEWS" :key="view.id" :value="view.id">
                        {{ view.label }}
                    </option>
                </select>
                <svg viewBox="0 0 24 24" class="mobile-nav-chevron" aria-hidden="true">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
            </div>

            <div class="header-actions">
                <button @click="toggleTheme" class="header-theme-toggle-btn" type="button"
                    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
                    <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" class="icon theme-toggle-svg" aria-hidden="true">
                        <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
                        <line x1="12" y1="1" x2="12" y2="3.5" />
                        <line x1="12" y1="20.5" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.99" y2="5.99" />
                        <line x1="18.01" y1="18.01" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3.5" y2="12" />
                        <line x1="20.5" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.99" y2="18.01" />
                        <line x1="18.01" y1="5.99" x2="19.78" y2="4.22" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"
                        fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" class="icon theme-toggle-svg" aria-hidden="true">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                </button>
            </div>
        </nav>
    </header>
</template>

<style scoped>
.floating-header-wrapper {
    position: sticky;
    top: 0;
    z-index: 80;
    width: 100%;
    margin: 0;
    padding: 10px 16px 14px;
    box-sizing: border-box;
    background: linear-gradient(to bottom,
            var(--bg-primary) 0%,
            var(--bg-primary) 65%,
            rgba(238, 242, 246, 0.75) 85%,
            transparent 100%);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

html.dark .floating-header-wrapper {
    background: linear-gradient(to bottom,
            var(--bg-primary) 0%,
            var(--bg-primary) 65%,
            rgba(11, 19, 43, 0.75) 85%,
            transparent 100%);
}

.glass-navbar {
    max-width: 1368px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 16px;
    border-radius: 9999px;
    background: rgba(251, 252, 254, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(216, 225, 234, 0.85);
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02);
}

html.dark .glass-navbar {
    background: rgba(28, 37, 65, 0.94);
    border-color: rgba(51, 65, 85, 0.85);
    box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3);
}

.brand-logo-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    padding: 4px 8px;
    border-radius: 9999px;
    cursor: pointer;
    color: var(--text-primary);
    transition: transform 0.15s ease;
}

.brand-logo-btn:hover {
    transform: scale(1.02);
}

.brand-bolt-svg {
    width: 18px;
    height: 18px;
    fill: var(--accent-primary);
    flex-shrink: 0;
}

html.dark .brand-bolt-svg {
    fill: #38bdf8;
}

.brand-name {
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    white-space: nowrap;
}

.desktop-nav-tabs {
    display: flex;
    align-items: center;
    background: rgba(235, 240, 245, 0.9);
    padding: 3px;
    border-radius: 9999px;
    border: 1px solid rgba(216, 225, 234, 0.75);
    gap: 2px;
}

html.dark .desktop-nav-tabs {
    background: rgba(11, 19, 43, 0.7);
    border-color: rgba(51, 65, 85, 0.7);
}

.nav-segment-btn {
    background: transparent;
    border: none;
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
}

.nav-segment-btn:hover {
    color: var(--text-primary);
}

.nav-segment-btn.is-active {
    background: #ffffff;
    color: var(--accent-primary);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

html.dark .nav-segment-btn.is-active {
    background: #1c2541;
    color: #38bdf8;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.mobile-nav-dropdown-wrapper {
    display: none;
    position: relative;
    align-items: center;
}

.mobile-nav-select {
    appearance: none;
    -webkit-appearance: none;
    background: rgba(235, 240, 245, 0.95);
    border: 1px solid rgba(216, 225, 234, 0.85);
    border-radius: 9999px;
    padding: 6px 28px 6px 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    outline: none;
}

html.dark .mobile-nav-select {
    background: rgba(11, 19, 43, 0.85);
    border-color: rgba(51, 65, 85, 0.85);
    color: #f8fafc;
}

.mobile-nav-chevron {
    position: absolute;
    right: 10px;
    width: 14px;
    height: 14px;
    fill: currentColor;
    pointer-events: none;
    color: var(--text-secondary);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-theme-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 50%;
    cursor: pointer;
    border: 1px solid rgba(216, 225, 234, 0.85);
    background: rgba(235, 240, 245, 0.9);
    color: var(--text-primary);
    transition: all 0.18s ease;
}

.header-theme-toggle-btn:hover {
    background: #ffffff;
    border-color: var(--accent-primary);
    transform: scale(1.05);
}

html.dark .header-theme-toggle-btn {
    background: rgba(11, 19, 43, 0.8);
    border-color: rgba(71, 85, 105, 0.8);
    color: #f8fafc;
}

html.dark .header-theme-toggle-btn:hover {
    background: #1c2541;
    border-color: #38bdf8;
}

@media (max-width: 640px) {
    .desktop-nav-tabs {
        display: none !important;
    }

    .mobile-nav-dropdown-wrapper {
        display: inline-flex !important;
    }
}
</style>