<script setup>
import { onMounted, ref } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/solid'

const ip = '192.168.0.117:3000';

// connect to websocket
const names = ref()
names.value = []
const newName = ref()

const cardWriteId = ref()

onMounted(async () => {
  await fetch('http://'+ip+'/name/get')
    .then(response => response.json())
    .then(data => names.value = data)

  const socket = new WebSocket('ws://'+ip+'/attendance')
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.action) {
      case 'card/confirm':
        names.value.find(n => n.id == cardWriteId.value).card_assigned = true
        cardWriteId.value = null
        break;
    }
  };
  
  dateChange();
})

const createName = () => {
  fetch('http://'+ip+'/name/create/' + newName.value)
  .then(response => response.json())
	.then(data => names.value = [...names.value, data])
}

const removeName = (nameId) => {
  fetch('http://'+ip+'/name/remove/' + nameId)
  names.value = names.value.filter(n => n.id != nameId)
}

const writeName = (nameId) => {
  cardWriteId.value = nameId
  fetch('http://'+ip+'/name/write/' + nameId)
}
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
            <button @click="removeName(name.id)" class="btn btn-error join-item"><XMarkIcon class="h-6 w-6"/></button>
          </div>
        </div>
      </div>
    </div>
</template>