// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../services/supabase'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import ApplicationFormView from '../views/ApplicationFormView.vue'
import ApplicationDetailView from '../views/ApplicationDetailView.vue'
import TestView from '../views/TestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/test',
      name: 'test',
      component: TestView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/applications/new',
      name: 'new-application',
      component: ApplicationFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/applications/:id',
      name: 'application-detail',
      component: ApplicationDetailView,
      meta: { requiresAuth: true },
      props: true
    }
  ]
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else {
    next()
  }
})

export default router
