<!-- src/views/TestView.vue -->
<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
      <h1 class="text-3xl font-bold text-center text-indigo-600 mb-6">TailwindCSS Test</h1>
      <p class="text-gray-700 text-center mb-6">
        If you can see this styled text, TailwindCSS is working correctly!
      </p>
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
        <p>TailwindCSS is properly configured!</p>
      </div>
      <div class="mt-6 flex justify-center">
        <router-link 
          to="/" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// This is a test view to verify TailwindCSS is working
</script>