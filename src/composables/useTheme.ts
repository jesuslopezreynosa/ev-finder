import { ref, onMounted } from 'vue';

const isDark = ref<boolean>(false);

export function useTheme() {
    const updateDOM = () => {
        if (isDark.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const initTheme = () => {
        const saved = localStorage.getItem('theme');
        if (saved) {
            isDark.value = saved === 'dark';
        } else {
            isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        updateDOM();
    };

    const toggleTheme = () => {
        isDark.value = !isDark.value;
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
        updateDOM();
    };

    onMounted(() => {
        initTheme();
    });

    return { isDark, toggleTheme, initTheme };
}