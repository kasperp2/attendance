import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MatrixView from '../views/MatrixView.vue'
import LoginView from '../views/LoginView.vue'
import NameView from '../views/NameView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/matrix',
      name: 'matrix',
      component: MatrixView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guest: true
      }
    },
    {
      path: '/names',
      name: 'names',
      component: NameView,
      meta: {
        requiresAuth: true
      }
    },
  ]
})


// Meta Handling
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  await auth.loginToken()
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!auth.user) {
      next({
        path: '/login'
      })
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.guest)) {
    if (!auth.user) {
      next()
    } else {
      next({ name: 'home' })
    }
  } else {
    next()
  }
})

export default router
