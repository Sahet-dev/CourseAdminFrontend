<template>
    <div>
        <DashboardHeader />
        <transition
            name="fade"

        >
            <div
                v-if="notification.visible"
                class="fixed top-4 right-4 bg-green-500 text-white p-3 rounded"
            >
                {{ notification.message }}
            </div>
        </transition>
        <div  v-bind="$attrs">
            <Loader v-if="loading" />
            <div v-if="!loading && lessons.length" class="flex mx-auto p-6 bg-white rounded-md shadow-md">
                <!-- Sidebar -->
                <UpdateSidebar
                    :lessons="lessons"
                    :selectedLesson="selectedLesson"
                    @update:selectedLesson="setSelectedLesson"
                    class="flex-shrink-0 mr-6"
                />

                <!-- Main Content -->
                <div class="flex-grow">
                    <button @click="editCourse(courseIds)"
                            class=" w-full text-left px-2 py-1 rounded hover:bg-red-50 mb-4 hover:text-red-900">
                        Edit Course Data
                    </button>
                    <div v-if="selectedLesson !== null && lessons[selectedLesson]" class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800 mb-6">Selected Lesson</h2>

                        <div class="mb-4 border-b border-gray-300 pb-4">
                            <div class="flex items-center justify-between bg-white p-4 rounded-lg   mb-4">
                                <!-- Lesson Heading -->
                                <h3 class="text-lg font-medium text-gray-700">
                                    Lesson {{ selectedLesson + 1 }}
                                </h3>

                                <!-- Create Test Button -->
                                <button @click="createTest"
                                        class="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-600 transition duration-200">
                                    Create Test
                                </button>
                            </div>

                            <div class="mb-4">
                                <label for="lessonTitle" class="block text-lg font-medium text-gray-700">Lesson Title</label>
                                <input v-model="lessons[selectedLesson].title" id="lessonTitle" type="text" class="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div class="mb-4">
                                <label for="video_url" class="block text-lg font-medium text-gray-700">Video file</label>
                                <input type="file" name="video_url" @change="handleFileChange" />
                                <!-- Video Preview -->
                                <video v-if="lessons[selectedLesson].videoPreview" :src="lessons[selectedLesson].videoPreview" controls class="mt-2 w-full max-w-xs"></video>
                                <p v-if="lessons[selectedLesson].video_url && !lessons[selectedLesson].videoPreview" class="mt-2">{{ lessons[selectedLesson].video_url }}</p>
                            </div>
                            <div class="mb-4">
                                <label for="markdown_text" class="mt-6 block text-lg font-medium text-gray-700">Markdown Text</label>
                                <ckeditor
                                    v-model="lessons[selectedLesson].markdown_text"
                                    :editor="editor"
                                    :config="editorConfig"
                                />
                                <div v-if="isMarkdownTextRequired && !isMarkdownTextValid" class="text-red-500">
                                    Markdown text is required.
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" @click="addLesson"
                            class="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md shadow-sm hover:bg-gray-300 mb-4">
                        + Add Another Lesson
                    </button>


                    <button @click="updateLesson" class="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-center" :disabled="loader">
                        <svg v-if="loader" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="24px" height="24px" viewBox="0 0 128 128" xml:space="preserve" class="mr-2">
                            <g>
                              <path fill="#fff" d="M38.2 16.53S20.3 29.78 18 48.83c-2.62 21.44 8.4 32.68 8.4 32.68l6.5-3.8-.4 29.67L6.92 92.53l6.5-3.8S3.92 70 10.35 49.2c8.2-26.57 27.86-32.67 27.86-32.67zm-2.9 93.7s20.42 8.85 38.1 1.33c19.9-8.45 24.14-23.62 24.14-23.62L91 84.24l25.9-14.5-.1 29.53-6.52-3.7s-11.5 17.55-32.74 22.4c-27.13 6.2-42.24-7.74-42.24-7.74zm82.73-44.44s-2.55-22.14-17.9-33.7C82.86 19.1 67.6 23 67.6 23l.06 7.53-25.5-15.16L67.78.67l.05 7.5S88.8 9.4 103.6 25.35c18.96 20.4 14.43 40.46 14.43 40.46z"/>
                                <animateTransform attributeName="transform" type="rotate" from="360 64 64" to="0 64 64" dur="1080ms" repeatCount="indefinite"></animateTransform>
                            </g>
                          </svg>
                        <span v-if="!loader">Save Changes</span>
                        <span v-else>Saving...</span>
                    </button>




                     <!-- Error Message -->
                    <div v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>
                </div>
            </div>
            <div v-else-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>
            <div v-else-if="!loading && !lessons.length" class="flex flex-col items-center justify-center pt-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">No Lessons Yet</h2>
                <p class="text-gray-600 mb-4">Start by creating your first lesson for this course.</p>
                <button @click="createFirstLesson" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200">
                    Create First Lesson
                </button>
            </div>
        </div>
    </div>


</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from "../../api/axios.js";
import UpdateSidebar from "./UpdateSidebar.vue";
import DashboardHeader from "../DashboardHeader.vue";
import {
    ClassicEditor,
    Bold,
    Essentials,
    Italic,
    Mention,
    Paragraph,
    Undo,
    Link,
    Code,
    Strikethrough,
    Subscript,
    Superscript,
    Underline,
    Font,
    CodeBlock,
    Indent,
    IndentBlock
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import Loader from "./Loader.vue";
import {imageUrl} from "../../imageUtil.js";

const editor = ClassicEditor;
const editorConfig = {
    plugins: [
        Bold, Essentials, Italic, Mention, Paragraph,
        Undo, Link, Code, Strikethrough, Subscript,
        Superscript, Underline, Font, CodeBlock,
        Indent, IndentBlock
    ],
    toolbar: {
        items: [
            'undo', 'redo', '|', 'bold', 'italic', 'underline',
            'strikethrough', 'subscript', 'superscript',
            'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor',
            'link', 'code', 'codeBlock'
        ]
    }
};

const route = useRoute();
const router = useRouter();
const loader = ref(false);
const questions = ref([{
    question_text: 'Sample Question 1',
    responses: [
        { response_text: 'Option 1', is_correct: false },
        { response_text: 'Option 2', is_correct: false },
        { response_text: 'Option 3', is_correct: true },
        { response_text: 'Option 4', is_correct: false },
    ]
}]);

const courses = ref({ id: null });
const lessons = ref([]);
const selectedLesson = ref(null);
const errorMessage = ref('');
const notification = ref({ message: '', visible: false });
const loading = ref(true);

const isMarkdownTextRequired = true;
const isMarkdownTextValid = computed(() => {
    const markdownText = lessons.value[selectedLesson.value]?.markdown_text || '';
    return !isMarkdownTextRequired || markdownText.trim() !== '';
});

const createTest = async () => {
    const courseId = route.params.id;
    router.push({ name: 'ViewCreateTest', params: { id: courseId } });
};

const fetchLessons = async (courseId) => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/lessons`);
        const lessonsData = response.data.lessons;
        lessons.value = lessonsData.map((lesson) => ({
            id: lesson.id || null,
            title: lesson.title || '',
            video_url: lesson.video_url || '',
            videoPreview: imageUrl(lesson.video_url) ,
            markdown_text: lesson.markdown_text || '',
        }));
        selectedLesson.value = lessonsData.length > 0 ? 0 : null;
    } catch (error) {
        console.error('Failed to fetch lessons:', error);
        errorMessage.value = 'Failed to load lessons. Please try again.';
    }
};

const setSelectedLesson = (index) => {
    selectedLesson.value = index;
};

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        lessons.value[selectedLesson.value].videoFile = file;
        lessons.value[selectedLesson.value].videoPreview = URL.createObjectURL(file);
    }
};

const showNotification = (message) => {
    notification.value.message = message;
    notification.value.visible = true;

    setTimeout(() => {
        notification.value.visible = false;
    }, 3000);
};

const updateLesson = async () => {
    try {
        loader.value = true;

        if (selectedLesson.value === null || lessons.value.length === 0) {
            errorMessage.value = 'No lesson selected or lessons are empty.';
            return;
        }
        if (!isMarkdownTextValid.value) {
            errorMessage.value = 'Markdown text is required.';
            return;
        }
        const lesson = lessons.value[selectedLesson.value];

        if (!lesson.title) {
            errorMessage.value = 'Lesson title is required.';
            return;
        }

        const formData = new FormData();
        formData.append('title', lesson.title);
        formData.append('markdown_text', lesson.markdown_text);

        if (lesson.videoFile) {
            formData.append('video_url', lesson.videoFile);
        }

        formData.append('_method', 'PUT');
        const response = await apiClient.post(`/lessons/${lesson.id}`, formData);
        showNotification('Lesson updated successfully!');
        errorMessage.value = '';
    } catch (error) {
        console.error('Failed to update lesson:', error);
        if (error.response && error.response.data.errors) {
            errorMessage.value = Object.values(error.response.data.errors).flat().join(', ');
        } else {
            errorMessage.value = 'Failed to update lesson. Please try again.';
        }
    }finally {
        loader.value = false;
    }
};

const courseId = route.params.id;

const addLesson = async () => {
    try {
        const newLessonTitle = 'New Lesson Title';
        const newMarkdownText = 'Dushundirilish';

        const formData = new FormData();
        formData.append('title', newLessonTitle);
        formData.append('markdown_text', newMarkdownText);
        formData.append('course_id', courseId);

        const response = await apiClient.post(`/courses/${courseId}/lessons`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        showNotification('New lesson added successfully!');
        lessons.value.push({
            id: response.data.lesson.id,
            title: response.data.lesson.title || 'Default Title',
            markdown_text: response.data.lesson.markdown_text || 'Default Markdown Text',
            video_url: response.data.lesson.video_url || 'default_video.mp4',
            videoPreview: response.data.lesson.video_url ? `http://127.0.0.1:8000/storage/${response.data.lesson.video_url}` : 'http://127.0.0.1:8000/storage/default_video.mp4',
        });
        selectedLesson.value = lessons.value.length - 1;
    } catch (error) {
        console.error('Failed to add new lesson:', error);
        if (error.response && error.response.data.errors) {
            errorMessage.value = Object.values(error.response.data.errors).flat().join(', ');
        } else {
            errorMessage.value = 'Failed to add new lesson. Please try again.';
        }
    }
};

const fetchCourses = async () => {
    const courseId = route.params.id;
    try {
        const response = await apiClient.get(`/courses/${courseId}`);
        courses.value = response.data.course;
    } catch (error) {
        errorMessage.value = 'Failed to load course data.';
    } finally {
        loading.value = false;
    }
};

const createFirstLesson = async () => {
    await addLesson();
};

const editCourse = () => {
    const courseId = route.params.id;
    router.push({ name: 'CourseData', params: { id: courseId } });
};

onMounted(() => {
    const courseId = route.params.id;
    if (courseId) {
        fetchLessons(courseId);
    }
});
fetchCourses();
</script>



<style>
.fade-enter-from{
    opacity: 0;
    transform: translateY(-60px);
}
.fade-enter-to{
    opacity: 1;
    transform: translateY(0);
}

.fade-enter-active {
    transition: all 0.3s ease;
}
.fade-leave-from{
    opacity: 1;
    transform: translateY(0);
}
.fade-leave-to{
    opacity: 0;
    transform: translateY(-60px);
}
.fade-leave-active  {
    transition: all 0.3s ease;
}
</style>
