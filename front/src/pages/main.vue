<template>
  <Button @click="protectedApi()"> protected </Button>
  <Button @click="refreshTokenApi()"> refresh token </Button>
  <Button @click="logout()"> logout </Button>
</template>

<script lang="ts" setup>
import { authService } from '@/service/auth'
import axios, { type AxiosResponse } from 'axios'
import { Button } from 'primevue'
import { useRouter } from 'vue-router'

const router = useRouter()

async function logout() {
  // await axios
  //   .post('http://localhost:1865/auth/logout', {}, { withCredentials: true })
  //   .then((response: AxiosResponse<{ accessToken: string }>) => {
  //     router.push('/auth')
  //   })
}

async function protectedApi() {
  // await axios
  //   .post('http://localhost:1865/protected', {}, { withCredentials: true })
  //   .then((req, res) => {
  //     alert(res.data)
  //   })
}

async function refreshTokenApi() {
  authService.refreshAccessToken()
}
</script>

<style lang="scss" scoped></style>
