<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const username = ref('admin');
const password = ref('admin');

</script>

<template>
    <div class="flex flex-col rounded-box bg-base-200 m-auto p-4 w-1/2">
        <label for="">Username</label>
        <input v-model="username" type="text" placeholder="Type here" class="input" />

        <label class="mt-4" for="">Password</label>
        <input v-model="password" type="text" placeholder="Type here" class="input" />
        <button @click="auth.login(username, password)" class="btn btn-primary mt-8">Login</button>
    </div>
</template>