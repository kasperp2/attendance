<script setup>
import { onMounted, ref } from 'vue';
import { XMarkIcon, CheckIcon, ClockIcon } from '@heroicons/vue/24/solid'

// const ip = 'rspi.local:3000';
const ip = '192.168.0.117:3000';

const today = ref();
today.value = new Date().toISOString().slice(0, 10);

const meetingTime = ref();
meetingTime.value = localStorage.getItem("Meeting time") || ref();

function timeChange() {
  localStorage.setItem("Meeting time", meetingTime.value);
}

// connect to websocket
const names = ref()
const newName = ref()

names.value = []

const cardWriteId = ref()

onMounted(async () => {
  await fetch('http://'+ip+'/name/get')
    .then(response => response.json())
    .then(data => names.value = data)
  
  const socket = new WebSocket('ws://'+ip+'/attendance')
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.action) {
      case 'attendant':

        names.value = names.value.map(n => {
          if (n.id == data.data.name_id) {
            speak('velkommen ' + n.name)
            n.arrivedAt = data.data.createdAt
          }
          return n
        })
        break;
      case 'card/confirm':
        names.value.find(n => n.id == cardWriteId.value).card_assigned = true
        cardWriteId.value = null
        break;
    }
  };


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

const speak = (text) => {
  var msg = new SpeechSynthesisUtterance();
  msg.text = text;
  msg.lang = 'da';
  speechSynthesis.speak(msg);
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
  
  
  <div class="rounded-box bg-base-200 mt-4"> 
    <div class="collapse-title text-xl font-medium">
      <div class="inline">
        Attendance
      </div>
      <div class="inline flex space-x-5 float-end">
        <input v-model="today" type="date" class="input input-bordered h-9 w-32 p-1 focus:outline-none focus-within:outline-none">
        <input v-model="meetingTime" type="time" name="clock" @change="timeChange" class="input input-bordered h-9 w-24 pr-1 focus:outline-none focus-within:outline-none" />
      </div>
    </div>
    <div class="rounded-box overflow-x-auto">
      <table class="table table-zebra bg-base-100">
        <thead class="bg-base-200">
          <tr>
            <th>Present</th>
            <th>Name</th>
            <th>Arrived</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(name) in names" class="">
            <td class="whitespace-nowrap w-0 text-center">
              <label class="swap swap-rotate">
                <div :class="'text-error swap-'+(name.arrivedAt ? 'on' : 'off')"><XMarkIcon class="h-6 w-6"/></div>
                <div :class="'text-success swap-'+(name.arrivedAt ? 'off' : 'on')"><CheckIcon class="h-6 w-6"/></div>
              </label> 
            </td>
            <td>{{ name.name }}</td>
            <td v-if="name.arrivedAt">{{ (new Date(name.arrivedAt)).toLocaleTimeString().slice(0, 5) }}</td>
            <td v-else>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>