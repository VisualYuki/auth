import { authService } from '@/service/auth'
import axios from 'axios'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/auth',
    },
    {
      path: '/auth',
      component: () => import('@/pages/auth.vue'),
      meta: {
        requireGuest: true,
      },
    },
    {
      path: '/main',
      meta: {
        requireAuth: true,
      },
      component: () => import('@/pages/main.vue'),
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  // if (to.meta.requireAuth) {
  //   if (getAccessToken()) {
  //     next()
  //   } else {
  //     await axios
  //       .post('http://localhost:1865/auth/refresh', {}, { withCredentials: true })
  //       .then((req, res) => {
  //         debugger
  //         setAccessToken(res.data.accessToken)
  //       })
  //   }

  //   return
  // }

  if (to.meta.requireGuest) {
    if (await authService.isAuth()) {
      next('/main')
    }
  }

  next()
})

export default router
