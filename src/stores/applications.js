// src/stores/applications.js
import { defineStore } from 'pinia'
import { supabase } from '../services/supabase'

export const useApplicationStore = defineStore('applications', {
  state: () => ({
    applications: [],
    application: null,
    stats: {
      total: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      no_response: 0
    }
  }),
  
  actions: {
    async fetchApplications() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching applications:', error)
        return
      }
      
      this.applications = data
      this.calculateStats()
    },
    
    async fetchApplication(id) {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching application:', error)
        return
      }
      
      this.application = data
      return data
    },
    
    async createApplication(applicationData) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      const { data, error } = await supabase
        .from('applications')
        .insert([
          {
            ...applicationData,
            user_id: user.id
          }
        ])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating application:', error)
        return
      }
      
      this.applications.unshift(data)
      this.calculateStats()
      return data
    },
    
    async updateApplication(id, updateData) {
      const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating application:', error)
        return
      }
      
      // Update in the list
      const index = this.applications.findIndex(app => app.id === id)
      if (index !== -1) {
        this.applications[index] = data
      }
      
      // Update single application if it's loaded
      if (this.application && this.application.id === id) {
        this.application = data
      }
      
      this.calculateStats()
      return data
    },
    
    async deleteApplication(id) {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting application:', error)
        return
      }
      
      // Remove from the list
      this.applications = this.applications.filter(app => app.id !== id)
      
      // Clear single application if it's the one being deleted
      if (this.application && this.application.id === id) {
        this.application = null
      }
      
      this.calculateStats()
    },
    
    calculateStats() {
      this.stats.total = this.applications.length
      this.stats.applied = this.applications.filter(app => app.status === 'applied').length
      this.stats.interview = this.applications.filter(app => app.status === 'interview').length
      this.stats.offer = this.applications.filter(app => app.status === 'offer').length
      this.stats.rejected = this.applications.filter(app => app.status === 'rejected').length
      this.stats.no_response = this.applications.filter(app => app.status === 'no_response').length
    }
  }
})