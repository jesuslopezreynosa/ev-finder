<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import MarkdownIt from 'markdown-it';
import markdownItMathjax3 from 'markdown-it-mathjax3';

import { useTheme } from '@/composables/useTheme';

const props = defineProps<{
    title: string;
}>();

// Module-level instantiation for MarkdownIt
const md = new MarkdownIt({
    html: true // Enable inline HTML
}).use(markdownItMathjax3);

const articleHtml = ref<string>('');
const isLoading = ref<boolean>(false);
const hasError = ref<boolean>(false);

// Reactive dark mode state via centralized composable
const { isDark } = useTheme();

const modules = import.meta.glob('/src/assets/articles/*.md', { query: '?raw' });
const targetPath = computed<string>(() => `/src/assets/articles/${ props.title }.md`);

const baseUrl = import.meta.env.BASE_URL;

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

        const sanitizedMarkdown = rawMarkdown.replace(/<!--[\s\S]*?-->/g, ''); // Remove Markdown comments
        let renderedHtml = md.render(sanitizedMarkdown);

        // Turn src="/article-images/..." into src="/ev-finder/article-images/..."
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
    <main class="article-view-container">
        <div class="article-floating-card">
            <div v-if="isLoading" class="status-message">Loading article...</div>
            <div v-else-if="hasError" class="status-message error">Article "{{ props.title }}" could not be loaded.
            </div>
            <article v-else v-html="articleHtml" class="markdown-body" />
        </div>
    </main>
</template>

<style scoped>
.article-view-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 16px 40px;
    box-sizing: border-box;
}

.article-floating-card {
    background: rgba(251, 252, 254, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(216, 225, 234, 0.85);
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.05);
}

html.dark .article-floating-card {
    background: rgba(28, 37, 65, 0.92);
    border-color: rgba(51, 65, 85, 0.85);
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
    color: var(--text-primary);
    font-size: 0.95rem;
    word-break: break-word;
    overflow-wrap: break-word;
}

:deep(.markdown-body) h1,
:deep(.markdown-body) h2,
:deep(.markdown-body) h3 {
    color: var(--text-primary);
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
:deep(.markdown-body) li {
    line-height: 1.6;
    margin-bottom: 0.6rem;
    font-size: inherit;
}

:deep(.markdown-body) pre,
:deep(.markdown-body) code {
    line-height: 1.6;
    margin-bottom: 0.6rem;
    font-size: inherit;
    white-space: pre-wrap;
    font-family: monospace;
}

:deep(.markdown-body) img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1rem 0;
}

:deep(mjx-assistive-mml) {
    display: none !important;
}
</style>