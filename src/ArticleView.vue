<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    title: string;
}>();

const md = new MarkdownIt();
const articleHtml = ref<string>('');
const isLoading = ref<boolean>(false);
const hasError = ref<boolean>(false);

const isDarkMode = ref<boolean>(false);
let observer: MutationObserver | null = null;

const modules = import.meta.glob('/src/assets/articles/*.md', { query: '?raw' });
const targetPath = computed<string>(() => `/src/assets/articles/${props.title}.md`);

// Dynamically grab '/ev-finder/' in production or '/' in local dev from your vite.config.ts
const baseUrl = import.meta.env.BASE_URL;

const updateDarkModeStatus = (): void => {
    isDarkMode.value = document.documentElement.classList.contains('dark');
};

onMounted(() => {
    updateDarkModeStatus();
    observer = new MutationObserver(() => updateDarkModeStatus());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

onUnmounted(() => {
    if (observer) observer.disconnect();
});

async function loadArticle(path: string): Promise<void> {
    if (!modules[path]) {
        hasError.value = true;
        articleHtml.value = '';
        return;
    }

    isLoading.value = true;
    hasError.value = false;

    try {
        const fileContent = await modules[path]();
        const rawMarkdown = typeof fileContent === 'string'
            ? fileContent
            : (fileContent as { default: string; }).default;

        // 1. Render the markdown into standard HTML string
        let renderedHtml = md.render(rawMarkdown);

        // 2. Automatically find src="/article-images/..." and turn it into src="/ev-finder/article-images/..."
        // This ensures it maps perfectly in local development and on GitHub Pages!
        renderedHtml = renderedHtml.replace(
            /src="\/article-images\//g,
            `src="${baseUrl}article-images/`
        );

        articleHtml.value = renderedHtml;
    } catch (error) {
        console.error('Failed to load article:', error);
        hasError.value = true;
        articleHtml.value = '';
    } finally {
        isLoading.value = false;
    }
}

watch(targetPath, (newPath) => loadArticle(newPath), { immediate: true });
</script>

<template>
    <main class="article-view">
        <div v-if="isLoading" class="status-message">Loading article...</div>
        <div v-else-if="hasError" class="status-message error">Article "{{ props.title }}" could not be loaded.</div>
        <article v-else v-html="articleHtml" class="markdown-body" :class="{ 'force-dark-colors': isDarkMode }" />
    </main>
</template>

<style scoped>
/* (Keep your existing styles here unchanged) */
.article-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.status-message {
    text-align: center;
    font-size: 1.2rem;
    color: #666;
    padding: 4rem 0;
}

.status-message.error {
    color: #d32f2f;
}

:deep(.markdown-body) {
    color: #1e293b;
    font-size: 0.9rem;
    word-break: break-word;
    overflow-wrap: break-word;
}

:deep(.markdown-body) h1,
:deep(.markdown-body) h2,
:deep(.markdown-body) h3 {
    color: #0f172a;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 700;
}

:deep(.markdown-body) h1 {
    font-size: 1.85rem;
}

:deep(.markdown-body) h2 {
    font-size: 1.5rem;
}

:deep(.markdown-body) h3 {
    font-size: 1.2rem;
}

:deep(.markdown-body) p,
:deep(.markdown-body) li,
:deep(.markdown-body) pre,
:deep(.markdown-body) code {
    line-height: 1.6;
    margin-bottom: 0.6rem;
    font-size: inherit;
    white-space: pre-wrap;
    font-family: inherit;
}

/* Ensure images inside your markdown adapt nicely to the page boundaries */
:deep(.markdown-body) img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1rem 0;
}

.force-dark-colors:deep(*) {
    color: #cbd5e1 !important;
}

.force-dark-colors:deep(h1),
.force-dark-colors:deep(h2),
.force-dark-colors:deep(h3) {
    color: #ffffff !important;
}
</style>