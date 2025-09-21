<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Lamaran Kerja</h1>

    <div v-if="loading">Memuat data...</div>

    <div v-else-if="applications.length === 0" class="text-gray-500">
      Belum ada lamaran.
    </div>

    <div v-else>
      <div
        v-for="app in applications"
        :key="app.id"
        class="bg-white shadow p-4 mb-2 rounded"
      >
        <h2 class="font-semibold">{{ app.company_name }} - {{ app.position }}</h2>
        <p>Status: {{ app.status }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import supabase from '../services/supabase';
import { useUserStore } from '../stores/user';
import { useRouter } from 'vue-router';

const applications = ref([]);
const loading = ref(true);
const router = useRouter();

const userStore = useUserStore();

onMounted(async () => {
  await userStore.fetchUser(); // ✅ pastikan user sudah ada

  const user = userStore.user;

  if (!user || !user.id) {
    console.warn('User belum login. Redirect ke /login');
    router.push('/login');
    return;
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Gagal mengambil data lamaran:', error);
  } else {
    applications.value = data;
  }

  loading.value = false;
});
</script>