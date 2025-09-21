import { defineStore } from 'pinia';
import supabase from '../services/supabase';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        this.error = error.message;
        this.loading = false;
        throw error;
      }

      this.user = data.user;
      this.loading = false;
    },

    async fetchUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        this.user = null;
        this.error = error.message;
        return;
      }

      this.user = data.user;
    },

    async logout() {
      await supabase.auth.signOut();
      this.user = null;
    },

    /**
     * Optional: Panggil di main.js saat start app
     */
    async init() {
      const { data, error } = await supabase.auth.getSession();
      if (data.session?.user) {
        this.user = data.session.user;
      } else {
        this.user = null;
      }
    },
  },
});
