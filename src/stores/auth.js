// src/stores/auth.js
import { defineStore } from 'pinia'
import { supabase } from '../services/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
  }),
  actions: {
    async init() {
      const { data } = await supabase.auth.getUser()
      this.user = data?.user ?? null

      supabase.auth.onAuthStateChange((event, session) => {
        this.user = session?.user ?? null
      })
    },
    async signIn(email, password) {
      const res = await supabase.auth.signInWithPassword({ email, password })
      if (res.error) throw res.error
      this.user = res.data.user
    },
    async signUp(email, password) {
      const res = await supabase.auth.signUp({ email, password })
      if (res.error) throw res.error
      // may require email confirmation
      this.user = res.data.user
    },
    async signOut() {
      await supabase.auth.signOut()
      this.user = null
    }
  }
})
