<script setup>
import { RouterLink, RouterView } from 'vue-router'

const themes = [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
    ]
</script>

<template>
  <div class="navbar bg-base-300 mb-4">
    <RouterLink class="btn btn-ghost text-xl" to="/">Attendance</RouterLink>

    <RouterLink class="btn btn-ghost text-xl" to="/names">Names</RouterLink>
    <div class="absolute right-1">
      <div class="dropdown">
        <div tabindex="0" role="button" class="btn m-1">
          Theme
          <svg width="12px" height="12px" class="h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
        </div>
        <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box">
          <li v-for="theme in themes"><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" :aria-label="theme" :value="theme"/></li>
        </ul>
      </div>

      <div class="btn btn-ghost text-xl">User name</div>
      
    </div>
  </div>

  <div class="container mx-auto">
    <RouterView />
  </div>
</template>

<style scoped>
</style>
