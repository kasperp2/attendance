<script setup>
import { onMounted, ref } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/solid'

const ip = import.meta.env.VITE_APP_API_URL

const names = ref()
names.value = []
const newName = ref()

const cardWriteId = ref()

onMounted(async () => {
  await fetch(ip+'/name/get', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(response => response.json())
    .then(data => names.value = data)

  const socket = new WebSocket(import.meta.env.VITE_APP_WS_URL+'/attendance')
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.action) {
      case 'card/confirm':
        names.value.find(n => n.id == cardWriteId.value).card_assigned = true
        cardWriteId.value = null
        break;
    }
  };
})

const createName = () => {
  fetch(ip+'/name/create/' + newName.value, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
  .then(response => response.json())
	.then(data => names.value = [...names.value, data])
}

const removeName = (nameId) => {
  fetch(ip+'/name/remove/' + nameId, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
  names.value = names.value.filter(n => n.id != nameId)
}

const writeName = (nameId) => {
  cardWriteId.value = nameId
  fetch(ip+'/name/write/' + nameId, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
}

const nameToRemove = ref([])
</script>

<template>
  <div class="join">
    <input type="text" class="input input-bordered join-item" name="name" placeholder="full name" v-model="newName" />
    <button @click="createName" class="btn btn-primary join-item">create</button>
  </div>
  
  <div class="collapse collapse-open bg-base-200 mt-4">
    <input type="checkbox" /> 
    <div class="collapse-title text-xl font-medium">
      Names
    </div>
    <div class="collapse-content"> 
      <div class="grid gap-4">
        <div v-for="(name, i) in names" class="join">
          <div class="join-item input bg-base-100 flex items-center ">{{ name.name }}</div>
          <button @click="writeName(name.id)" :class="'btn join-item ' + (name.card_assigned ? 'btn-success' : 'btn-primary')">
            <div v-if="name.id == cardWriteId"><span class="loading loading-ring loading-lg"></span></div>
            <div v-else-if="name.card_assigned">assigned</div>
            <div v-else>write</div>
          </button>
          <button @click="() => {nameToRemove.value = name}" class="btn btn-error join-item" onclick="remove_modal.showModal()"><XMarkIcon class="h-6 w-6"/></button>
        </div>
      </div>
    </div>
  </div>
  
  <dialog id="remove_modal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">You Are About To Remove {{ nameToRemove?.value?.name }}?</h3>
      <p class="py-4">This will remove all records related to {{ nameToRemove?.value?.name }} permanently!<br>This action can NOT be undone!</p>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn">Cancel</button>
          <button class="btn btn-error" @click="removeName(nameToRemove?.value?.id)">Remove</button>
        </form>
      </div>
    </div>
  </dialog>
</template>