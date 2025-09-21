<template>
  <div>
    <h2>Lamaran Tersimpan</h2>
    <ul>
      <li v-for="job in jobs" :key="job.title">
        <strong>{{ job.title }}</strong><br />
        {{ job.company }} - {{ job.date }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const jobs = ref([])

onMounted(() => {
  chrome.storage.local.get(['jobstreetApplications'], (result) => {
    jobs.value = result.jobstreetApplications || []
  })
})
</script>
