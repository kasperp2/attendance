<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid'

const auth = useAuthStore()

const username = ref('admin');
const password = ref('admin');

let showPassword = ref(false);

const togglePassword = () => {
    showPassword.value = !showPassword.value;
}

</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div class="flex flex-col rounded-box bg-base-200 p-4 w-1/2">
        <label for="">Username</label>
        <input v-model="username" type="text" placeholder="Type here" class="input" />

        <label class="mt-4" for="">Password</label>
        <div class="relative">
          <label class="swap swap-rotate">
            <input v-model="password" :type="(showPassword ? 'text' : 'password')" placeholder="Type here" class="input" id="password"/>
            <div :class="'absolute right-4 translate-y-1/2 swap-'+(showPassword ? 'on' : 'off')"><EyeIcon class="h-6 w-6 join-item" @click="togglePassword"/></div>
            <div :class="'absolute right-4 translate-y-1/2 swap-'+(showPassword ? 'off' : 'on')"><EyeSlashIcon class="h-6 w-6" @click="togglePassword"/></div>
          </label>
        </div>
        <button @click="auth.login(username, password)" class="btn btn-primary mt-8">Login</button>
    </div>
  </div>
</template>