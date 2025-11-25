<template>
  <div style="text-align: center">
    <InputText v-model="login" placeholder="login" style="margin-bottom: 10px" />
    <br />
    <InputText v-model="password" placeholder="password" style="margin-bottom: 10px" />
    <br />
    <Button @click="doAuth"> auth </Button>
  </div>
</template>

<script lang="ts" setup>
import { InputText, Button } from 'primevue'
import { ref } from 'vue'
import { authService } from '@/service/auth'

const login = ref('demo')
const password = ref('demo')

function doAuth() {
  authService.auth(login.value, password.value)
}
</script>
