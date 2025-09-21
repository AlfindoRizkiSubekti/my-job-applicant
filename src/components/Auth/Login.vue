<!-- src/components/Auth/Login.vue -->
<template>
  <div class="p-6 max-w-md mx-auto">
    <h1 class="text-xl font-bold mb-4">Login</h1>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" class="border p-2 w-full mb-2 rounded" />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 w-full mb-2 rounded" />
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const login = () => {
  console.log('Login dengan', email.value, password.value)
}
</script>
