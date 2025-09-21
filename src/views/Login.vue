<template>
  <div class="min-h-screen flex items-center justify-center">
    <form @submit.prevent="login" class="w-full max-w-sm space-y-4">
      <input v-model="email" type="email" placeholder="Email" class="input" />
      <input v-model="password" type="password" placeholder="Password" class="input" />
      <button class="btn-primary w-full">Login</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../stores/user';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();
const userStore = useUserStore();

async function login() {
  try {
    await userStore.login(email.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    alert('Login failed');
  }
}
</script>
